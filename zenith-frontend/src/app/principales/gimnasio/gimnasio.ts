import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import {
  GimnasioService,
  PlanHoy,
  EjercicioHoy,
  SerieHistorial,
  EntrenamientoResumen,
  EntrenamientoDetalle,
  EjercicioEntrenado
} from '../../core/servicios/gimnasio.service';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface EjercicioActivo extends EjercicioHoy {
  series: SerieHistorial[];
}

interface BorradorSerie {
  repeticiones: number | null;
  peso: number | null;
  unidad_peso: 'kg' | 'lbs';
}

interface Confirmacion {
  titulo: string;
  mensaje: string;
  tipo: 'finalizar' | 'entrenamiento';
  id: number;
}

@Component({
  selector: 'app-gimnasio',
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './gimnasio.html',
  styleUrl: './gimnasio.css'
})
export class Gimnasio implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly fb = inject(FormBuilder);

  private suscripciones: Subscription[] = [];

  cargando = signal(true);
  error = signal('');
  mensajeExito = signal('');
  plan = signal<PlanHoy | null>(null);
  historial = signal<EntrenamientoResumen[]>([]);
  filtrando = signal(false);

  cargandoSerie = signal(false);
  serieActiva = signal<EjercicioEntrenado[] | null>(null);
  recetaActiva = signal<EjercicioHoy[]>([]);
  errorActivo = signal('');
  serieEditando = signal<{ id_serie: number; repeticiones: number; peso: number; unidad_peso: 'kg' | 'lbs' } | null>(null);
  guardando = signal(false);

  modalDetalleAbierto = signal(false);
  detalle = signal<EntrenamientoDetalle | null>(null);
  cargandoDetalle = signal(false);

  confirmacion = signal<Confirmacion | null>(null);
  confirmando = signal(false);

  formFiltros = this.fb.group({
    mes: ['']
  });

  private borradores: Record<number, BorradorSerie> = {};

  ngOnInit() {
    this.cargarPlan();
    this.cargarHistorial();
  }

  ngOnDestroy() {
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  private cargarPlan() {
    this.error.set('');
    this.suscripciones.push(
      this.gimnasioService.obtenerPlan().subscribe({
        next: (plan) => {
          this.plan.set(plan);
          this.cargando.set(false);
          this.cargarActivo();
        },
        error: (error) => {
          if (error?.status === 404) {
            this.plan.set(null);
          } else {
            this.error.set(this.authService.manejarError(error));
          }
          this.cargando.set(false);
        }
      })
    );
  }

  private cargarHistorial(filtros?: { mes?: string }) {
    this.suscripciones.push(
      this.gimnasioService.obtenerHistorial(filtros).subscribe({
        next: (historial) => this.historial.set(historial),
        error: (error) => {
          if (error?.status !== 404) {
            this.error.set(this.authService.manejarError(error));
          }
        }
      })
    );
  }

  private cargarActivo() {
    const activo = this.plan()?.entrenamiento_activo ?? null;

    if (!activo) {
      this.serieActiva.set(null);
      this.recetaActiva.set([]);
      this.serieEditando.set(null);
      this.borradores = {};
      return;
    }

    this.cargandoSerie.set(true);
    this.suscripciones.push(
      this.gimnasioService.obtenerEntrenamiento(activo.id_entrenamiento).subscribe({
        next: (detalle) => {
          this.serieActiva.set(detalle.ejercicios);
          this.cargandoSerie.set(false);

          const plan = this.plan();
          if (plan?.sesion && plan.sesion.id_sesion_plan === activo.id_sesion_plan) {
            this.recetaActiva.set(plan.ejercicios);
            return;
          }

          if (detalle.id_split) {
            this.suscripciones.push(
              this.gimnasioService.obtenerSplit(detalle.id_split).subscribe({
                next: (split) => {
                  const sesion = split.sesiones.find(s => s.id_sesion_plan === activo.id_sesion_plan);
                  this.recetaActiva.set((sesion?.ejercicios ?? []).map(e => ({
                    ...e,
                    pr: null,
                    ultima_vez: null
                  })));
                },
                error: () => this.recetaActiva.set([])
              })
            );
          } else {
            this.recetaActiva.set([]);
          }
        },
        error: (error) => {
          this.errorActivo.set(this.authService.manejarError(error));
          this.cargandoSerie.set(false);
        }
      })
    );
  }

  get activo(): number | null {
    return this.plan()?.entrenamiento_activo?.id_entrenamiento ?? null;
  }

  get planActual(): PlanHoy | null {
    return this.plan();
  }

  get fechaLarga(): string {
    const plan = this.plan();
    if (!plan) return '';
    const [, mes, dia] = plan.fecha.split('-');
    const nombreMes = MESES[Number(mes) - 1] ?? '';
    const diaSemana = DIAS[plan.dia_semana - 1] ?? '';
    return `${diaSemana.toLowerCase()} ${Number(dia)} de ${nombreMes.toLowerCase()}`;
  }

  get ejerciciosActivos(): EjercicioActivo[] {
    const receta = this.recetaActiva();
    const detalle = this.serieActiva() ?? [];

    const resultado: EjercicioActivo[] = receta.map(ej => ({
      ...ej,
      series: detalle.find(d => d.id_ejercicio === ej.id_ejercicio)?.series ?? []
    }));

    for (const ej of detalle) {
      if (!receta.some(r => r.id_ejercicio === ej.id_ejercicio)) {
        resultado.push({
          id_ejercicio: ej.id_ejercicio,
          nombre: ej.nombre,
          grupo_muscular: ej.grupo_muscular,
          orden: ej.orden ?? 9999,
          pr: null,
          ultima_vez: null,
          series: ej.series
        });
      }
    }

    return resultado.sort((a, b) => a.orden - b.orden);
  }

  borradorPara(idEjercicio: number): BorradorSerie {
    if (!this.borradores[idEjercicio]) {
      this.borradores[idEjercicio] = { repeticiones: null, peso: null, unidad_peso: 'kg' };
    }
    return this.borradores[idEjercicio];
  }

  textoDia(dia: number): string {
    return DIAS[dia - 1] ?? '';
  }

  horaInicio(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  fechaCorta(iso: string): string {
    const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  get mesesDisponibles(): { valor: string; nombre: string }[] {
    const anio = (this.plan()?.fecha ?? this.fechaLocal()).slice(0, 4);
    return MESES.map((nombre, i) => ({
      valor: `${anio}-${String(i + 1).padStart(2, '0')}`,
      nombre
    }));
  }

  private fechaLocal(): string {
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset();
    return new Date(ahora.getTime() - offset * 60000).toISOString().split('T')[0];
  }

  onCambioMes(event: Event) {
    const mes = (event.target as HTMLSelectElement).value;
    this.formFiltros.patchValue({ mes });
    this.filtrando.set(true);
    this.suscripciones.push(
      this.gimnasioService.obtenerHistorial(mes ? { mes } : undefined).subscribe({
        next: (historial) => {
          this.historial.set(historial);
          this.filtrando.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.filtrando.set(false);
        }
      })
    );
  }

  limpiarFiltroMes() {
    this.formFiltros.patchValue({ mes: '' });
    this.onCambioMes({ target: { value: '' } } as unknown as Event);
  }

  iniciar() {
    this.error.set('');
    this.guardando.set(true);
    this.suscripciones.push(
      this.gimnasioService.iniciarEntrenamiento().subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.mensajeExito.set(respuesta.message);
          this.cargarPlan();
          this.cargarHistorial();
        },
        error: (error) => {
          this.guardando.set(false);
          this.error.set(this.authService.manejarError(error));
        }
      })
    );
  }

  pedirFinalizar() {
    const plan = this.plan();
    if (!plan?.entrenamiento_activo) return;
    this.confirmacion.set({
      titulo: 'Finalizar entrenamiento',
      mensaje: `Se cerrará la sesión de ${plan.entrenamiento_activo.nombre_sesion} y se guardará en el historial.`,
      tipo: 'finalizar',
      id: plan.entrenamiento_activo.id_entrenamiento
    });
  }

  pedirEliminarEntrenamiento(idEntrenamiento: number) {
    this.confirmacion.set({
      titulo: 'Eliminar entrenamiento',
      mensaje: 'Se borrará el registro y todas sus series. Esta acción no se puede deshacer.',
      tipo: 'entrenamiento',
      id: idEntrenamiento
    });
  }

  cerrarConfirmacion() {
    this.confirmacion.set(null);
  }

  ejecutarConfirmacion() {
    const confirmacion = this.confirmacion();
    if (!confirmacion) return;

    this.confirmando.set(true);
    this.error.set('');

    const operacion = confirmacion.tipo === 'finalizar'
      ? this.gimnasioService.finalizarEntrenamiento(confirmacion.id)
      : this.gimnasioService.eliminarEntrenamiento(confirmacion.id);

    this.suscripciones.push(
      operacion.subscribe({
        next: (respuesta) => {
          this.confirmando.set(false);
          this.confirmacion.set(null);
          this.mensajeExito.set(respuesta.message);
          this.cargarPlan();
          this.cargarHistorial();
        },
        error: (error) => {
          this.confirmando.set(false);
          this.error.set(this.authService.manejarError(error));
          this.confirmacion.set(null);
        }
      })
    );
  }

  private validarBorrador(borrador: BorradorSerie): string {
    if (!borrador.repeticiones || !Number.isInteger(borrador.repeticiones) || borrador.repeticiones < 1) {
      return 'Las repeticiones deben ser un número entero mayor a 0.';
    }
    if (!borrador.peso || borrador.peso <= 0) {
      return 'El peso debe ser mayor a 0.';
    }
    return '';
  }

  agregarSerie(idEjercicio: number) {
    const activo = this.activo;
    if (activo === null) return;

    const borrador = this.borradorPara(idEjercicio);
    const validacion = this.validarBorrador(borrador);
    if (validacion) {
      this.errorActivo.set(validacion);
      return;
    }

    const ejercicios = this.ejerciciosActivos;
    const ejercicio = ejercicios.find(e => e.id_ejercicio === idEjercicio);
    const ultima = (ejercicio?.series ?? []).reduce((max, s) => Math.max(max, s.numero_serie), 0);

    this.errorActivo.set('');
    this.guardando.set(true);

    this.suscripciones.push(
      this.gimnasioService.crearSerie(activo, {
        id_ejercicio: idEjercicio,
        numero_serie: ultima + 1,
        repeticiones: borrador.repeticiones!,
        peso: borrador.peso!,
        unidad_peso: borrador.unidad_peso
      }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.borradores[idEjercicio] = { repeticiones: null, peso: null, unidad_peso: 'kg' };
          this.refrescarActivo();
        },
        error: (error) => {
          this.guardando.set(false);
          this.errorActivo.set(this.authService.manejarError(error));
        }
      })
    );
  }

  editarSerie(serie: SerieHistorial) {
    this.serieEditando.set({
      id_serie: serie.id_serie,
      repeticiones: serie.repeticiones,
      peso: serie.peso,
      unidad_peso: serie.unidad_peso
    });
  }

  cancelarEdicionSerie() {
    this.serieEditando.set(null);
  }

  guardarEdicionSerie() {
    const editando = this.serieEditando();
    if (!editando) return;

    if (!editando.repeticiones || !Number.isInteger(editando.repeticiones) || editando.repeticiones < 1) {
      this.errorActivo.set('Las repeticiones deben ser un número entero mayor a 0.');
      return;
    }
    if (!editando.peso || editando.peso <= 0) {
      this.errorActivo.set('El peso debe ser mayor a 0.');
      return;
    }

    this.errorActivo.set('');
    this.guardando.set(true);

    this.suscripciones.push(
      this.gimnasioService.editarSerie(editando.id_serie, {
        repeticiones: editando.repeticiones,
        peso: editando.peso,
        unidad_peso: editando.unidad_peso
      }).subscribe({
        next: () => {
          this.guardando.set(false);
          this.serieEditando.set(null);
          this.refrescarActivo();
        },
        error: (error) => {
          this.guardando.set(false);
          this.errorActivo.set(this.authService.manejarError(error));
        }
      })
    );
  }

  eliminarSerie(idSerie: number) {
    this.errorActivo.set('');
    this.guardando.set(true);

    this.suscripciones.push(
      this.gimnasioService.eliminarSerie(idSerie).subscribe({
        next: () => {
          this.guardando.set(false);
          this.serieEditando.set(null);
          this.refrescarActivo();
        },
        error: (error) => {
          this.guardando.set(false);
          this.errorActivo.set(this.authService.manejarError(error));
        }
      })
    );
  }

  private refrescarActivo() {
    this.cargarPlan();
    this.cargarHistorial();
  }

  abrirDetalle(idEntrenamiento: number) {
    this.modalDetalleAbierto.set(true);
    this.detalle.set(null);
    this.cargandoDetalle.set(true);

    this.suscripciones.push(
      this.gimnasioService.obtenerEntrenamiento(idEntrenamiento).subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.cargandoDetalle.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargandoDetalle.set(false);
          this.modalDetalleAbierto.set(false);
        }
      })
    );
  }

  cerrarDetalle() {
    this.modalDetalleAbierto.set(false);
    this.detalle.set(null);
  }

  totalSeries(detalle: EntrenamientoDetalle): number {
    return detalle.ejercicios.reduce((total, ej) => total + ej.series.length, 0);
  }

  seriesDe(ejercicio: EjercicioActivo): SerieHistorial[] {
    return ejercicio.series;
  }
}
