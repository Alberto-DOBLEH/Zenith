import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HabitsService } from '../../services/habits.service';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="max-w-5xl mx-auto animate-fade-in">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Sidebar stats -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="text-center mb-6">
              <div class="relative inline-block mb-4">
                @if (avatar()) {
                  <img
                    [src]="avatar()"
                    alt="Avatar"
                    class="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                  />
                } @else {
                  <div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <app-icon name="user" [size]="48" class="text-white"></app-icon>
                  </div>
                }
                <label class="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                  <app-icon name="camera" [size]="18"></app-icon>
                  <input
                    type="file"
                    accept="image/*"
                    (change)="handleAvatarUpload($event)"
                    class="hidden"
                  />
                </label>
              </div>

              @if (avatar()) {
                <button
                  (click)="removeAvatar()"
                  class="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mx-auto mb-4 cursor-pointer"
                >
                  <app-icon name="trash" [size]="14"></app-icon>
                  Eliminar foto
                </button>
              }

              <h2 class="text-2xl font-bold text-gray-900">{{ authService.user()?.name }}</h2>
              <p class="text-gray-600 flex items-center justify-center gap-2 mt-1 text-sm">
                <app-icon name="mail" [size]="16"></app-icon>
                {{ authService.user()?.email }}
              </p>
            </div>

            <div class="space-y-4 pt-4 border-t border-gray-100 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Hábitos totales</span>
                <span class="font-semibold text-gray-900">{{ totalHabits() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Registros totales</span>
                <span class="font-semibold text-gray-900">{{ totalLogs() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Tasa de completado</span>
                <span class="font-semibold text-gray-900">{{ completionRate() }}%</span>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-gray-100">
              <div class="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  class="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                  [style.width.%]="completionRate()"
                ></div>
              </div>
              <p class="text-xs text-center text-gray-500">Progreso general</p>
            </div>
          </div>
        </div>

        <!-- Main Form Settings -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">Configuración del Perfil</h3>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  [(ngModel)]="name"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Biografía
                </label>
                <textarea
                  [(ngModel)]="bio"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Cuéntanos sobre ti y tus objetivos..."
                  rows="4"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <app-icon name="globe" [size]="18"></app-icon>
                  Idioma
                </label>
                <select
                  [(ngModel)]="language"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <app-icon name="calendar" [size]="18"></app-icon>
                  La semana comienza en
                </label>
                <select
                  [(ngModel)]="weekStartsOn"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option [value]="0">Domingo</option>
                  <option [value]="1">Lunes</option>
                  <option [value]="6">Sábado</option>
                </select>
              </div>

              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <app-icon name="bell" [size]="20" class="text-gray-600"></app-icon>
                  <div>
                    <p class="font-medium text-gray-900 text-sm">Notificaciones</p>
                    <p class="text-xs text-gray-500">
                      Recibe recordatorios para tus hábitos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  (click)="toggleNotifications()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
                  [ngClass]="notifications() ? 'bg-blue-600' : 'bg-gray-300'"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                    [ngClass]="notifications() ? 'translate-x-6' : 'translate-x-1'"
                  ></span>
                </button>
              </div>

              <button
                (click)="handleSave()"
                class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer border-0 outline-none"
              >
                <app-icon name="save" [size]="20"></app-icon>
                Guardar Cambios
              </button>
            </div>
          </div>

          <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 mt-6 text-white">
            <h3 class="text-xl font-bold mb-2">¡Sigue así!</h3>
            <p class="text-blue-100 text-sm">
              Has completado {{ completedLogsCount() }} hábitos desde que comenzaste.
              {{ completionRate() >= 70 ? ' ¡Estás haciendo un trabajo increíble!' : '' }}
              {{ completionRate() >= 50 && completionRate() < 70 ? ' ¡Buen progreso, sigue adelante!' : '' }}
              {{ completionRate() < 50 ? ' ¡Cada día es una nueva oportunidad!' : '' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProfileComponent {
  protected readonly authService = inject(AuthService);
  private readonly habitsService = inject(HabitsService);
  private readonly toastService = inject(ToastService);

  // Form states
  protected name = '';
  protected bio = '';
  protected readonly avatar = signal<string>('');
  protected language = 'es';
  protected readonly notifications = signal<boolean>(true);
  protected weekStartsOn = 1;

  // Stats computed from service signals
  protected readonly totalHabits = computed(() => this.habitsService.habits().length);
  protected readonly totalLogs = computed(() => this.habitsService.logs().length);
  protected readonly completedLogsCount = computed(() => this.habitsService.logs().filter(l => l.completed).length);
  protected readonly completionRate = computed(() => {
    const total = this.totalLogs();
    return total > 0 ? Math.round((this.completedLogsCount() / total) * 100) : 0;
  });

  constructor() {
    // Initialize form variables from the current user session
    const u = this.authService.user();
    if (u) {
      this.name = u.name || '';
      this.bio = u.bio || '';
      this.avatar.set(u.avatar || '');
      this.language = u.language || 'es';
      this.notifications.set(u.notifications ?? true);
      this.weekStartsOn = u.weekStartsOn ?? 1;
    }
  }

  protected handleAvatarUpload(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.avatar.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  protected removeAvatar(): void {
    this.avatar.set('');
  }

  protected toggleNotifications(): void {
    this.notifications.update(n => !n);
  }

  protected handleSave(): void {
    this.authService.updateProfile({
      name: this.name,
      bio: this.bio,
      avatar: this.avatar(),
      language: this.language,
      notifications: this.notifications(),
      weekStartsOn: Number(this.weekStartsOn)
    });
    this.toastService.success('Perfil actualizado');
  }
}
