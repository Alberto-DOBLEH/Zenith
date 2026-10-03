import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import {
  GimnasioService,
  SplitResumen,
  SplitDetalle,
  SesionPlan,
  Ejercicio
} from '../../core/servicios/gimnasio.service';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface Confirmacion {
  titulo: string;
  mensaje: string;
  tipo: 'split' | 'sesion' | 'ejercicio';
  id: number;
}

@Component({
  selector: 'app-rutinas',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './rutinas.html',
  styleUrl: './rutinas.css'
})
export class Rutinas implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly fb = inject(FormBuilder);

  private suscripciones: Subscription[] = [];

  cargando = signal(true);
  error = signal('');
  mensajeExito = signal('');
  mensajeForm = signal('');
  guardando = signal(false);

  splits = signal<SplitResumen[]>([]);
  ejercicios = signal<Ejercicio[]>([]);

  modalSplitAbierto = signal(false);
  modoEdicionSplit = signal(false);
  splitEditandoId = signal<number | null>(null);

  modalDetalleAbierto = signal(false);
  splitDetalle = signal<SplitDetalle | null>(null);
  cargandoDetalle = signal(false);

  modalSesionAbierto = signal(false);
  modoEdicionSesion = signal(false);
  sesionEditandoId = signal<number | null>(null);

  modalRecetaAbierto = signal(false);
  recetaSesion = signal<SesionPlan | null>(null);
  recetaSeleccion = signal<number[]>([]);

  modalEjercicioAbierto = signal(false);
  modoEdicionEjercicio = signal(false);
  ejercicioEditandoId = signal<number | null>(null);

  confirmacion = signal<Confirmacion | null>(null);
  confirmando = signal(false);

  formFiltros = this.fb.group({
    grupo: [''],
    q: ['']
  });

  formSplit = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]]
  });

  formSesion = this.fb.group({
    nombre_sesion: ['', [Validators.required, Validators.maxLength(50)]],
    dia_asignado: [1, Validators.required]
  });

  formEjercicio = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    grupo_muscular: ['', [Validators.required, Validators.maxLength(50)]]
  });

  ngOnInit() {
    this.cargarSplits();
    this.cargarEjercicios();
  }

  ngOnDestroy() {
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  private cargarSplits() {
    this.suscripciones.push(
      this.gimnasioService.obtenerSplits().subscribe({
        next: (splits) => {
          this.splits.set(splits);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargando.set(false);
        }
      })
    );
  }

  private cargarEjercicios() {
    this.suscripciones.push(
      this.gimnasioService.obtenerEjercicios().subscribe({
        next: (ejercicios) => this.ejercicios.set(ejercicios),
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  get dias() {
    return DIAS.map((nombre, i) => ({ valor: i + 1, nombre }));
  }

  get gruposDisponibles(): string[] {
    const grupos = new Set(this.ejercicios().map(e => e.grupo_muscular));
    return [...grupos].sort();
  }

  get ejerciciosVisibles(): Ejercicio[] {
    const valores = this.formFiltros.value;
    const grupo = valores.grupo ?? '';
    const q = (valores.q ?? '').trim().toLowerCase();

    return this.ejercicios().filter(ejercicio => {
      const coincideGrupo = !grupo || ejercicio.grupo_muscular === grupo;
      const coincideTexto = !q || ejercicio.nombre.toLowerCase().includes(q);
      return coincideGrupo && coincideTexto;
    });
  }

  textoDia(dia: number): string {
    return DIAS[dia - 1] ?? `Día ${dia}`;
  }

  // ---------- Splits ----------

  abrirCrearSplit() {
    this.modoEdicionSplit.set(false);
    this.splitEditandoId.set(null);
    this.mensajeForm.set('');
    this.formSplit.reset({ nombre: '' });
    this.modalSplitAbierto.set(true);
  }

  abrirEditarSplit(split: SplitResumen) {
    this.modoEdicionSplit.set(true);
    this.splitEditandoId.set(split.id_split);
    this.mensajeForm.set('');
    this.formSplit.reset({ nombre: split.nombre });
    this.modalSplitAbierto.set(true);
  }

  cerrarSplit() {
    this.modalSplitAbierto.set(false);
  }

  guardarSplit() {
    if (this.formSplit.invalid) {
      this.formSplit.markAllAsTouched();
      this.mensajeForm.set('Completa los campos requeridos.');
      return;
    }

    const nombre = this.formSplit.value.nombre!.trim();
    this.guardando.set(true);
    this.mensajeForm.set('');

    const operacion = this.modoEdicionSplit()
      ? this.gimnasioService.editarSplit(this.splitEditandoId()!, { nombre })
      : this.gimnasioService.crearSplit({ nombre });

    this.suscripciones.push(
      operacion.subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.modalSplitAbierto.set(false);
          this.mensajeExito.set(respuesta.message);
          this.cargarSplits();
        },
        error: (error) => {
          this.guardando.set(false);
          this.mensajeForm.set(this.authService.manejarError(error));
        }
      })
    );
  }

  activarSplit(idSplit: number) {
    this.error.set('');
    this.suscripciones.push(
      this.gimnasioService.activarSplit(idSplit).subscribe({
        next: (respuesta) => {
          this.mensajeExito.set(respuesta.message);
          this.cargarSplits();
          this.refrescarDetalle();
        },
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  abrirDetalle(idSplit: number) {
    this.modalDetalleAbierto.set(true);
    this.splitDetalle.set(null);
    this.cargandoDetalle.set(true);

    this.suscripciones.push(
      this.gimnasioService.obtenerSplit(idSplit).subscribe({
        next: (split) => {
          this.splitDetalle.set(split);
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
    this.splitDetalle.set(null);
  }

  private refrescarDetalle() {
    const split = this.splitDetalle();
    if (!split) return;

    this.suscripciones.push(
      this.gimnasioService.obtenerSplit(split.id_split).subscribe({
        next: (actualizado) => this.splitDetalle.set(actualizado),
        error: () => { }
      })
    );
  }

  // ---------- Sesiones ----------

  abrirCrearSesion() {
    this.modoEdicionSesion.set(false);
    this.sesionEditandoId.set(null);
    this.mensajeForm.set('');
    this.formSesion.reset({ nombre_sesion: '', dia_asignado: 1 });
    this.modalSesionAbierto.set(true);
  }

  abrirEditarSesion(sesion: SesionPlan) {
    this.modoEdicionSesion.set(true);
    this.sesionEditandoId.set(sesion.id_sesion_plan);
    this.mensajeForm.set('');
    this.formSesion.reset({
      nombre_sesion: sesion.nombre_sesion,
      dia_asignado: sesion.dia_asignado
    });
    this.modalSesionAbierto.set(true);
  }

  cerrarSesion() {
    this.modalSesionAbierto.set(false);
  }

  guardarSesion() {
    if (this.formSesion.invalid) {
      this.formSesion.markAllAsTouched();
      this.mensajeForm.set('Completa los campos requeridos.');
      return;
    }

    const split = this.splitDetalle();
    if (!split) return;

    const valores = this.formSesion.value;
    const datos = {
      nombre_sesion: valores.nombre_sesion!.trim(),
      dia_asignado: Number(valores.dia_asignado)
    };

    this.guardando.set(true);
    this.mensajeForm.set('');

    const operacion = this.modoEdicionSesion()
      ? this.gimnasioService.editarSesion(this.sesionEditandoId()!, datos)
      : this.gimnasioService.crearSesion(split.id_split, datos);

    this.suscripciones.push(
      operacion.subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.modalSesionAbierto.set(false);
          this.mensajeExito.set(respuesta.message);
          this.refrescarDetalle();
          this.cargarSplits();
        },
        error: (error) => {
          this.guardando.set(false);
          this.mensajeForm.set(this.authService.manejarError(error));
        }
      })
    );
  }

  // ---------- Receta ----------

  abrirReceta(sesion: SesionPlan) {
    this.mensajeForm.set('');
    this.recetaSesion.set(sesion);
    const ordenados = [...(sesion.ejercicios ?? [])].sort((a, b) => a.orden - b.orden);
    this.recetaSeleccion.set(ordenados.map(e => e.id_ejercicio));
    this.modalRecetaAbierto.set(true);
  }

  cerrarReceta() {
    this.modalRecetaAbierto.set(false);
    this.recetaSesion.set(null);
    this.recetaSeleccion.set([]);
  }

  estaEnReceta(idEjercicio: number): boolean {
    return this.recetaSeleccion().includes(idEjercicio);
  }

  alternarEjercicio(idEjercicio: number) {
    const seleccion = this.recetaSeleccion();
    if (seleccion.includes(idEjercicio)) {
      this.recetaSeleccion.set(seleccion.filter(id => id !== idEjercicio));
    } else {
      this.recetaSeleccion.set([...seleccion, idEjercicio]);
    }
  }

  moverEnReceta(indice: number, delta: number) {
    const seleccion = [...this.recetaSeleccion()];
    const destino = indice + delta;
    if (destino < 0 || destino >= seleccion.length) return;
    [seleccion[indice], seleccion[destino]] = [seleccion[destino], seleccion[indice]];
    this.recetaSeleccion.set(seleccion);
  }

  nombreEjercicio(idEjercicio: number): string {
    return this.ejercicios().find(e => e.id_ejercicio === idEjercicio)?.nombre ?? '';
  }

  guardarReceta() {
    const sesion = this.recetaSesion();
    if (!sesion) return;

    this.guardando.set(true);
    this.mensajeForm.set('');

    this.suscripciones.push(
      this.gimnasioService.reemplazarEjercicios(sesion.id_sesion_plan, {
        ejercicios: this.recetaSeleccion().map((idEjercicio, indice) => ({
          id_ejercicio: idEjercicio,
          orden: indice + 1
        }))
      }).subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.modalRecetaAbierto.set(false);
          this.recetaSesion.set(null);
          this.recetaSeleccion.set([]);
          this.mensajeExito.set(respuesta.message);
          this.refrescarDetalle();
        },
        error: (error) => {
          this.guardando.set(false);
          this.mensajeForm.set(this.authService.manejarError(error));
        }
      })
    );
  }

  // ---------- Ejercicios ----------

  abrirCrearEjercicio() {
    this.modoEdicionEjercicio.set(false);
    this.ejercicioEditandoId.set(null);
    this.mensajeForm.set('');
    this.formEjercicio.reset({ nombre: '', grupo_muscular: '' });
    this.modalEjercicioAbierto.set(true);
  }

  abrirEditarEjercicio(ejercicio: Ejercicio) {
    this.modoEdicionEjercicio.set(true);
    this.ejercicioEditandoId.set(ejercicio.id_ejercicio);
    this.mensajeForm.set('');
    this.formEjercicio.reset({
      nombre: ejercicio.nombre,
      grupo_muscular: ejercicio.grupo_muscular
    });
    this.modalEjercicioAbierto.set(true);
  }

  cerrarEjercicio() {
    this.modalEjercicioAbierto.set(false);
  }

  guardarEjercicio() {
    if (this.formEjercicio.invalid) {
      this.formEjercicio.markAllAsTouched();
      this.mensajeForm.set('Completa los campos requeridos.');
      return;
    }

    const valores = this.formEjercicio.value;
    const datos = {
      nombre: valores.nombre!.trim(),
      grupo_muscular: valores.grupo_muscular!.trim()
    };

    this.guardando.set(true);
    this.mensajeForm.set('');

    const operacion = this.modoEdicionEjercicio()
      ? this.gimnasioService.editarEjercicio(this.ejercicioEditandoId()!, datos)
      : this.gimnasioService.crearEjercicio(datos);

    this.suscripciones.push(
      operacion.subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.modalEjercicioAbierto.set(false);
          this.mensajeExito.set(respuesta.message);
          this.cargarEjercicios();
          this.refrescarDetalle();
        },
        error: (error) => {
          this.guardando.set(false);
          this.mensajeForm.set(this.authService.manejarError(error));
        }
      })
    );
  }

  // ---------- Eliminaciones ----------

  pedirEliminarSplit(split: SplitResumen) {
    this.confirmacion.set({
      titulo: 'Eliminar split',
      mensaje: `Se borrará "${split.nombre}" con sus sesiones. Los entrenamientos ya registrados se conservan.`,
      tipo: 'split',
      id: split.id_split
    });
  }

  pedirEliminarSesion(sesion: SesionPlan) {
    this.confirmacion.set({
      titulo: 'Eliminar sesión',
      mensaje: `Se borrará la sesión "${sesion.nombre_sesion}" de este split. Los entrenamientos ya registrados se conservan.`,
      tipo: 'sesion',
      id: sesion.id_sesion_plan
    });
  }

  pedirEliminarEjercicio(ejercicio: Ejercicio) {
    this.confirmacion.set({
      titulo: 'Eliminar ejercicio',
      mensaje: `Se quitará "${ejercicio.nombre}" del catálogo. No se puede eliminar si está en uso.`,
      tipo: 'ejercicio',
      id: ejercicio.id_ejercicio
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

    const operaciones = {
      split: () => this.gimnasioService.eliminarSplit(confirmacion.id),
      sesion: () => this.gimnasioService.eliminarSesion(confirmacion.id),
      ejercicio: () => this.gimnasioService.eliminarEjercicio(confirmacion.id)
    };

    this.suscripciones.push(
      operaciones[confirmacion.tipo]().subscribe({
        next: (respuesta) => {
          this.confirmando.set(false);
          this.confirmacion.set(null);
          this.mensajeExito.set(respuesta.message);
          this.cargarSplits();
          this.cargarEjercicios();
          this.refrescarDetalle();
        },
        error: (error) => {
          this.confirmando.set(false);
          this.confirmacion.set(null);
          this.error.set(this.authService.manejarError(error));
        }
      })
    );
  }
}
