import { Component, input, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitsService } from '../../services/habits.service';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-daily-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center gap-2 mb-6">
        <app-icon name="file-text" [size]="24" class="text-blue-600"></app-icon>
        <h3 class="text-xl font-bold text-gray-900">Notas del Día</h3>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Puntos Fuertes
          </label>
          <textarea
            [(ngModel)]="strengths"
            placeholder="¿Qué hiciste bien hoy?"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows="4"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Áreas de Mejora
          </label>
          <textarea
            [(ngModel)]="improvements"
            placeholder="¿Qué puedes mejorar mañana?"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows="4"
          ></textarea>
        </div>

        <button
          (click)="handleSave()"
          class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
        >
          <app-icon name="save" [size]="18"></app-icon>
          Guardar Notas
        </button>
      </div>
    </div>
  `
})
export class DailyNotesComponent {
  public readonly date = input.required<string>();

  private readonly habitsService = inject(HabitsService);
  private readonly toastService = inject(ToastService);

  protected strengths = '';
  protected improvements = '';

  constructor() {
    // Reactively update notes when active date changes
    effect(() => {
      const activeDate = this.date();
      const note = this.habitsService.getNote(activeDate);
      this.strengths = note?.strengths || '';
      this.improvements = note?.improvements || '';
    });
  }

  protected handleSave(): void {
    this.habitsService.saveNote(this.date(), this.strengths, this.improvements);
    this.toastService.success('Notas guardadas');
  }
}
