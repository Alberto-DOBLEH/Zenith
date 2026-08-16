import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import { NotasService, Nota } from '../../core/servicios/notas.service';

@Component({
  selector: 'app-notas',
  imports: [FormsModule],
  templateUrl: './notas.html',
  styleUrl: './notas.css',
})
export class Notas implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly notasService = inject(NotasService);

  private suscripciones: Subscription[] = [];

  cargando = signal(true);
  error = signal('');
  mensajeExito = signal('');
  historial = signal<Nota[]>([]);
  notaDia = signal<Nota | null>(null);
  vistaHistorial = signal<Nota | null>(null);
  guardando = signal(false);

  contenido = '';
  fechaHoy = this.fechaHoyISO();

  ngOnInit() {
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  private fechaHoyISO(): string {
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset();
    return new Date(ahora.getTime() - offset * 60000).toISOString().split('T')[0];
  }

  private cargarDatos() {
    this.cargando.set(true);

    this.suscripciones.push(
      this.notasService.obtener().subscribe({
        next: (notas) => {
          const deHoy = notas.find(n => n.fecha === this.fechaHoy);
          this.notaDia.set(deHoy || null);
          this.historial.set(notas.filter(n => n.fecha !== this.fechaHoy));
          this.contenido = deHoy?.contenido || '';
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargando.set(false);
        }
      })
    );
  }

  guardar() {
    if (!this.contenido.trim()) {
      this.error.set('Escribe algo antes de guardar.');
      return;
    }

    this.error.set('');
    this.guardando.set(true);
    this.mensajeExito.set('');

    const operacion = this.notaDia()
      ? this.notasService.editar(this.notaDia()!.id_nota, this.contenido)
      : this.notasService.crear(this.contenido);

    this.suscripciones.push(
      operacion.subscribe({
        next: (respuesta) => {
          this.notaDia.set(respuesta.nota);
          this.vistaHistorial.set(null);
          this.guardando.set(false);
          this.mensajeExito.set('Nota guardada.');
          this.recargarHistorial();
        },
        error: (error) => {
          this.guardando.set(false);
          this.error.set(this.authService.manejarError(error));
        }
      })
    );
  }

  verNota(nota: Nota) {
    this.vistaHistorial.set(nota);
    this.contenido = nota.contenido;
  }

  cerrarVistaHistorial() {
    this.vistaHistorial.set(null);
    this.contenido = this.notaDia()?.contenido || '';
  }

  private recargarHistorial() {
    this.suscripciones.push(
      this.notasService.obtener().subscribe({
        next: (notas) => {
          const deHoy = notas.find(n => n.fecha === this.fechaHoy);
          this.notaDia.set(deHoy || null);
          this.historial.set(notas.filter(n => n.fecha !== this.fechaHoy));
        }
      })
    );
  }

  formatearFecha(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  resumen(contenido: string): string {
    const limpio = contenido.trim().replace(/\s+/g, ' ');
    return limpio.length > 80 ? limpio.slice(0, 80) + '…' : limpio;
  }
}
