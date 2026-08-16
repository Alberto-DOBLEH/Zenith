import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface EditarPerfilPayload {
    nombre: string;
    primer_apellido: string;
    segundo_apellido?: string | null;
    foto_perfil?: string | null;
    avatar?: number | null;
    fecha_nacimiento?: string | null;
    pais?: string | null;
}

export interface CambiarPasswordPayload {
    contraseña_actual: string;
    contraseña_nueva: string;
}

export interface RespuestaMensaje {
    message: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
    private readonly api = inject(ApiService);

    editarPerfil(datos: EditarPerfilPayload): Observable<RespuestaMensaje> {
        return this.api.put<RespuestaMensaje>('/usuario/editar_perfil', datos);
    }

    cambiarPassword(contraseña_actual: string, contraseña_nueva: string): Observable<RespuestaMensaje> {
        return this.api.put<RespuestaMensaje>('/usuario/cambiar_password', {
            contraseña_actual,
            contraseña_nueva
        });
    }

    eliminarCuenta(): Observable<RespuestaMensaje> {
        return this.api.delete<RespuestaMensaje>('/usuario/');
    }
}
