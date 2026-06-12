import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitsService } from '../../services/habits.service';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

@Component({
  selector: 'app-add-habit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Nuevo Hábito</h2>
            <button
              (click)="handleClose()"
              class="text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <app-icon name="x" [size]="24"></app-icon>
            </button>
          </div>

          <form (ngSubmit)="handleSubmit()" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del hábito
              </label>
              <input
                type="text"
                name="name"
                [(ngModel)]="name"
                placeholder="Ej: Hacer ejercicio, Estudiar matemáticas..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  (click)="setCategory('good')"
                  class="py-3 rounded-lg font-medium transition cursor-pointer"
                  [ngClass]="{
                    'bg-green-100 text-green-700 border-2 border-green-500': category === 'good',
                    'bg-gray-100 text-gray-700 border-2 border-transparent': category !== 'good'
                  }"
                >
                  Hábito Bueno
                </button>
                <button
                  type="button"
                  (click)="setCategory('bad')"
                  class="py-3 rounded-lg font-medium transition cursor-pointer"
                  [ngClass]="{
                    'bg-red-100 text-red-700 border-2 border-red-500': category === 'bad',
                    'bg-gray-100 text-gray-700 border-2 border-transparent': category !== 'bad'
                  }"
                >
                  Hábito a Evitar
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tipo de seguimiento
              </label>
              <select
                name="type"
                [(ngModel)]="type"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="boolean">Sí/No (Completado o no)</option>
                <option value="time">Tiempo (Horas, minutos)</option>
                <option value="count">Cantidad (Repeticiones, páginas)</option>
              </select>
            </div>

            @if (type === 'time' || type === 'count') {
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Meta {{ type === 'time' ? '(tiempo)' : '(cantidad)' }}
                </label>
                <input
                  type="number"
                  name="target"
                  [(ngModel)]="target"
                  placeholder="Ej: 4, 30, 100..."
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Unidad
                </label>
                <input
                  type="text"
                  name="unit"
                  [(ngModel)]="unit"
                  [placeholder]="type === 'time' ? 'horas, minutos' : 'páginas, repeticiones'"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            }

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Color
              </label>
              <div class="grid grid-cols-5 gap-3">
                @for (c of colorsList; track c) {
                  <button
                    type="button"
                    (click)="setColor(c)"
                    class="w-full aspect-square rounded-lg transition cursor-pointer"
                    [class.ring-4]="color === c"
                    [class.ring-offset-2]="color === c"
                    [class.ring-blue-500]="color === c"
                    [style.backgroundColor]="c"
                  ></button>
                }
              </div>
            </div>

            <button
              type="submit"
              class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
            >
              Agregar Hábito
            </button>
          </form>
        </div>
      </div>
    }
  `
})
export class AddHabitModalComponent {
  private readonly habitsService = inject(HabitsService);
  private readonly toastService = inject(ToastService);

  public readonly isOpen = input.required<boolean>();
  public readonly close = output<void>();

  protected readonly colorsList = COLORS;

  protected name = '';
  protected type: 'boolean' | 'time' | 'count' = 'boolean';
  protected category: 'good' | 'bad' = 'good';
  protected target = '';
  protected unit = '';
  protected color = COLORS[0];

  protected setCategory(category: 'good' | 'bad'): void {
    this.category = category;
  }

  protected setColor(color: string): void {
    this.color = color;
  }

  protected handleClose(): void {
    this.close.emit();
  }

  protected handleSubmit(): void {
    if (!this.name.trim()) {
      this.toastService.error('Por favor ingresa un nombre para el hábito');
      return;
    }

    this.habitsService.addHabit({
      name: this.name.trim(),
      type: this.type,
      category: this.category,
      target: this.target ? parseFloat(this.target) : undefined,
      unit: this.unit.trim() || undefined,
      color: this.color
    });

    this.toastService.success('Hábito agregado exitosamente');
    this.resetForm();
    this.handleClose();
  }

  private resetForm(): void {
    this.name = '';
    this.type = 'boolean';
    this.category = 'good';
    this.target = '';
    this.unit = '';
    this.color = COLORS[0];
  }
}
