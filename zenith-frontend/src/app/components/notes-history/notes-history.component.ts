import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitsService, DailyNote } from '../../services/habits.service';
import { IconComponent } from '../icon/icon.component';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-notes-history',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="max-w-5xl mx-auto">
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex items-center gap-3 mb-6">
          <app-icon name="file-text" [size]="32" class="text-blue-600"></app-icon>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Historial de Notas</h2>
            <p class="text-gray-600">Revisa tus reflexiones pasadas</p>
          </div>
        </div>

        @if (sortedNotes().length === 0) {
          <div class="text-center py-12">
            <app-icon name="file-text" [size]="64" class="mx-auto text-gray-300 mb-4"></app-icon>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">
              No hay notas todavía
            </h3>
            <p class="text-gray-500">
              Comienza a escribir tus reflexiones diarias desde el dashboard
            </p>
          </div>
        } @else {
          <div class="space-y-6">
            @for (note of currentNotes(); track note.date) {
              <div
                class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200"
              >
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <app-icon name="calendar" [size]="20" class="text-blue-600"></app-icon>
                    <div>
                      <h3 class="font-semibold text-gray-900">
                        {{ formatDate(note.date) }}
                      </h3>
                      <p class="text-sm text-gray-500">{{ getDaysAgo(note.date) }}</p>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h4 class="font-medium text-gray-700">Puntos Fuertes</h4>
                    </div>
                    <p class="text-gray-600 bg-green-50/50 rounded-lg p-4 whitespace-pre-wrap">
                      {{ note.strengths || 'Sin notas' }}
                    </p>
                  </div>

                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <h4 class="font-medium text-gray-700">Áreas de Mejora</h4>
                    </div>
                    <p class="text-gray-600 bg-orange-50/50 rounded-lg p-4 whitespace-pre-wrap">
                      {{ note.improvements || 'Sin notas' }}
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>

          @if (totalPages() > 1) {
            <div class="flex items-center justify-center gap-4 mt-8">
              <button
                (click)="prevPage()"
                [disabled]="currentPage() === 0"
                class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <app-icon name="chevron-left" [size]="18"></app-icon>
                Anterior
              </button>

              <span class="text-gray-600 text-sm">
                Página {{ currentPage() + 1 }} de {{ totalPages() }}
              </span>

              <button
                (click)="nextPage()"
                [disabled]="currentPage() === totalPages() - 1"
                class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
                <app-icon name="chevron-right" [size]="18"></app-icon>
              </button>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class NotesHistoryComponent {
  private readonly habitsService = inject(HabitsService);

  protected readonly notesPerPage = 5;
  protected readonly currentPage = signal<number>(0);

  // Computed signals
  protected readonly sortedNotes = computed(() => {
    return [...this.habitsService.notes()].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  protected readonly totalPages = computed(() => {
    return Math.ceil(this.sortedNotes().length / this.notesPerPage);
  });

  protected readonly currentNotes = computed(() => {
    const start = this.currentPage() * this.notesPerPage;
    return this.sortedNotes().slice(start, start + this.notesPerPage);
  });

  protected prevPage(): void {
    this.currentPage.update(p => Math.max(0, p - 1));
  }

  protected nextPage(): void {
    this.currentPage.update(p => Math.min(this.totalPages() - 1, p + 1));
  }

  protected formatDate(dateStr: string): string {
    try {
      const parsed = parseISO(dateStr);
      const formatted = format(parsed, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch (e) {
      return dateStr;
    }
  }

  protected getDaysAgo(dateStr: string): string {
    try {
      const date = parseISO(dateStr);
      const today = new Date();
      today.setHours(0,0,0,0);
      const compareDate = new Date(date);
      compareDate.setHours(0,0,0,0);
      
      const diffTime = today.getTime() - compareDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Ayer';
      return `Hace ${diffDays} días`;
    } catch (e) {
      return '';
    }
  }
}
