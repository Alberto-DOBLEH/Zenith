import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegistroPayload } from '../../core/servicios/auth.service';

@Component({
  selector: 'app-autenticacion',
  imports: [ReactiveFormsModule],
  templateUrl: './autenticacion.html',
  styleUrl: './autenticacion.css',
})
export class Autenticacion {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  pestanaActiva = signal<'login' | 'registro'>('login');
  cargando = signal(false);
  mensajeError = signal('');
  mensajeExito = signal('');

  formLogin = this.fb.group({
    login: ['', Validators.required],
    contraseña: ['', Validators.required]
  });

  formRegistro = this.fb.group({
    nombre: ['', Validators.required],
    primer_apellido: ['', Validators.required],
    segundo_apellido: [''],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]{3,16}$/)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.pattern(/^\d{10}$/)]],
    contraseña: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
    confirmar_contraseña: ['', Validators.required]
  }, { validators: this.coincidenContraseñas });

  cambiarPestana(pestana: 'login' | 'registro') {
    this.pestanaActiva.set(pestana);
    this.mensajeError.set('');
    this.mensajeExito.set('');
  }

  coincidenContraseñas(group: { get: (campo: string) => { value: string } | null }) {
    const contraseña = group.get('contraseña')?.value;
    const confirmar = group.get('confirmar_contraseña')?.value;
    return contraseña === confirmar ? null : { noCoinciden: true };
  }

  iniciarSesion() {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set('');
    const { login, contraseña } = this.formLogin.value;

    this.authService.login(login!, contraseña!).subscribe({
      next: () => {
        this.authService.cargarPerfil().subscribe({
          next: () => {
            this.cargando.set(false);
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.cargando.set(false);
            this.mensajeError.set(this.authService.manejarError(error));
          }
        });
      },
      error: (error) => {
        this.cargando.set(false);
        this.mensajeError.set(this.authService.manejarError(error));
      }
    });
  }

  registrar() {
    if (this.formRegistro.invalid) {
      this.formRegistro.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set('');

    const datos: RegistroPayload = {
      nombre: this.formRegistro.value.nombre!,
      primer_apellido: this.formRegistro.value.primer_apellido!,
      segundo_apellido: this.formRegistro.value.segundo_apellido || undefined,
      username: this.formRegistro.value.username!,
      correo: this.formRegistro.value.correo!,
      telefono: this.formRegistro.value.telefono || undefined,
      contraseña: this.formRegistro.value.contraseña!
    };

    this.authService.registrar(datos).subscribe({
      next: () => {
        this.cargando.set(false);
        this.mensajeExito.set('Cuenta creada correctamente. Revisa tu correo para verificar tu cuenta.');
        this.mensajeError.set('');
        this.formRegistro.reset();
      },
      error: (error) => {
        this.cargando.set(false);
        this.mensajeError.set(this.authService.manejarError(error));
      }
    });
  }

  mostrarError(campo: string, form: 'login' | 'registro'): boolean {
    const control = form === 'login'
      ? this.formLogin.get(campo)
      : this.formRegistro.get(campo);
    return !!control && control.invalid && control.touched;
  }
}
