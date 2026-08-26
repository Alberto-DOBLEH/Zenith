import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import { HabitosService, Habito, HabitoPayload, TipoHabito } from '../../core/servicios/habitos.service';
import { ModalDetallesHabito, DetallesHabito } from '../../compartidos/modal-detalles-habito/modal-detalles-habito';

@Component({
  selector: 'app-habitos',
  imports: [ReactiveFormsModule, FormsModule, ModalDetallesHabito],
  templateUrl: './habitos.html',
  styleUrl: './habitos.css',
})
export class Habitos implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly habitosService = inject(HabitosService);
  private readonly fb = inject(FormBuilder);

  private suscripciones: Subscription[] = [];

  cargando = signal(true);
  error = signal('');
  habitos = signal<Habito[]>([]);
  tipos = signal<TipoHabito[]>([]);

  modalFormAbierto = signal(false);
  modoEdicion = signal(false);
  habitoEditandoId = signal<number | null>(null);
  modalEliminarAbierto = signal(false);
  habitoAEliminar = signal<Habito | null>(null);
  habitosDetalles = signal<DetallesHabito | null>(null);

  cargandoForm = signal(false);
  mensajeForm = signal('');

  readonly diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
  readonly nombresDias: Record<string, string> = {
    LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves',
    VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo'
  };

  form = this.fb.group({
    tipo_habito: [1, Validators.required],
    nombre: ['', Validators.required],
    descripcion: [''],
    frecuencia: ['DIARIO', Validators.required],
    meta: [null as number | null],
    unidad: [''],
    unidadTiempo: ['minutos'],
    pomodoroHabilitado: [false],
    dias: [[] as string[]],
    dia_del_mes: [null as number | null]
  });

  ngOnInit() {
    this.cargarTipos();
    this.cargarHabitos();
  }

  ngOnDestroy() {
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  private cargarTipos() {
    this.suscripciones.push(
      this.habitosService.obtenerTipos().subscribe({
        next: (tipos) => {
          this.tipos.set(tipos);
          if (tipos.length > 0) {
            this.form.patchValue({ tipo_habito: tipos[0].id_tipo_habito });
          }
        },
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  private cargarHabitos() {
    this.cargando.set(true);
    this.suscripciones.push(
      this.habitosService.obtener().subscribe({
        next: (habitos) => {
          this.habitos.set(habitos);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargando.set(false);
        }
      })
    );
  }

  esBueno(habito: Habito): boolean {
    return habito.tipo_habito !== 4;
  }

  requiereObjetivo(tipoHabito: number | null | undefined): boolean {
    return tipoHabito === 2 || tipoHabito === 3;
  }

  nombreTipo(idTipo: number): string {
    return this.tipos().find(t => t.id_tipo_habito === idTipo)?.nombre || '';
  }

  abrirCrear() {
    this.modoEdicion.set(false);
    this.habitoEditandoId.set(null);
    this.mensajeForm.set('');
    this.form.reset({
      tipo_habito: this.tipos()[0]?.id_tipo_habito ?? 1,
      nombre: '',
      descripcion: '',
      frecuencia: 'DIARIO',
      meta: null,
      unidad: '',
      unidadTiempo: 'minutos',
      pomodoroHabilitado: false,
      dias: [],
      dia_del_mes: null
    });
    this.modalFormAbierto.set(true);
  }

  abrirEditar(habito: Habito) {
    this.modoEdicion.set(true);
    this.habitoEditandoId.set(habito.id_habito);
    this.mensajeForm.set('');

    const esTiempo = habito.tipo_habito === 2;
    let unidadTiempo = 'minutos';
    let metaDisplay = habito.meta;
    if (esTiempo && habito.meta && habito.meta >= 60 && habito.meta % 60 === 0) {
      unidadTiempo = 'horas';
      metaDisplay = habito.meta / 60;
    }

    this.form.patchValue({
      tipo_habito: habito.tipo_habito,
      nombre: habito.nombre,
      descripcion: habito.descripcion || '',
      frecuencia: habito.frecuencia,
      meta: metaDisplay,
      unidad: habito.unidad || '',
      unidadTiempo,
      pomodoroHabilitado: habito.pomodoro_habilitado,
      dias: habito.dias,
      dia_del_mes: habito.dia_del_mes
    });
    this.modalFormAbierto.set(true);
  }

  cerrarForm() {
    this.modalFormAbierto.set(false);
  }

  alternarDia(dia: string) {
    const actual = [...(this.form.value.dias ?? [])];
    const indice = actual.indexOf(dia);
    if (indice >= 0) {
      actual.splice(indice, 1);
    } else {
      actual.push(dia);
    }
    this.form.patchValue({ dias: actual });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.value;

    if (valores.frecuencia === 'SEMANAL' && (valores.dias ?? []).length === 0) {
      this.mensajeForm.set('Selecciona al menos un día de la semana.');
      return;
    }

    if (valores.frecuencia === 'MENSUAL' &&
      (valores.dia_del_mes == null || valores.dia_del_mes < 1 || valores.dia_del_mes > 31)) {
      this.mensajeForm.set('Indica un día del mes entre 1 y 31.');
      return;
    }

    if (this.requiereObjetivo(valores.tipo_habito) && (valores.meta == null || valores.meta <= 0)) {
      this.mensajeForm.set('Para este tipo de hábito indica un objetivo mayor a 0.');
      return;
    }

    let metaFinal = valores.meta ?? null;
    if (valores.tipo_habito === 2 && metaFinal != null && valores.unidadTiempo === 'horas') {
      metaFinal = metaFinal * 60;
    }

    const payload: HabitoPayload = {
      tipo_habito: valores.tipo_habito!,
      nombre: valores.nombre!,
      descripcion: valores.descripcion || undefined,
      frecuencia: valores.frecuencia!,
      meta: metaFinal,
      unidad: valores.unidad || undefined,
      pomodoro_habilitado: valores.tipo_habito === 2 ? !!valores.pomodoroHabilitado : false,
      dias: valores.frecuencia === 'SEMANAL' ? valores.dias ?? [] : undefined,
      dia_del_mes: valores.frecuencia === 'MENSUAL' ? valores.dia_del_mes ?? null : undefined
    };

    this.cargandoForm.set(true);
    this.mensajeForm.set('');

    const operacion = this.modoEdicion()
      ? this.habitosService.editar(this.habitoEditandoId()!, payload)
      : this.habitosService.crear(payload);

    this.suscripciones.push(
      operacion.subscribe({
        next: () => {
          this.cargandoForm.set(false);
          this.modalFormAbierto.set(false);
          this.cargarHabitos();
        },
        error: (error) => {
          this.cargandoForm.set(false);
          this.mensajeForm.set(this.authService.manejarError(error));
        }
      })
    );
  }

  preguntarEliminar(habito: Habito) {
    this.habitoAEliminar.set(habito);
    this.modalEliminarAbierto.set(true);
  }

  cancelarEliminar() {
    this.modalEliminarAbierto.set(false);
    this.habitoAEliminar.set(null);
  }

  confirmarEliminar() {
    const habito = this.habitoAEliminar();
    if (!habito) return;

    this.suscripciones.push(
      this.habitosService.eliminar(habito.id_habito).subscribe({
        next: () => {
          this.modalEliminarAbierto.set(false);
          this.habitoAEliminar.set(null);
          this.cargarHabitos();
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.modalEliminarAbierto.set(false);
          this.habitoAEliminar.set(null);
        }
      })
    );
  }

  verDetalles(habito: Habito) {
    this.habitosDetalles.set({
      id_habito: habito.id_habito,
      nombre: habito.nombre,
      descripcion: habito.descripcion,
      tipo_nombre: habito.tipo_nombre,
      meta: habito.meta,
      unidad: habito.unidad,
      esBueno: this.esBueno(habito),
      frecuencia: habito.frecuencia,
      dias: habito.dias,
      dia_del_mes: habito.dia_del_mes
    });
  }
}