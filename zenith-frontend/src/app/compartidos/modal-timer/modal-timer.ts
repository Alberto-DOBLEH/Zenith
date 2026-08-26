import { Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import { BitacoraService } from '../../core/servicios/bitacora.service';

@Component({
  selector: 'app-modal-timer',
  templateUrl: './modal-timer.html',
  styleUrl: './modal-timer.css',
})
export class ModalTimer implements OnDestroy {
  @Input() habitoId = 0;
  @Input() nombreHabito = '';
  @Input() minutos = 25;
  @Output() cerrar = new EventEmitter<void>();

  private readonly authService = inject(AuthService);
  private readonly bitacoraService = inject(BitacoraService);
  private readonly suscripciones: Subscription[] = [];
  private temporizador: ReturnType<typeof setInterval> | null = null;

  corriendo = signal(false);
  tiempoRestante = signal(0);
  completado = signal(false);
  error = signal('');

  ngOnInit() {
    this.tiempoRestante.set(this.minutos * 60);
  }

  ngOnDestroy() {
    this.detenerTemporizador();
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  get progreso(): number {
    const total = this.minutos * 60;
    return total > 0 ? ((total - this.tiempoRestante()) / total) * 100 : 0;
  }

  get tiempoFormateado(): string {
    const minutos = Math.floor(this.tiempoRestante() / 60);
    const segundos = this.tiempoRestante() % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }

  alternar() {
    if (this.corriendo()) {
      this.pausar();
    } else {
      this.correr();
    }
  }

  private correr() {
    this.corriendo.set(true);
    if (this.temporizador) return;
    this.temporizador = setInterval(() => this.tick(), 1000);
  }

  private pausar() {
    this.corriendo.set(false);
    this.detenerTemporizador();
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
      this.detenerTemporizador();
      this.corriendo.set(false);
      this.marcarCompletado();
    }
  }

  private marcarCompletado() {
    this.suscripciones.push(
      this.bitacoraService.registrar({ habito: this.habitoId, estado: 'COMPLETADO' }).subscribe({
        next: () => {
          this.completado.set(true);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
        }
      })
    );
  }

  cerrarModal() {
    this.detenerTemporizador();
    this.cerrar.emit();
  }
}
