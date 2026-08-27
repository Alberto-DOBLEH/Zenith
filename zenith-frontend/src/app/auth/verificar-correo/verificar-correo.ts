import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/servicios/auth.service';

@Component({
  selector: 'app-verificar-correo',
  standalone: true,
  templateUrl: './verificar-correo.html',
  styleUrl: './verificar-correo.css',
})
export class VerificarCorreo implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  verificando = signal(true);
  exito = signal(false);
  mensajeError = signal('');

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    
    if (!token) {
      this.verificando.set(false);
      this.mensajeError.set('Token de verificación no válido');
      return;
    }

    this.authService.verificarCorreo(token).subscribe({
      next: () => {
        this.verificando.set(false);
        this.exito.set(true);
      },
      error: (error: unknown) => {
        this.verificando.set(false);
        this.mensajeError.set(this.authService.manejarError(error));
      }
    });
  }

  irALogin() {
    this.router.navigate(['/autenticacion']);
  }
}
