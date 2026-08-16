import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SesionPomodoro {
    id_sesion: number;
    habito: number | null;
    habito_nombre: string | null;
    fecha_inicio: string;
    fecha_fin: string | null;
    minutos_objetivo: number;
    minutos_realizados: number;
    ciclos_objetivo: number;
    ciclos_completados: number;
}

export interface RespuestaCrearSesion {
    message: string;
    sesion: {
        id_sesion: number;
        habito: number | null;
        fecha_inicio: string;
        minutos_objetivo: number;
        ciclos_objetivo: number;
    };
}

export interface RespuestaAvanzarSesion {
    message: string;
    sesion?: SesionPomodoro;
    completado?: boolean;
}

export interface AvanzarSesionPayload {
    minutos_realizados?: number;
    ciclos_completados?: number;
    finalizar?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PomodoroService {
    private readonly api = inject(ApiService);

    crearSesion(minutos_objetivo: number, habito?: number | null): Observable<RespuestaCrearSesion> {
        return this.api.post<RespuestaCrearSesion>('/pomodoro', {
            habito: habito || null,
            minutos_objetivo
        });
    }

    obtenerSesiones(): Observable<SesionPomodoro[]> {
        return this.api.get<SesionPomodoro[]>('/pomodoro');
    }

    avanzarSesion(id_sesion: number, datos: AvanzarSesionPayload): Observable<RespuestaAvanzarSesion> {
        return this.api.put<RespuestaAvanzarSesion>(`/pomodoro/${id_sesion}`, datos);
    }

    eliminarSesion(id_sesion: number): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`/pomodoro/${id_sesion}`);
    }
}
