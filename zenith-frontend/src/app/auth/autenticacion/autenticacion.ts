import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/servicios/auth.service';

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

  pestanaActiva: 'login' | 'registro' = 'login';
  cargando = false;
  mensajeError = '';
  mensajeExito = '';

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
    telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    contraseña: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
    confirmar_contraseña: ['', Validators.required]
  }, { validators: this.coincidenContraseñas });

  cambiarPestana(pestana: 'login' | 'registro') {
    this.pestanaActiva = pestana;
    this.mensajeError = '';
    this.mensajeExito = '';
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

    this.cargando = true;
    this.mensajeError = '';
    const { login, contraseña } = this.formLogin.value;

    this.authService.login(login!, contraseña!).subscribe({
      next: () => {
        this.authService.cargarPerfil().subscribe({
          next: () => {
            this.cargando = false;
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.cargando = false;
            this.mensajeError = this.authService.manejarError(error);
          }
        });
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = this.authService.manejarError(error);
      }
    });
  }

  registrar() {
    if (this.formRegistro.invalid) {
      this.formRegistro.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    const datos = {
      nombre: this.formRegistro.value.nombre!,
      primer_apellido: this.formRegistro.value.primer_apellido!,
      segundo_apellido: this.formRegistro.value.segundo_apellido || undefined,
      username: this.formRegistro.value.username!,
      correo: this.formRegistro.value.correo!,
      telefono: this.formRegistro.value.telefono!,
      contraseña: this.formRegistro.value.contraseña!
    };

    this.authService.registrar(datos).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeExito = 'Cuenta creada correctamente. Inicia sesión.';
        this.cambiarPestana('login');
        this.formLogin.reset();
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = this.authService.manejarError(error);
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
