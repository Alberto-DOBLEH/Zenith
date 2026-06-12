import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HabitsService } from '../../services/habits.service';
import { IconComponent } from '../icon/icon.component';
import { HabitCardComponent } from '../habit-card/habit-card.component';
import { AddHabitModalComponent } from '../add-habit-modal/add-habit-modal.component';
import { DailyNotesComponent } from '../daily-notes/daily-notes.component';
import { ProgressChartComponent } from '../progress-chart/progress-chart.component';
import { NotesHistoryComponent } from '../notes-history/notes-history.component';
import { ProfileComponent } from '../profile/profile.component';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Section = 'dashboard' | 'notes' | 'profile';
type ChartView = 'today' | 'week' | 'month';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    HabitCardComponent,
    AddHabitModalComponent,
    DailyNotesComponent,
    ProgressChartComponent,
    NotesHistoryComponent,
    ProfileComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Sticky Navigation Header -->
      <nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center gap-3">
              <app-icon name="flame" [size]="32" class="text-orange-500"></app-icon>
              <h1 class="text-2xl font-bold text-gray-900 hidden sm:block">Mis Hábitos</h1>
            </div>

            <div class="flex items-center gap-2">
              <button
                (click)="setSection('dashboard')"
                class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition cursor-pointer"
                [ngClass]="{
                  'bg-blue-100 text-blue-700': currentSection() === 'dashboard',
                  'text-gray-700 hover:bg-gray-100': currentSection() !== 'dashboard'
                }"
              >
                <app-icon name="home" [size]="18"></app-icon>
                <span class="hidden sm:inline">Inicio</span>
              </button>

              <button
                (click)="setSection('notes')"
                class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition cursor-pointer"
                [ngClass]="{
                  'bg-blue-100 text-blue-700': currentSection() === 'notes',
                  'text-gray-700 hover:bg-gray-100': currentSection() !== 'notes'
                }"
              >
                <app-icon name="file-text" [size]="18"></app-icon>
                <span class="hidden sm:inline">Notas</span>
              </button>

              <button
                (click)="setSection('profile')"
                class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition cursor-pointer"
                [ngClass]="{
                  'bg-blue-100 text-blue-700': currentSection() === 'profile',
                  'text-gray-700 hover:bg-gray-100': currentSection() !== 'profile'
                }"
              >
                <app-icon name="user" [size]="18"></app-icon>
                <span class="hidden sm:inline">Perfil</span>
              </button>
            </div>

            <button
              (click)="handleLogout()"
              class="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <app-icon name="logout" [size]="18"></app-icon>
              <span class="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Body Container -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (currentSection() === 'notes') {
          <app-notes-history></app-notes-history>
        } @else if (currentSection() === 'profile') {
          <app-profile></app-profile>
        } @else {
          <!-- Dashboard Section -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 class="text-3xl font-bold text-gray-900">
                {{ formattedToday() }}
              </h2>
              <p class="text-gray-600 mt-1 text-sm">
                {{ goodHabitsCount() }} hábitos buenos · {{ badHabitsCount() }} hábitos a evitar
              </p>
            </div>

            <button
              (click)="openAddModal()"
              class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              <app-icon name="plus" [size]="18"></app-icon>
              Nuevo Hábito
            </button>
          </div>

          <!-- View Period Selector -->
          <div class="flex gap-2 mb-8 overflow-x-auto pb-2">
            <button
              (click)="setView('today')"
              class="px-4 py-2 rounded-lg font-medium transition whitespace-nowrap cursor-pointer"
              [ngClass]="{
                'bg-blue-600 text-white': view() === 'today',
                'bg-white text-gray-700 hover:bg-gray-100': view() !== 'today'
              }"
            >
              Hoy
            </button>
            <button
              (click)="setView('week')"
              class="px-4 py-2 rounded-lg font-medium transition whitespace-nowrap cursor-pointer"
              [ngClass]="{
                'bg-blue-600 text-white': view() === 'week',
                'bg-white text-gray-700 hover:bg-gray-100': view() !== 'week'
              }"
            >
              Semana
            </button>
            <button
              (click)="setView('month')"
              class="px-4 py-2 rounded-lg font-medium transition whitespace-nowrap cursor-pointer"
              [ngClass]="{
                'bg-blue-600 text-white': view() === 'month',
                'bg-white text-gray-700 hover:bg-gray-100': view() !== 'month'
              }"
            >
              Mes
            </button>
          </div>

          <!-- Chart & Daily Notes Row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div class="lg:col-span-2">
              <app-progress-chart [view]="view()"></app-progress-chart>
            </div>
            <div>
              <app-daily-notes [date]="todayStr()"></app-daily-notes>
            </div>
          </div>

          <!-- Habits Lists Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Good Habits -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 class="text-xl font-bold text-gray-900">Hábitos Buenos</h3>
              </div>
              <div class="space-y-4">
                @if (goodHabits().length === 0) {
                  <div class="bg-white rounded-xl p-8 text-center text-gray-500 text-sm">
                    No tienes hábitos buenos aún. ¡Agrega uno!
                  </div>
                } @else {
                  @for (habit of goodHabits(); track habit.id) {
                    <app-habit-card [habit]="habit"></app-habit-card>
                  }
                }
              </div>
            </div>

            <!-- Bad Habits -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 class="text-xl font-bold text-gray-900">Hábitos a Evitar</h3>
              </div>
              <div class="space-y-4">
                @if (badHabits().length === 0) {
                  <div class="bg-white rounded-xl p-8 text-center text-gray-500 text-sm">
                    No tienes hábitos a evitar registrados
                  </div>
                } @else {
                  @for (habit of badHabits(); track habit.id) {
                    <app-habit-card [habit]="habit"></app-habit-card>
                  }
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Add Habit Modal Component -->
      <app-add-habit-modal
        [isOpen]="isAddModalOpen()"
        (close)="closeAddModal()"
      ></app-add-habit-modal>
    </div>
  `
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly habitsService = inject(HabitsService);

  protected readonly isAddModalOpen = signal<boolean>(false);
  protected readonly view = signal<ChartView>('today');
  protected readonly currentSection = signal<Section>('dashboard');

  // Computed local dates matching user timezone
  protected readonly todayStr = computed(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  protected readonly formattedToday = computed(() => {
    const formatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  });

  // Filtered habits list from habits service
  protected readonly goodHabits = computed(() => {
    return this.habitsService.habits().filter(h => h.category === 'good');
  });

  protected readonly badHabits = computed(() => {
    return this.habitsService.habits().filter(h => h.category === 'bad');
  });

  protected readonly goodHabitsCount = computed(() => this.goodHabits().length);
  protected readonly badHabitsCount = computed(() => this.badHabits().length);

  protected setSection(section: Section): void {
    this.currentSection.set(section);
  }

  protected setView(view: ChartView): void {
    this.view.set(view);
  }

  protected handleLogout(): void {
    this.authService.logout();
  }

  protected openAddModal(): void {
    this.isAddModalOpen.set(true);
  }

  protected closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }
}
