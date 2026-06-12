import { Component, input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Habit, HabitsService } from '../../services/habits.service';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';
import { PomodoroTimerComponent } from '../pomodoro-timer/pomodoro-timer.component';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, PomodoroTimerComponent],
  template: `
    <div
      class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition duration-200 border-l-4"
      [style.borderLeftColor]="habit().color"
    >
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 text-lg mb-1">{{ habit().name }}</h4>
          <div class="flex items-center gap-3 text-sm text-gray-600">
            @if (streak() > 0) {
              <div class="flex items-center gap-1">
                <app-icon name="flame" [size]="16" class="text-orange-500"></app-icon>
                <span class="font-medium">{{ streak() }} días</span>
              </div>
            }
            @if (habit().type !== 'boolean' && habit().target) {
              <span>Meta: {{ habit().target }} {{ habit().unit }}</span>
            }
          </div>
        </div>
        <button
          (click)="handleDelete()"
          class="text-gray-400 hover:text-red-500 transition cursor-pointer"
        >
          <app-icon name="trash" [size]="18"></app-icon>
        </button>
      </div>

      <!-- Boolean Type -->
      @if (habit().type === 'boolean') {
        <button
          (click)="handleToggle()"
          class="w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer border border-transparent"
          [ngClass]="{
            'bg-green-100 text-green-700 hover:bg-green-200': todayLog()?.completed && habit().category === 'good',
            'bg-red-100 text-red-700 hover:bg-red-200': todayLog()?.completed && habit().category === 'bad',
            'bg-gray-100 text-gray-700 hover:bg-gray-200': !todayLog()?.completed
          }"
        >
          @if (todayLog()?.completed) {
            <app-icon name="check" [size]="18"></app-icon>
            {{ habit().category === 'good' ? 'Completado' : 'Realizado hoy' }}
          } @else {
            <app-icon name="x" [size]="18"></app-icon>
            {{ habit().category === 'good' ? 'Marcar como completado' : 'Marcar si lo hiciste' }}
          }
        </button>
      }

      <!-- Time Type -->
      @else if (habit().type === 'time') {
        <div class="space-y-3">
          <button
            (click)="setShowPomodoro(true)"
            class="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2 cursor-pointer border border-transparent"
          >
            <app-icon name="clock" [size]="18"></app-icon>
            Usar Pomodoro
          </button>
          <div class="flex gap-2">
            <input
              type="number"
              [value]="value()"
              (input)="handleValueInput($event)"
              placeholder="0"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <span class="flex items-center px-3 bg-gray-100 rounded-lg text-gray-700 text-sm">
              {{ habit().unit }}
            </span>
          </div>
          @if (habit().target) {
            <div class="space-y-1">
              <div class="flex justify-between text-sm text-gray-600">
                <span>Progreso</span>
                <span>{{ progressPercentage() }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  [style.width.%]="progressPercentage()"
                  [style.backgroundColor]="habit().color"
                ></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Count Type -->
      @else {
        <div class="space-y-3">
          <div class="flex gap-2">
            <input
              type="number"
              [value]="value()"
              (input)="handleValueInput($event)"
              placeholder="0"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <span class="flex items-center px-3 bg-gray-100 rounded-lg text-gray-700 text-sm">
              {{ habit().unit }}
            </span>
          </div>
          @if (habit().target) {
            <div class="space-y-1">
              <div class="flex justify-between text-sm text-gray-600">
                <span>Progreso</span>
                <span>{{ progressPercentage() }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  [style.width.%]="progressPercentage()"
                  [style.backgroundColor]="habit().color"
                ></div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (showPomodoro() && habit().type === 'time') {
      <app-pomodoro-timer
        [habit]="habit()"
        (close)="setShowPomodoro(false)"
        (complete)="handlePomodoroComplete($event)"
      ></app-pomodoro-timer>
    }
  `
})
export class HabitCardComponent {
  public readonly habit = input.required<Habit>();

  private readonly habitsService = inject(HabitsService);
  private readonly toastService = inject(ToastService);

  // States
  protected readonly value = signal<string>('');
  protected readonly showPomodoro = signal<boolean>(false);

  // Computed
  protected readonly today = computed(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  protected readonly todayLog = computed(() => {
    return this.habitsService.logs().find(l => l.habitId === this.habit().id && l.date === this.today());
  });

  protected readonly streak = computed(() => {
    return this.habitsService.getStreak(this.habit().id);
  });

  protected readonly progressPercentage = computed(() => {
    const habitData = this.habit();
    const log = this.todayLog();

    if (habitData.type === 'boolean') {
      return log?.completed ? 100 : 0;
    }
    if (habitData.target && log?.value) {
      return Math.round(Math.min((log.value / habitData.target) * 100, 100));
    }
    return 0;
  });

  constructor() {
    // Sync external changes of the log with local input value
    effect(() => {
      const log = this.todayLog();
      this.value.set(log?.value?.toString() || '');
    });
  }

  protected handleToggle(): void {
    const isCompleted = !this.todayLog()?.completed;
    this.habitsService.logHabit(this.habit().id, this.today(), isCompleted, this.todayLog()?.value);

    if (this.habit().category === 'good' && isCompleted) {
      this.toastService.success(`¡Genial! Completaste "${this.habit().name}"`);
    } else if (this.habit().category === 'bad' && isCompleted) {
      this.toastService.error(`Registrado: "${this.habit().name}". ¡Mañana lo harás mejor!`);
    }
  }

  protected handleValueInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    this.value.set(val);

    const numValue = parseFloat(val);
    if (!isNaN(numValue)) {
      const habitData = this.habit();
      const completed = habitData.target ? numValue >= habitData.target : numValue > 0;
      this.habitsService.logHabit(habitData.id, this.today(), completed, numValue);
    }
  }

  protected handleDelete(): void {
    if (confirm(`¿Estás seguro de eliminar "${this.habit().name}"?`)) {
      this.habitsService.removeHabit(this.habit().id);
      this.toastService.success('Hábito eliminado');
    }
  }

  protected setShowPomodoro(show: boolean): void {
    this.showPomodoro.set(show);
  }

  protected handlePomodoroComplete(timeWorked: number): void {
    this.value.set(timeWorked.toString());
    const isCompleted = timeWorked >= (this.habit().target || 0);
    this.habitsService.logHabit(this.habit().id, this.today(), isCompleted, timeWorked);
    this.setShowPomodoro(false);
    this.toastService.success(`¡Hábito completado! ${timeWorked} ${this.habit().unit}`);
  }
}
