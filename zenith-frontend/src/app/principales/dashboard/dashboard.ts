import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import { DashboardService, HabitoResumen, ResumenDashboard } from '../../core/servicios/dashboard.service';
import { HabitosService, Habito } from '../../core/servicios/habitos.service';
import { BitacoraService } from '../../core/servicios/bitacora.service';
import { EventosService, Evento } from '../../core/servicios/eventos.service';
import { EstadisticasService, Estadisticas } from '../../core/servicios/estadisticas.service';
import { FinanzasService, MetodoPago, Movimiento } from '../../core/servicios/finanzas.service';
import { GimnasioService, PlanHoy } from '../../core/servicios/gimnasio.service';
import { ModalDetallesHabito, DetallesHabito } from '../../compartidos/modal-detalles-habito/modal-detalles-habito';
import { ModalTimer } from '../../compartidos/modal-timer/modal-timer';

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
  private readonly finanzasService = inject(FinanzasService);
  private readonly gimnasioService = inject(GimnasioService);

  private suscripciones: Subscription[] = [];
  private metaInfo = new Map<number, Habito>();

  cargando = signal(true);
  error = signal('');
  resumen = signal<ResumenDashboard | null>(null);
  habitos = signal<HabitoVista[]>([]);
  eventosProximos = signal<Evento[]>([]);
  cargandoHabitos = signal(true);
  cargandoEventos = signal(true);
  cargandoRegistro = signal(false);
  stats = signal<Estadisticas | null>(null);
  cargandoStats = signal(true);
  metodosPago = signal<MetodoPago[]>([]);
  movimientos = signal<Movimiento[]>([]);
  cargandoMetodos = signal(true);
  cargandoMovimientos = signal(true);
  planHoy = signal<PlanHoy | null>(null);
  cargandoPlan = signal(true);
  habitosDetalles = signal<DetallesHabito | null>(null);
  recaidaModal = signal<{ nombre: string } | null>(null);
  timerAbierto = signal(false);
  timerHabitoId = signal(0);
  timerHabitoNombre = signal('');
  timerMinutos = signal(25);
  timerPomodoro = signal(false);

  fechaHoy = '';

  get nombre(): string {
    return this.authService.usuario()?.nombre || '';
  }

  get saludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
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
      this.estadisticasService.obtenerGenerales('mes').subscribe({
        next: (datos) => {
          this.stats.set(datos);
          this.cargandoStats.set(false);
        },
        error: () => this.cargandoStats.set(false)
      })
    );

    this.suscripciones.push(
      this.finanzasService.obtenerMetodosPago().subscribe({
        next: (metodos) => {
          this.metodosPago.set(metodos);
          this.cargandoMetodos.set(false);
        },
        error: () => this.cargandoMetodos.set(false)
      })
    );

    this.suscripciones.push(
      this.finanzasService.obtenerMovimientos().subscribe({
        next: (movimientos) => {
          this.movimientos.set(movimientos);
          this.cargandoMovimientos.set(false);
        },
        error: () => this.cargandoMovimientos.set(false)
      })
    );

    this.suscripciones.push(
      this.gimnasioService.obtenerPlan().subscribe({
        next: (plan) => {
          this.planHoy.set(plan);
          this.cargandoPlan.set(false);
        },
        error: () => this.cargandoPlan.set(false)
      })
    );
  }

  get saldoTotal(): number {
    return this.metodosPago().reduce((total, m) => total + Number(m.saldo_actual), 0);
  }

  get cargandoFinanzas(): boolean {
    return this.cargandoMetodos() || this.cargandoMovimientos();
  }

  get entradasMes(): number {
    return this.movimientosDeMes('ENTRADA');
  }

  get gastosMes(): number {
    return this.movimientosDeMes('GASTO');
  }

  private movimientosDeMes(tipo: Movimiento['tipo_movimiento']): number {
    const mes = this.fechaMes();
    return this.movimientos()
      .filter(m => m.tipo_movimiento === tipo && String(m.fecha).slice(0, 7) === mes)
      .reduce((total, m) => total + Number(m.cantidad), 0);
  }

  private fechaMes(): string {
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset();
    return new Date(ahora.getTime() - offset * 60000).toISOString().slice(0, 7);
  }

  formatearMoneda(valor: number | string): string {
    return Number(valor).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
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
    if (habito.tipo_habito === 4) {
        return habito.estado === 'RECAIDA';
    }
    return habito.estado === 'COMPLETADO';
  }

  bloqueado(habito: HabitoVista): boolean {
    if (habito.tipo_habito === 4) {
        return habito.estado === 'RECAIDA';
    }
    return habito.estado === 'COMPLETADO';
  }

  alternarHabito(habito: HabitoVista) {
    if (this.cargandoRegistro() || this.bloqueado(habito)) return;
    this.cargandoRegistro.set(true);

    const datos: { incremento?: number; estado?: string } = {};
    if (habito.tipo_habito === 4) {
      if (habito.estado === 'RECAIDA') {
        datos.estado = 'EVITADO';
      } else {
        datos.estado = 'RECAIDA';
      }
    } else if (habito.estado === 'COMPLETADO') {
      datos.estado = 'NO_COMPLETADO';
    }

    this.suscripciones.push(
      this.bitacoraService.registrar({ habito: habito.id_habito, ...datos }).subscribe({
        next: (respuesta) => {
          this.actualizarEstadoLocal(habito.id_habito, respuesta.estado, respuesta.valor_realizado);
          if (respuesta.estado === 'RECAIDA') {
            this.mostrarMotivacion(habito.nombre);
          }
          this.cargandoRegistro.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargandoRegistro.set(false);
        }
      })
    );
  }

  private mostrarMotivacion(nombre: string) {
    this.recaidaModal.set({ nombre });
  }

  incrementarRepeticion(habito: HabitoVista) {
    if (this.cargandoRegistro() || this.bloqueado(habito)) return;
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
  }

  verDetalles(habito: HabitoVista) {
    this.habitosDetalles.set({
      id_habito: habito.id_habito,
      nombre: habito.nombre,
      descripcion: habito.descripcion || null,
      tipo_habito: habito.tipo_habito,
      tipo_nombre: habito.tipo_nombre || '',
      meta: habito.meta ?? null,
      unidad: habito.unidad || null,
      esBueno: this.esBueno(habito),
      frecuencia: habito.frecuencia || 'DIARIO',
      dias: habito.dias ?? [],
      dia_del_mes: habito.dia_del_mes ?? null,
      pomodoro_habilitado: habito.pomodoro_habilitado ?? false
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