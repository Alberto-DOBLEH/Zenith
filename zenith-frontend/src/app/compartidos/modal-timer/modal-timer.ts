import { Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import { BitacoraService } from '../../core/servicios/bitacora.service';

const SEGUNDOS_TRABAJO = 25 * 60;
const SEGUNDOS_DESCANSO = 5 * 60;

@Component({
  selector: 'app-modal-timer',
  templateUrl: './modal-timer.html',
  styleUrl: './modal-timer.css',
})
export class ModalTimer implements OnDestroy {
  @Input() habitoId = 0;
  @Input() nombreHabito = '';
  @Input() minutos = 25;
  @Input() pomodoro = false;
  @Output() cerrar = new EventEmitter<void>();

  private readonly authService = inject(AuthService);
  private readonly bitacoraService = inject(BitacoraService);
  private readonly suscripciones: Subscription[] = [];
  private temporizador: ReturnType<typeof setInterval> | null = null;

  estado = signal<'sin_iniciar' | 'iniciado' | 'terminado'>('sin_iniciar');
  tiempoRestante = signal(0);
  error = signal('');
  completadoBackend = signal(false);

  fase = signal<'trabajo' | 'descanso'>('trabajo');
  cicloActual = signal(1);
  ciclosTotales = signal(1);

  ngOnInit() {
    this.ciclosTotales.set(Math.ceil(this.minutos / 25));
    this.tiempoRestante.set(this.pomodoro ? SEGUNDOS_TRABAJO : this.minutos * 60);
  }

  ngOnDestroy() {
    this.detenerTemporizador();
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  get progreso(): number {
    if (this.pomodoro) {
      const total = this.fase() === 'trabajo' ? SEGUNDOS_TRABAJO : SEGUNDOS_DESCANSO;
      return total > 0 ? ((total - this.tiempoRestante()) / total) * 100 : 0;
    }
    const total = this.minutos * 60;
    return total > 0 ? ((total - this.tiempoRestante()) / total) * 100 : 0;
  }

  get tiempoFormateado(): string {
    const minutos = Math.floor(this.tiempoRestante() / 60);
    const segundos = this.tiempoRestante() % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }

  get etiquetaFase(): string {
    if (!this.pomodoro) return '';
    return this.fase() === 'trabajo' ? 'Trabajo' : 'Descanso';
  }

  iniciar() {
    if (this.estado() !== 'sin_iniciar') return;
    this.estado.set('iniciado');
    this.temporizador = setInterval(() => this.tick(), 1000);
  }

  detener() {
    if (this.estado() !== 'iniciado') return;
    this.detenerTemporizador();
    this.marcarNoCompletado();
  }

  private detenerTemporizador() {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }

  private tick() {
    this.tiempoRestante.update(r => r - 1);

    if (this.tiempoRestante() <= 0) {
      if (this.pomodoro) {
        this.avanzarFase();
      } else {
        this.detenerTemporizador();
        this.marcarCompletado();
      }
    }
  }

  private avanzarFase() {
    if (this.fase() === 'trabajo') {
      this.cicloActual.update(c => c + 1);
      if (this.cicloActual() > this.ciclosTotales()) {
        this.detenerTemporizador();
        this.marcarCompletado();
        return;
      }
      this.fase.set('descanso');
      this.tiempoRestante.set(SEGUNDOS_DESCANSO);
    } else {
      this.fase.set('trabajo');
      this.tiempoRestante.set(SEGUNDOS_TRABAJO);
    }
  }

  private marcarCompletado() {
    this.suscripciones.push(
      this.bitacoraService.registrar({ habito: this.habitoId, estado: 'COMPLETADO' }).subscribe({
        next: () => {
          this.completadoBackend.set(true);
          this.estado.set('terminado');
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
        }
      })
    );
  }

  private marcarNoCompletado() {
    this.suscripciones.push(
      this.bitacoraService.registrar({ habito: this.habitoId, estado: 'NO_COMPLETADO' }).subscribe({
        next: () => {
          this.completadoBackend.set(false);
          this.estado.set('terminado');
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
        }
      })
    );
  }

  cerrarModal() {
    if (this.estado() === 'iniciado') return;
    this.detenerTemporizador();
    this.cerrar.emit();
  }
}
