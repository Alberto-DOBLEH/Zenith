import { Component, ElementRef, OnDestroy, OnInit, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { EstadisticasService, Estadisticas as DatosGenerales, MapaEstadisticas, HabitoMapa } from '../../core/servicios/estadisticas.service';
import { BitacoraService, DiaEstadistica } from '../../core/servicios/bitacora.service';
import { AuthService } from '../../core/servicios/auth.service';

Chart.register(...registerables);

interface DatosSemana {
  labels: string[];
  valores: (number | null)[];
}

interface Celda {
  fecha: string;
  nivel: number;
  titulo: string;
}

interface FilaMapa {
  habito: HabitoMapa;
  celdas: (Celda | null)[];
}

const ESTADOS: Record<string, string> = {
  COMPLETADO: 'Completado',
  PARCIAL: 'Parcial',
  NO_COMPLETADO: 'No completado',
  EVITADO: 'Evitado',
  RECAIDA: 'Recaída'
};

@Component({
  selector: 'app-estadisticas',
  imports: [RouterLink],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class Estadisticas implements OnInit, OnDestroy {
  private readonly estadisticasService = inject(EstadisticasService);
  private readonly bitacoraService = inject(BitacoraService);
  private readonly authService = inject(AuthService);

  private suscripciones: Subscription[] = [];
  private graficaSemanal: Chart | null = null;
  private graficaMensual: Chart | null = null;

  private readonly canvasSemanal = viewChild<ElementRef<HTMLCanvasElement>>('canvasSemanal');
  private readonly canvasMensual = viewChild<ElementRef<HTMLCanvasElement>>('canvasMensual');

  cargando = signal(true);
  error = signal('');
  generales = signal<DatosGenerales | null>(null);
  mapa = signal<MapaEstadisticas | null>(null);
  filasMapa = signal<FilaMapa[]>([]);
  datosSemana = signal<DatosSemana | null>(null);

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
      const datos = this.generales();
      if (canvas && datos) {
        this.dibujarMensual(canvas.nativeElement, datos);
      }
    });
  }

  ngOnInit() {
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
      this.estadisticasService.obtenerGenerales().subscribe({
        next: (datos) => this.generales.set(datos),
        error: () => this.generales.set(null)
      })
    );

    this.suscripciones.push(
      this.bitacoraService.obtenerPorPeriodo('semana').subscribe({
        next: (registros) => this.datosSemana.set(this.calcularSemana(registros)),
        error: () => this.datosSemana.set(null)
      })
    );

    this.suscripciones.push(
      this.estadisticasService.obtenerMapa().subscribe({
        next: (mapa) => {
          this.mapa.set(mapa);
          this.filasMapa.set(this.construirMapas(mapa));
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargando.set(false);
        }
      })
    );
  }

  private calcularSemana(dias: DiaEstadistica[]): DatosSemana {
    const labels: string[] = [];
    const valores: (number | null)[] = [];

    const porFecha = new Map<string, DiaEstadistica>();
    for (const d of dias) {
      porFecha.set(String(d.fecha).slice(0, 10), d);
    }

    for (let i = 6; i >= 0; i--) {
      const dia = new Date();
      dia.setDate(dia.getDate() - i);
      const etiqueta = dia.toLocaleDateString('es-MX', { weekday: 'short' });
      labels.push(etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1, 4));

      const fechaStr = this.aFechaCorta(dia);
      const delDia = porFecha.get(fechaStr);
      if (!delDia || Number(delDia.total_programados) === 0) {
        valores.push(null);
        continue;
      }
      valores.push(Math.round((Number(delDia.completados) / Number(delDia.total_programados)) * 100));
    }

    return { labels, valores };
  }

  private construirMapas(mapa: MapaEstadisticas): FilaMapa[] {
    const inicio = this.aFechaLocal(mapa.inicio);
    const fin = this.aFechaLocal(mapa.fin);

    const primerLunes = new Date(inicio);
    primerLunes.setDate(primerLunes.getDate() - ((primerLunes.getDay() + 6) % 7));

    const diasTotales = Math.floor((fin.getTime() - primerLunes.getTime()) / 86400000) + 1;
    const columnas = Math.ceil(diasTotales / 7);

    return mapa.habitos.map(habito => {
      const porFecha = new Map(habito.dias.map(d => [d.fecha, d]));
      const celdas: (Celda | null)[] = [];

      for (let col = 0; col < columnas; col++) {
        for (let fila = 0; fila < 7; fila++) {
          const fecha = new Date(primerLunes);
          fecha.setDate(primerLunes.getDate() + col * 7 + fila);

          if (fecha < inicio || fecha > fin) {
            celdas.push(null);
            continue;
          }

          const fechaStr = this.aFechaCorta(fecha);
          const dia = porFecha.get(fechaStr);
          if (!dia) {
            celdas.push(null);
            continue;
          }

          celdas.push({
            fecha: fechaStr,
            nivel: dia.nivel,
            titulo: `${this.formatearFecha(fechaStr)} — ${this.textoEstado(habito.tipo_habito, dia.estado)}`
          });
        }
      }

      return { habito, celdas };
    });
  }

  textoEstado(tipoHabito: number, estado: string | null): string {
    if (estado === null) {
      return tipoHabito === 4 ? 'Sin recaída' : 'Sin registro';
    }
    return ESTADOS[estado] ?? estado;
  }

  private aFechaLocal(fecha: string): Date {
    const [a, m, d] = fecha.slice(0, 10).split('-').map(Number);
    return new Date(a, m - 1, d);
  }

  private aFechaCorta(fecha: Date): string {
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${m}-${d}`;
  }

  private formatearFecha(fecha: string): string {
    const [a, m, d] = fecha.split('-');
    return `${d}/${m}/${a}`;
  }

  get cumplimiento(): number {
    return Number(this.generales()?.cumplimiento ?? 0);
  }

  get totalCompletados(): number {
    return Number(this.generales()?.completados ?? 0);
  }

  get totalNoCompletados(): number {
    return Number(this.generales()?.no_completados ?? 0);
  }

  get hayDatosMensuales(): boolean {
    return this.totalCompletados + this.totalNoCompletados > 0;
  }

  get leyenda(): { nivel: number; texto: string }[] {
    return [
      { nivel: 2, texto: 'Completado' },
      { nivel: 1, texto: 'A medias' },
      { nivel: 0, texto: 'No hecho' }
    ];
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

  private dibujarMensual(canvas: HTMLCanvasElement, datos: DatosGenerales) {
    this.graficaMensual?.destroy();
    this.graficaMensual = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completados', 'No completados'],
        datasets: [{
          data: [Number(datos.completados), Number(datos.no_completados)],
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
}
