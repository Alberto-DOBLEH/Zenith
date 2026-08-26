import { Component, ElementRef, OnDestroy, OnInit, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../core/servicios/auth.service';
import { DashboardService, HabitoResumen, ResumenDashboard } from '../../core/servicios/dashboard.service';
import { HabitosService, Habito } from '../../core/servicios/habitos.service';
import { BitacoraService, RegistroBitacora } from '../../core/servicios/bitacora.service';
import { EventosService, Evento } from '../../core/servicios/eventos.service';
import { EstadisticasService, Estadisticas } from '../../core/servicios/estadisticas.service';
import { ModalDetallesHabito, DetallesHabito } from '../../compartidos/modal-detalles-habito/modal-detalles-habito';
import { ModalTimer } from '../../compartidos/modal-timer/modal-timer';

Chart.register(...registerables);

interface DatosSemana {
  labels: string[];
  valores: (number | null)[];
}

interface HabitoVista extends HabitoResumen {
    meta?: number | null;
    unidad?: string | null;
    tipo_nombre?: string;
    descripcion?: string | null;
    frecuencia?: string;
    dias?: string[];
    dia_del_mes?: number | null;
    pomodoro_habilitado?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ModalDetallesHabito, ModalTimer],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly habitosService = inject(HabitosService);
  private readonly bitacoraService = inject(BitacoraService);
  private readonly eventosService = inject(EventosService);
  private readonly estadisticasService = inject(EstadisticasService);

  private suscripciones: Subscription[] = [];
  private metaInfo = new Map<number, Habito>();
  private graficaSemanal: Chart | null = null;
  private graficaMensual: Chart | null = null;

  private readonly canvasSemanal = viewChild<ElementRef<HTMLCanvasElement>>('canvasSemanal');
  private readonly canvasMensual = viewChild<ElementRef<HTMLCanvasElement>>('canvasMensual');

  cargando = signal(true);
  error = signal('');
  resumen = signal<ResumenDashboard | null>(null);
  habitos = signal<HabitoVista[]>([]);
  eventosProximos = signal<Evento[]>([]);
  cargandoHabitos = signal(true);
  cargandoEventos = signal(true);
  cargandoRegistro = signal(false);
  habitosDetalles = signal<DetallesHabito | null>(null);
  timerAbierto = signal(false);
  timerHabitoId = signal(0);
  timerHabitoNombre = signal('');
  timerMinutos = signal(25);
  timerPomodoro = signal(false);
  datosSemana = signal<DatosSemana | null>(null);
  estadisticas = signal<Estadisticas | null>(null);

  fechaHoy = '';

  constructor() {
    effect(() => {
      const canvas = this.canvasSemanal();
      const datos = this.datosSemana();
      if (canvas && datos) {
        this.dibujarSemanal(canvas.nativeElement, datos);
      }
    });

    effect(() => {
      const canvas = this.canvasMensual();
      const datos = this.estadisticas();
      if (canvas && datos) {
        this.dibujarMensual(canvas.nativeElement, datos);
      }
    });
  }

  get nombre(): string {
    return this.authService.usuario()?.nombre || '';
  }

  ngOnInit() {
    if (!this.authService.usuario()) {
      this.authService.cargarPerfil().subscribe();
    }

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    this.fechaHoy = fecha.charAt(0).toUpperCase() + fecha.slice(1);

    this.cargarDatos();
  }

  ngOnDestroy() {
    this.graficaSemanal?.destroy();
    this.graficaMensual?.destroy();
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  private cargarDatos() {
    this.cargando.set(true);
    this.error.set('');

    this.suscripciones.push(
      this.dashboardService.obtenerResumen().subscribe({
        next: (resumen) => {
          this.resumen.set(resumen);
          this.habitos.set(resumen.habitos.map(h => this.enriquecer(h)));
          this.cargando.set(false);
          this.cargandoHabitos.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargando.set(false);
          this.cargandoHabitos.set(false);
        }
      })
    );

    this.suscripciones.push(
      this.habitosService.obtener().subscribe({
        next: (habitos) => {
          habitos.forEach(h => this.metaInfo.set(h.id_habito, h));
          this.habitos.set(this.habitos().map(h => this.enriquecer(h)));
          this.cargandoHabitos.set(false);
        },
        error: () => this.cargandoHabitos.set(false)
      })
    );

    this.suscripciones.push(
      this.eventosService.obtener().subscribe({
        next: (eventos) => {
          const ahora = new Date();
          this.eventosProximos.set(eventos
            .filter(e => new Date(e.fecha_fin) >= ahora)
            .slice(0, 4));
          this.cargandoEventos.set(false);
        },
        error: () => this.cargandoEventos.set(false)
      })
    );

    this.suscripciones.push(
      this.bitacoraService.obtenerPorPeriodo('semana').subscribe({
        next: (registros) => this.datosSemana.set(this.calcularSemana(registros)),
        error: () => this.datosSemana.set(null)
      })
    );

    this.suscripciones.push(
      this.estadisticasService.obtenerGenerales().subscribe({
        next: (estadisticas) => this.estadisticas.set(estadisticas),
        error: () => this.estadisticas.set(null)
      })
    );
  }

  private calcularSemana(registros: RegistroBitacora[]): DatosSemana {
    const labels: string[] = [];
    const valores: (number | null)[] = [];

    for (let i = 6; i >= 0; i--) {
      const dia = new Date();
      dia.setDate(dia.getDate() - i);
      const etiqueta = dia.toLocaleDateString('es-MX', { weekday: 'short' });
      labels.push(etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1, 4));

      const delDia = registros.filter(r => this.mismoDiaLocal(r.fecha, dia));
      if (delDia.length === 0) {
        valores.push(null);
        continue;
      }
      const completados = delDia.filter(r => r.estado === 'COMPLETADO').length;
      valores.push(Math.round((completados / delDia.length) * 100));
    }

    return { labels, valores };
  }

  private mismoDiaLocal(fechaISO: string, dia: Date): boolean {
    const fecha = new Date(fechaISO);
    return fecha.getFullYear() === dia.getFullYear()
      && fecha.getMonth() === dia.getMonth()
      && fecha.getDate() === dia.getDate();
  }

  private dibujarSemanal(canvas: HTMLCanvasElement, datos: DatosSemana) {
    this.graficaSemanal?.destroy();
    this.graficaSemanal = new Chart(canvas, {
      type: 'line',
      data: {
        labels: datos.labels,
        datasets: [{
          label: '% cumplimiento',
          data: datos.valores,
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99,102,241,0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#6366F1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#717182', callback: (valor) => valor + '%' },
            grid: { color: 'rgba(255,255,255,0.06)' }
          },
          x: {
            ticks: { color: '#717182' },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  private dibujarMensual(canvas: HTMLCanvasElement, datos: Estadisticas) {
    this.graficaMensual?.destroy();
    this.graficaMensual = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completados', 'No completados'],
        datasets: [{
          data: [datos.completados, datos.no_completados],
          backgroundColor: ['#10B981', '#EF4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#717182', boxWidth: 12 }
          }
        }
      }
    });
  }

  private enriquecer(habito: HabitoResumen): HabitoVista {
    const info = this.metaInfo.get(habito.id_habito);
    return {
      ...habito,
      meta: info?.meta ?? null,
      unidad: info?.unidad ?? null,
      tipo_nombre: info?.tipo_nombre ?? '',
      descripcion: info?.descripcion ?? null,
      frecuencia: info?.frecuencia,
      dias: info?.dias ?? [],
      dia_del_mes: info?.dia_del_mes ?? null,
      pomodoro_habilitado: info?.pomodoro_habilitado ?? false
    };
  }

  esBueno(habito: HabitoVista): boolean {
    return habito.tipo_habito !== 4;
  }

  completado(habito: HabitoVista): boolean {
    return habito.estado === 'COMPLETADO';
  }

  marcado(habito: HabitoVista): boolean {
    return habito.estado === 'COMPLETADO' || habito.estado === 'EVITADO';
  }

  bloqueado(habito: HabitoVista): boolean {
    return (habito.tipo_habito === 1 && habito.estado === 'COMPLETADO') ||
      (habito.tipo_habito === 4 && habito.estado === 'EVITADO');
  }

  alternarHabito(habito: HabitoVista) {
    if (this.cargandoRegistro() || this.bloqueado(habito)) return;
    this.cargandoRegistro.set(true);

    const datos: { incremento?: number; estado?: string } = {};
    if (habito.tipo_habito === 4) {
      if (habito.estado === 'RECAIDA') {
        datos.estado = 'EVITADO';
      }
    } else if (habito.estado === 'COMPLETADO') {
      datos.estado = 'NO_COMPLETADO';
    }

    this.suscripciones.push(
      this.bitacoraService.registrar({ habito: habito.id_habito, ...datos }).subscribe({
        next: (respuesta) => {
          this.actualizarEstadoLocal(habito.id_habito, respuesta.estado, respuesta.valor_realizado);
          this.cargandoRegistro.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargandoRegistro.set(false);
        }
      })
    );
  }

  incrementarRepeticion(habito: HabitoVista) {
    if (this.cargandoRegistro()) return;
    this.cargandoRegistro.set(true);

    this.suscripciones.push(
      this.bitacoraService.registrar({ habito: habito.id_habito, incremento: 1 }).subscribe({
        next: (respuesta) => {
          this.actualizarEstadoLocal(habito.id_habito, respuesta.estado, respuesta.valor_realizado);
          this.cargandoRegistro.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargandoRegistro.set(false);
        }
      })
    );
  }

  private actualizarEstadoLocal(idHabito: number, estado: string, valorRealizado: number | null) {
    this.habitos.update(actuales =>
      actuales.map(h => h.id_habito === idHabito
        ? { ...h, estado, valor_realizado: valorRealizado }
        : h)
    );
    this.recalcularResumen();
  }

  private recalcularResumen() {
    const actual = this.resumen();
    if (!actual) return;

    const habitos = this.habitos();
    const positivos = habitos.filter(h => h.tipo_habito !== 4);
    const completados = positivos.filter(h => h.estado === 'COMPLETADO').length;
    const recaidas = habitos.filter(h => h.tipo_habito === 4 && h.estado === 'RECAIDA').length;

    this.resumen.set({
      ...actual,
      habitos_completados: completados,
      habitos_pendientes: positivos.length - completados,
      habitos_recaida: recaidas,
      porcentaje_cumplimiento: positivos.length > 0
        ? Math.round((completados / positivos.length) * 100)
        : 0
    });
  }

  verDetalles(habito: HabitoVista) {
    this.habitosDetalles.set({
      id_habito: habito.id_habito,
      nombre: habito.nombre,
      descripcion: habito.descripcion || null,
      tipo_nombre: habito.tipo_nombre || '',
      meta: habito.meta ?? null,
      unidad: habito.unidad || null,
      esBueno: this.esBueno(habito),
      frecuencia: habito.frecuencia || 'DIARIO',
      dias: habito.dias ?? [],
      dia_del_mes: habito.dia_del_mes ?? null
    });
  }

  abrirTimer(habito: HabitoVista) {
    this.timerHabitoId.set(habito.id_habito);
    this.timerHabitoNombre.set(habito.nombre);
    this.timerMinutos.set(habito.meta ?? 25);
    this.timerPomodoro.set(habito.pomodoro_habilitado ?? false);
    this.timerAbierto.set(true);
  }

  cerrarTimer() {
    this.timerAbierto.set(false);
    this.cargarDatos();
  }

  formatearEvento(fecha: string): string {
    const fechaDate = new Date(fecha);
    return fechaDate.toLocaleDateString('es-MX', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
}