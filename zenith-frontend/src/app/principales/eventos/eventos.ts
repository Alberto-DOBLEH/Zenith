import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import { EventosService, Evento } from '../../core/servicios/eventos.service';
import { ActividadesService, Actividad, ActividadPayload } from '../../core/servicios/actividades.service';

const HORA_INICIO = 0;
const HORA_FIN = 24;

export const COLORES_EVENTO = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6'];

interface Bloque {
    top: number;
    height: number;
    esInicio: boolean;
}

@Component({
  selector: 'app-eventos',
  imports: [FormsModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class Eventos implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly eventosService = inject(EventosService);
  private readonly actividadesService = inject(ActividadesService);

  private suscripciones: Subscription[] = [];

  cargando = signal(true);
  error = signal('');
  eventos = signal<Evento[]>([]);
  actividades = signal<Actividad[]>([]);

  semanaInicio = this.inicioDeSemana(new Date());

  modalFormAbierto = signal(false);
  modoEdicion = signal(false);
  eventoEditandoId = signal<number | null>(null);
  modalDetallesAbierto = signal(false);
  eventoDetalle = signal<Evento | null>(null);
  modalEliminarAbierto = signal(false);
  eventoAEliminar = signal<Evento | null>(null);

  modalActividadAbierto = signal(false);
  modoEdicionActividad = signal(false);
  actividadEditandoId = signal<number | null>(null);
  modalEliminarActividadAbierto = signal(false);
  actividadAEliminar = signal<Actividad | null>(null);
  guardandoActividad = signal(false);
  mensajeActividad = signal('');

  guardando = signal(false);
  mensajeForm = signal('');
  mensajeFormExito = signal('');

  readonly colores = COLORES_EVENTO;

  formTitulo = '';
  formDescripcion = '';
  formFecha = '';
  formHora = '';
  formDuracion = 60;
  formColor = COLORES_EVENTO[0];
  formAvisos: string[] = [];

  formActTitulo = '';
  formActDescripcion = '';
  formActFecha = '';

  ngOnInit() {
    this.cargarEventos();
    this.cargarActividades();
  }

  ngOnDestroy() {
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  private cargarEventos() {
    this.cargando.set(true);
    this.suscripciones.push(
      this.eventosService.obtener().subscribe({
        next: (eventos) => {
          this.eventos.set(eventos);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargando.set(false);
        }
      })
    );
  }

  private cargarActividades() {
    this.suscripciones.push(
      this.actividadesService.obtener().subscribe({
        next: (actividades) => this.actividades.set(actividades),
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  private inicioDeSemana(fecha: Date): Date {
    const d = new Date(fecha);
    const dia = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dia);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  diasSemana(): Date[] {
    const dias: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.semanaInicio);
      d.setDate(d.getDate() + i);
      dias.push(d);
    }
    return dias;
  }

  rangoSemana(): string {
    const primer = this.diasSemana()[0];
    const ultimo = this.diasSemana()[6];
    const corto: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const largo: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${primer.toLocaleDateString('es-MX', corto)} – ${ultimo.toLocaleDateString('es-MX', largo)}`;
  }

  semanaAnterior() {
    this.semanaInicio = new Date(this.semanaInicio.getTime() - 7 * 86400000);
  }

  semanaSiguiente() {
    this.semanaInicio = new Date(this.semanaInicio.getTime() + 7 * 86400000);
  }

  irASemanaActual() {
    this.semanaInicio = this.inicioDeSemana(new Date());
  }

  etiquetaMes(): string {
    const primer = this.diasSemana()[0];
    const ultimo = this.diasSemana()[6];
    const opciones: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (primer.getMonth() === ultimo.getMonth()) {
      return primer.toLocaleDateString('es-MX', opciones);
    }
    const mesInicio = primer.toLocaleDateString('es-MX', { month: 'short' });
    const mesFin = ultimo.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
    return `${mesInicio} — ${mesFin}`;
  }

  etiquetaDia(dia: Date): string {
    return dia.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
  }

  esHoy(dia: Date): boolean {
    const hoy = new Date();
    return dia.getFullYear() === hoy.getFullYear()
      && dia.getMonth() === hoy.getMonth()
      && dia.getDate() === hoy.getDate();
  }

  formatoDia(dia: Date): string {
    return `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
  }

  horas(): number[] {
    const horas: number[] = [];
    for (let h = HORA_INICIO; h < HORA_FIN; h++) {
      horas.push(h);
    }
    return horas;
  }

  etiquetaHora(hora: number): string {
    return `${String(hora).padStart(2, '0')}:00`;
  }

  eventosDelDia(dia: Date): Evento[] {
    this.semanaInicio.getFullYear();
    return this.eventos()
      .filter(e => this.mismoDiaCalendario(e.fecha_inicio, dia) || this.mismoDiaCalendario(e.fecha_fin, dia))
      .filter(e => this.bloqueDelDia(e, dia) !== null);
  }

  private mismoDiaCalendario(fechaISO: string, dia: Date): boolean {
    const fecha = new Date(fechaISO);
    return fecha.getFullYear() === dia.getFullYear()
      && fecha.getMonth() === dia.getMonth()
      && fecha.getDate() === dia.getDate();
  }

  bloqueDelDia(evento: Evento, dia: Date): Bloque | null {
    const inicio = new Date(evento.fecha_inicio);
    const fin = new Date(evento.fecha_fin);
    const diaInicio = new Date(dia);
    diaInicio.setHours(HORA_INICIO, 0, 0, 0);
    const diaFin = new Date(dia);
    diaFin.setHours(HORA_FIN, 0, 0, 0);

    const inicioVisible = inicio.getTime() < diaInicio.getTime() ? diaInicio : inicio;
    const finVisible = fin.getTime() > diaFin.getTime() ? diaFin : fin;

    const totalMs = (HORA_FIN - HORA_INICIO) * 3600000;

    let top: number;
    let height: number;

    if (finVisible.getTime() > inicioVisible.getTime()) {
      top = ((inicioVisible.getTime() - diaInicio.getTime()) / totalMs) * 100;
      height = Math.max(((finVisible.getTime() - inicioVisible.getTime()) / totalMs) * 100, 3);
    } else {
      // El evento toca este día pero sin solapamiento con la franja visible:
      // se muestra pegado al borde como indicador.
      const empiezaAntes = inicio.getTime() < diaInicio.getTime();
      height = 4;
      top = empiezaAntes ? 0 : 100 - height;
    }

    const mismoDia = inicio.getFullYear() === dia.getFullYear()
      && inicio.getMonth() === dia.getMonth()
      && inicio.getDate() === dia.getDate();

    return {
      top,
      height,
      esInicio: mismoDia
    };
  }

  proximos(): Evento[] {
    const ahora = new Date();
    return this.eventos()
      .filter(e => new Date(e.fecha_fin) >= ahora)
      .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
      .slice(0, 6);
  }

  formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  abrirCrear() {
    this.modoEdicion.set(false);
    this.eventoEditandoId.set(null);
    this.mensajeForm.set('');
    this.formTitulo = '';
    this.formDescripcion = '';
    this.formFecha = this.formatoDia(new Date());
    this.formHora = '09:00';
    this.formDuracion = 60;
    this.formColor = COLORES_EVENTO[0];
    this.formAvisos = [];
    this.modalFormAbierto.set(true);
  }

  abrirEditar(evento: Evento) {
    this.cerrarDetalles();
    this.modoEdicion.set(true);
    this.eventoEditandoId.set(evento.id_evento);
    this.mensajeForm.set('');
    this.formTitulo = evento.titulo;
    this.formDescripcion = evento.descripcion || '';
    const inicio = new Date(evento.fecha_inicio);
    const fin = new Date(evento.fecha_fin);
    this.formFecha = this.formatoDia(inicio);
    this.formHora = `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`;
    this.formDuracion = Math.max(15, Math.round((fin.getTime() - inicio.getTime()) / 60000));
    this.formColor = evento.color && this.colores.includes(evento.color) ? evento.color : COLORES_EVENTO[0];
    this.formAvisos = (evento.avisos || []).map(a => this.aInputLocal(a));
    this.modalFormAbierto.set(true);
  }

  cerrarForm() {
    this.modalFormAbierto.set(false);
  }

  agregarAviso() {
    this.formAvisos.push('');
  }

  quitarAviso(indice: number) {
    this.formAvisos.splice(indice, 1);
  }

  guardar() {
    if (!this.formTitulo.trim() || !this.formFecha || !this.formHora) {
      this.mensajeForm.set('Título, fecha y hora de inicio son obligatorios.');
      return;
    }

    const inicioDate = new Date(`${this.formFecha}T${this.formHora}:00`);
    if (isNaN(inicioDate.getTime())) {
      this.mensajeForm.set('Fecha u hora de inicio inválidas.');
      return;
    }
    const finDate = new Date(inicioDate.getTime() + this.formDuracion * 60000);

    const payload = {
      titulo: this.formTitulo.trim(),
      descripcion: this.formDescripcion.trim() || null,
      fecha_inicio: inicioDate.toISOString(),
      fecha_fin: finDate.toISOString(),
      color: this.formColor,
      avisos: this.formAvisos
        .map(a => this.aInstante(a))
        .filter((a): a is string => !!a)
    };

    this.guardando.set(true);
    this.mensajeForm.set('');

    const operacion = this.modoEdicion()
      ? this.eventosService.editar(this.eventoEditandoId()!, payload)
      : this.eventosService.crear(payload);

    this.suscripciones.push(
      operacion.subscribe({
        next: () => {
          this.guardando.set(false);
          this.modalFormAbierto.set(false);
          this.cargarEventos();
        },
        error: (error) => {
          this.guardando.set(false);
          this.mensajeForm.set(this.authService.manejarError(error));
        }
      })
    );
  }

  /** ISO instantáneo (UTC) a valor local para input datetime-local. */
  private aInputLocal(iso: string): string {
    const fecha = new Date(iso);
    if (isNaN(fecha.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
  }

  /** Valor de input datetime-local (hora local) a ISO instantáneo (UTC). */
  private aInstante(valor: string): string | null {
    if (!valor) return null;
    const fecha = new Date(valor);
    return isNaN(fecha.getTime()) ? null : fecha.toISOString();
  }

  verDetalles(evento: Evento) {
    this.eventoDetalle.set(evento);
    this.modalDetallesAbierto.set(true);
  }

  cerrarDetalles() {
    this.modalDetallesAbierto.set(false);
    this.eventoDetalle.set(null);
  }

  preguntarEliminar() {
    const evento = this.eventoDetalle();
    if (!evento) return;
    this.eventoAEliminar.set(evento);
    this.modalEliminarAbierto.set(true);
  }

  cancelarEliminar() {
    this.modalEliminarAbierto.set(false);
    this.eventoAEliminar.set(null);
  }

  confirmarEliminar() {
    const evento = this.eventoAEliminar();
    if (!evento) return;

    this.suscripciones.push(
      this.eventosService.eliminar(evento.id_evento).subscribe({
        next: () => {
          this.modalEliminarAbierto.set(false);
          this.eventoAEliminar.set(null);
          this.modalDetallesAbierto.set(false);
          this.eventoDetalle.set(null);
          this.cargarEventos();
        },
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  // ---------- Actividades (tareas con fecha de entrega) ----------

  actividadesDelDia(dia: Date): Actividad[] {
    const clave = this.formatoDia(dia);
    return this.actividades().filter(a => a.fecha_limite === clave);
  }

  esVencida(actividad: Actividad): boolean {
    if (actividad.estado !== 'PENDIENTE') return false;
    return actividad.fecha_limite < this.formatoDia(new Date());
  }

  actividadesOrdenadas(): Actividad[] {
    return [...this.actividades()].sort((a, b) =>
      a.fecha_limite.localeCompare(b.fecha_limite) || a.id_actividad - b.id_actividad
    );
  }

  formatearFechaCorta(fechaYYYYMMDD: string): string {
    const d = new Date(`${fechaYYYYMMDD}T00:00:00`);
    if (isNaN(d.getTime())) return fechaYYYYMMDD;
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  abrirCrearActividad() {
    this.modoEdicionActividad.set(false);
    this.actividadEditandoId.set(null);
    this.mensajeActividad.set('');
    this.formActTitulo = '';
    this.formActDescripcion = '';
    this.formActFecha = this.formatoDia(new Date());
    this.modalActividadAbierto.set(true);
  }

  abrirEditarActividad(actividad: Actividad) {
    this.modoEdicionActividad.set(true);
    this.actividadEditandoId.set(actividad.id_actividad);
    this.mensajeActividad.set('');
    this.formActTitulo = actividad.titulo;
    this.formActDescripcion = actividad.descripcion || '';
    this.formActFecha = actividad.fecha_limite;
    this.modalActividadAbierto.set(true);
  }

  cerrarFormActividad() {
    this.modalActividadAbierto.set(false);
  }

  guardarActividad() {
    if (!this.formActTitulo.trim() || !this.formActFecha) {
      this.mensajeActividad.set('Título y fecha límite son obligatorios.');
      return;
    }

    const payload: ActividadPayload = {
      titulo: this.formActTitulo.trim(),
      descripcion: this.formActDescripcion.trim() || null,
      fecha_limite: this.formActFecha
    };

    this.guardandoActividad.set(true);
    this.mensajeActividad.set('');

    const operacion = this.modoEdicionActividad()
      ? this.actividadesService.editar(this.actividadEditandoId()!, payload)
      : this.actividadesService.crear(payload);

    this.suscripciones.push(
      operacion.subscribe({
        next: () => {
          this.guardandoActividad.set(false);
          this.modalActividadAbierto.set(false);
          this.cargarActividades();
        },
        error: (error) => {
          this.guardandoActividad.set(false);
          this.mensajeActividad.set(this.authService.manejarError(error));
        }
      })
    );
  }

  alternarEstadoActividad(actividad: Actividad, evento?: Event) {
    evento?.stopPropagation();
    const estado = actividad.estado === 'PENDIENTE' ? 'COMPLETADA' : 'PENDIENTE';
    this.suscripciones.push(
      this.actividadesService.editar(actividad.id_actividad, { estado }).subscribe({
        next: () => this.cargarActividades(),
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  preguntarEliminarActividad() {
    const actividad = this.modalActividadAbierto() ? this.actividades().find(a => a.id_actividad === this.actividadEditandoId()) : null;
    this.actividadAEliminar.set(actividad || null);
    if (actividad) {
      this.modalActividadAbierto.set(false);
      this.modalEliminarActividadAbierto.set(true);
    }
  }

  cancelarEliminarActividad() {
    this.modalEliminarActividadAbierto.set(false);
    this.actividadAEliminar.set(null);
  }

  confirmarEliminarActividad() {
    const actividad = this.actividadAEliminar();
    if (!actividad) return;

    this.suscripciones.push(
      this.actividadesService.eliminar(actividad.id_actividad).subscribe({
        next: () => {
          this.modalEliminarActividadAbierto.set(false);
          this.actividadAEliminar.set(null);
          this.cargarActividades();
        },
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }
}
