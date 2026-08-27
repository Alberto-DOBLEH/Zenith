import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

export interface Usuario {
    id_usuario: number;
    nombre: string;
    primer_apellido: string;
    segundo_apellido?: string;
    correo: string;
    telefono: string;
    username: string;
    foto_perfil?: string | null;
    avatar?: number | null;
    fecha_nacimiento?: string | null;
    pais?: string | null;
    estado: string;
}

export interface LoginResponse {
    message: string;
    token: string;
}

export interface RegistroResponse {
    message: string;
    user: {
        id_usuario: number;
        nombre: string;
        correo: string;
        username: string;
    };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly api = inject(ApiService);
    private readonly router = inject(Router);

    usuario = signal<Usuario | null>(null);
    readonly token = signal<string | null>(localStorage.getItem('zenith_token'));

    constructor() {
        if (this.token()) {
            this.cargarPerfil().subscribe();
        }
    }

    get estaAutenticado(): boolean {
        return this.token() !== null;
    }

    login(login: string, contraseña: string) {
        return this.api.post<LoginResponse>('/auth/login', { login, contraseña }).pipe(
            tap((respuesta) => {
                localStorage.setItem('zenith_token', respuesta.token);
                this.token.set(respuesta.token);
            })
        );
    }

    registrar(datos: RegistroPayload) {
        return this.api.post<RegistroResponse>('/auth/register', datos);
    }

    verificarCorreo(token: string) {
        return this.api.get<{ message: string }>(`/auth/verificar-email/${token}`);
    }

    cargarPerfil() {
        return this.api.get<Usuario>('/usuario/perfil').pipe(
            tap((usuario) => this.usuario.set(usuario)),
            catchError((error) => {
                if (error?.status === 401) {
                    this.cerrarSesion();
                }
                return throwError(() => error);
            })
        );
    }

    cerrarSesion() {
        localStorage.removeItem('zenith_token');
        this.token.set(null);
        this.usuario.set(null);
        this.router.navigate(['/autenticacion']);
    }

    manejarError(error: unknown): string {
        const err = error as { error?: { message?: string }; message?: string; status?: number };
        return err?.error?.message || err?.message || 'Error inesperado, intenta de nuevo';
    }
}

export interface RegistroPayload {
    nombre: string;
    primer_apellido: string;
    segundo_apellido?: string;
    correo: string;
    telefono?: string;
    username: string;
    contraseña: string;
}