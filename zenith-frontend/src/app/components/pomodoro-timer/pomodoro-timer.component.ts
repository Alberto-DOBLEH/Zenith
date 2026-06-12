import { Component, input, output, signal, effect, computed, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habit } from '../../services/habits.service';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-pomodoro-timer',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">{{ habit().name }}</h2>
            <p class="text-gray-600">
              Meta: {{ targetHours() }} {{ habit().unit }} ({{ pomodorosNeeded() }} pomodoros)
            </p>
          </div>
          <button
            (click)="handleClose()"
            class="text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <app-icon name="x" [size]="24"></app-icon>
          </button>
        </div>

        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-gray-700 font-medium">Progreso General</span>
            <span class="text-gray-900 font-semibold">
              {{ completedPomodoros() }}/{{ pomodorosNeeded() }} pomodoros
            </span>
          </div>
          <div class="w-full bg-white rounded-full h-3">
            <div
              class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              [style.width.%]="overallProgress()"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-2">
            Tiempo trabajado: {{ (totalTimeWorked() / 60).toFixed(1) }} {{ habit().unit }}
          </p>
        </div>

        <div class="flex justify-center gap-2 mb-8">
          <button
            (click)="switchMode('work')"
            class="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition cursor-pointer"
            [ngClass]="{
              'bg-blue-600 text-white': mode() === 'work',
              'bg-gray-100 text-gray-700 hover:bg-gray-200': mode() !== 'work'
            }"
          >
            <app-icon name="brain" [size]="18"></app-icon>
            Trabajo (25min)
          </button>
          <button
            (click)="switchMode('break')"
            class="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition cursor-pointer"
            [ngClass]="{
              'bg-green-600 text-white': mode() === 'break',
              'bg-gray-100 text-gray-700 hover:bg-gray-200': mode() !== 'break'
            }"
          >
            <app-icon name="coffee" [size]="18"></app-icon>
            Descanso (5min)
          </button>
        </div>

        <div class="relative w-64 h-64 mx-auto mb-8">
          <svg class="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="#E5E7EB"
              stroke-width="8"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              [attr.stroke]="mode() === 'work' ? '#3B82F6' : '#10B981'"
              stroke-width="8"
              fill="none"
              [attr.stroke-dasharray]="circleCircumference"
              [attr.stroke-dashoffset]="circleDashOffset()"
              stroke-linecap="round"
              class="transition-all duration-1000"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-5xl font-bold text-gray-900">
                {{ formatTime(minutes(), seconds()) }}
              </div>
              <div class="text-gray-600 mt-2">
                {{ mode() === 'work' ? 'Enfócate' : 'Descansa' }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-3 mb-6">
          <button
            (click)="toggleTimer()"
            class="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition text-white cursor-pointer"
            [ngClass]="mode() === 'work' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'"
          >
            @if (isActive()) {
              <app-icon name="pause" [size]="20"></app-icon>
              Pausar
            } @else {
              <app-icon name="play" [size]="20"></app-icon>
              Iniciar
            }
          </button>
          <button
            (click)="resetTimer()"
            class="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition cursor-pointer"
          >
            <app-icon name="rotate-ccw" [size]="20"></app-icon>
            Reiniciar
          </button>
        </div>

        <div class="pt-6 border-t">
          <button
            (click)="handleManualComplete()"
            [disabled]="totalTimeWorked() === 0"
            class="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <app-icon name="check" [size]="20"></app-icon>
            Marcar como Completado ({{ (totalTimeWorked() / 60).toFixed(1) }} {{ habit().unit }})
          </button>
          <p class="text-sm text-gray-600 text-center mt-2">
            Registra el tiempo trabajado hasta ahora
          </p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PomodoroTimerComponent implements OnDestroy {
  public readonly habit = input.required<Habit>();
  public readonly close = output<void>();
  public readonly complete = output<number>();

  private readonly toastService = inject(ToastService);

  // Constants
  protected readonly pomodoroMinutes = 25;
  protected readonly breakMinutes = 5;
  protected readonly circleCircumference = 2 * Math.PI * 120; // 753.98

  // Signals
  protected readonly minutes = signal<number>(25);
  protected readonly seconds = signal<number>(0);
  protected readonly isActive = signal<boolean>(false);
  protected readonly mode = signal<'work' | 'break'>('work');
  protected readonly completedPomodoros = signal<number>(0);
  protected readonly totalTimeWorked = signal<number>(0);

  private intervalId: any = null;

  // Computed properties
  protected readonly targetHours = computed(() => this.habit().target || 0);
  protected readonly targetMinutes = computed(() => this.targetHours() * 60);
  protected readonly pomodorosNeeded = computed(() => Math.ceil(this.targetMinutes() / this.pomodoroMinutes) || 1);

  protected readonly progress = computed(() => {
    const totalSec = this.mode() === 'work' ? this.pomodoroMinutes * 60 : this.breakMinutes * 60;
    const currentSec = this.minutes() * 60 + this.seconds();
    return ((totalSec - currentSec) / totalSec) * 100;
  });

  protected readonly circleDashOffset = computed(() => {
    return this.circleCircumference * (1 - this.progress() / 100);
  });

  protected readonly overallProgress = computed(() => {
    return Math.min((this.completedPomodoros() / this.pomodorosNeeded()) * 100, 100);
  });

  constructor() {
    // Setup effect for active timer interval
    effect(() => {
      const active = this.isActive();
      if (active) {
        if (!this.intervalId) {
          this.intervalId = setInterval(() => {
            this.tick();
          }, 1000);
        }
      } else {
        this.clearTimerInterval();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimerInterval();
  }

  private clearTimerInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    const s = this.seconds();
    const m = this.minutes();

    if (s === 0) {
      if (m === 0) {
        this.handleTimerComplete();
      } else {
        this.minutes.set(m - 1);
        this.seconds.set(59);
      }
    } else {
      this.seconds.set(s - 1);
    }
  }

  private handleTimerComplete() {
    this.isActive.set(false);

    if (this.mode() === 'work') {
      const newCompleted = this.completedPomodoros() + 1;
      const newTotal = this.totalTimeWorked() + this.pomodoroMinutes;
      this.completedPomodoros.set(newCompleted);
      this.totalTimeWorked.set(newTotal);

      this.toastService.success(`¡Pomodoro ${newCompleted} completado!`);

      if (newCompleted >= this.pomodorosNeeded()) {
        this.toastService.success(`¡Meta alcanzada! Completaste ${this.targetHours()} ${this.habit().unit}`);
        this.complete.emit(this.targetHours());
        return;
      }

      this.mode.set('break');
      this.minutes.set(this.breakMinutes);
      this.seconds.set(0);
    } else {
      this.toastService.success('¡Descanso terminado! Vuelve al trabajo');
      this.mode.set('work');
      this.minutes.set(this.pomodoroMinutes);
      this.seconds.set(0);
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: this.mode() === 'work' ? '¡Tiempo de descanso!' : '¡Hora de trabajar!',
      });
    }
  }

  protected toggleTimer(): void {
    if (!this.isActive() && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    this.isActive.update(val => !val);
  }

  protected resetTimer(): void {
    this.isActive.set(false);
    this.minutes.set(this.mode() === 'work' ? this.pomodoroMinutes : this.breakMinutes);
    this.seconds.set(0);
  }

  protected switchMode(newMode: 'work' | 'break'): void {
    this.mode.set(newMode);
    this.isActive.set(false);
    this.minutes.set(newMode === 'work' ? this.pomodoroMinutes : this.breakMinutes);
    this.seconds.set(0);
  }

  protected handleManualComplete(): void {
    const hoursWorked = this.totalTimeWorked() / 60;
    if (hoursWorked === 0) {
      this.toastService.error('No has completado ningún pomodoro aún');
      return;
    }

    this.complete.emit(hoursWorked);
    this.toastService.success(`Registrado: ${hoursWorked.toFixed(1)} ${this.habit().unit}`);
  }

  protected handleClose(): void {
    this.close.emit();
  }

  protected formatTime(min: number, sec: number): string {
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
}
