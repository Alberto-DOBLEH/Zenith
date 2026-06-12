import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            {{ isRegister() ? 'Crear Cuenta' : 'Iniciar Sesión' }}
          </h1>
          <p class="text-gray-600">
            {{ isRegister() ? 'Comienza tu viaje de hábitos saludables' : 'Bienvenido de vuelta' }}
          </p>
        </div>

        <form (ngSubmit)="handleSubmit()" class="space-y-6">
          @if (isRegister()) {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                [(ngModel)]="name"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Tu nombre"
                [required]="isRegister()"
              />
            </div>
          }

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            @if (isRegister()) {
              <app-icon name="user-plus" [size]="20"></app-icon>
              Registrarse
            } @else {
              <app-icon name="login" [size]="20"></app-icon>
              Iniciar Sesión
            }
          </button>
        </form>

        <div class="mt-6 text-center">
          <button
            (click)="toggleMode()"
            class="text-blue-600 hover:text-blue-700 font-medium cursor-pointer bg-transparent border-0 outline-none"
          >
            {{ isRegister() ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  protected readonly isRegister = signal<boolean>(false);
  protected name = '';
  protected email = '';
  protected password = '';

  protected toggleMode(): void {
    this.isRegister.update(val => !val);
    this.name = '';
    this.email = '';
    this.password = '';
  }

  protected async handleSubmit(): Promise<void> {
    if (this.isRegister()) {
      if (!this.name.trim()) {
        this.toastService.error('Por favor ingresa tu nombre');
        return;
      }
      const success = await this.authService.register(this.email, this.password, this.name);
      if (success) {
        this.toastService.success('Cuenta creada exitosamente');
      } else {
        this.toastService.error('El correo ya está registrado');
      }
    } else {
      const success = await this.authService.login(this.email, this.password);
      if (success) {
        this.toastService.success('Bienvenido de vuelta');
      } else {
        this.toastService.error('Credenciales incorrectas');
      }
    }
  }
}
