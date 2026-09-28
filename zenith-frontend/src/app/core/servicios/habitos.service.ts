import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, CLAVES_CACHE } from './cache.service';

export interface TipoHabito {
    id_tipo_habito: number;
    nombre: string;
}

export interface Habito {
    id_habito: number;
    tipo_habito: number;
    tipo_nombre: string;
    nombre: string;
    descripcion: string | null;
    meta: number | null;
    unidad: string | null;
    frecuencia: 'DIARIO' | 'SEMANAL' | 'MENSUAL';
    dia_del_mes: number | null;
    estado: string;
    fecha_creacion: string;
    pomodoro_habilitado: boolean;
    dias: string[];
}

export interface HabitoPayload {
    tipo_habito: number;
    nombre: string;
    descripcion?: string;
    frecuencia: string;
    meta?: number | null;
    unidad?: string | null;
    pomodoro_habilitado?: boolean;
    dias?: string[];
    dia_del_mes?: number | null;
}

export interface RespuestaId {
    message: string;
    id_habito: number;
}

export interface RespuestaMensaje {
    message: string;
}

@Injectable({ providedIn: 'root' })
export class HabitosService {
    private readonly api = inject(ApiService);
    private readonly cache = inject(CacheService);

    obtenerTipos(): Observable<TipoHabito[]> {
        return this.cache.swr(
            CLAVES_CACHE.habitosTipos,
            () => this.api.get<TipoHabito[]>('/habito/tipos'),
            Number.POSITIVE_INFINITY
        );
    }

    obtener(): Observable<Habito[]> {
        return this.cache.swr(CLAVES_CACHE.habitos, () => this.api.get<Habito[]>('/habito'));
    }

    crear(datos: HabitoPayload): Observable<RespuestaId> {
        this.invalidarRelacionados();
        return this.api.post<RespuestaId>('/habito', datos);
    }

    editar(id_habito: number, datos: Partial<HabitoPayload>): Observable<RespuestaMensaje> {
        this.invalidarRelacionados();
        return this.api.put<RespuestaMensaje>(`/habito/${id_habito}`, datos);
    }

    eliminar(id_habito: number): Observable<RespuestaMensaje> {
        this.invalidarRelacionados();
        return this.api.delete<RespuestaMensaje>(`/habito/${id_habito}`);
    }

    private invalidarRelacionados(): void {
        this.cache.invalidar(
            CLAVES_CACHE.habitos,
            CLAVES_CACHE.dashboard,
            CLAVES_CACHE.estadisticasGenerales,
            CLAVES_CACHE.estadisticasMapa
        );
    }
}