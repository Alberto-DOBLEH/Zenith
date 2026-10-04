import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, CLAVES_CACHE } from './cache.service';

export type EstadoActividad = 'PENDIENTE' | 'COMPLETADA';

export interface Actividad {
    id_actividad: number;
    titulo: string;
    descripcion: string | null;
    fecha_limite: string;
    estado: EstadoActividad;
    created_at?: string;
}

export interface ActividadPayload {
    titulo: string;
    descripcion?: string | null;
    fecha_limite: string;
    estado?: EstadoActividad;
}

export interface RespuestaActividad {
    message: string;
    actividad: Actividad;
}

@Injectable({ providedIn: 'root' })
export class ActividadesService {
    private readonly api = inject(ApiService);
    private readonly cache = inject(CacheService);

    obtener(): Observable<Actividad[]> {
        return this.cache.swr(CLAVES_CACHE.actividades, () => this.api.get<Actividad[]>('/actividades'));
    }

    crear(datos: ActividadPayload): Observable<RespuestaActividad> {
        this.cache.invalidar(CLAVES_CACHE.actividades);
        return this.api.post<RespuestaActividad>('/actividades', datos);
    }

    editar(id_actividad: number, datos: Partial<ActividadPayload>): Observable<RespuestaActividad> {
        this.cache.invalidar(CLAVES_CACHE.actividades);
        return this.api.put<RespuestaActividad>(`/actividades/${id_actividad}`, datos);
    }

    eliminar(id_actividad: number): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.actividades);
        return this.api.delete<{ message: string }>(`/actividades/${id_actividad}`);
    }
}
