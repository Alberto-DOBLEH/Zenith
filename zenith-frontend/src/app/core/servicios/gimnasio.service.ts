import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, CLAVES_CACHE } from './cache.service';

export interface Ejercicio {
    id_ejercicio: number;
    nombre: string;
    grupo_muscular: string;
}

export interface EjercicioPayload {
    nombre: string;
    grupo_muscular: string;
}

export interface FiltrosEjercicios {
    grupo?: string;
    q?: string;
}

export interface SplitResumen {
    id_split: number;
    nombre: string;
    es_activo: boolean;
    sesiones: number;
}

export interface EjercicioReceta {
    id_ejercicio: number;
    nombre: string;
    grupo_muscular: string;
    orden: number;
}

export interface SesionPlan {
    id_sesion_plan: number;
    nombre_sesion: string;
    dia_asignado: number;
    ejercicios?: EjercicioReceta[];
}

export interface SplitDetalle {
    id_split: number;
    nombre: string;
    es_activo: boolean;
    sesiones: SesionPlan[];
}

export interface SplitPayload {
    nombre: string;
    es_activo?: boolean;
}

export interface SesionPayload {
    nombre_sesion?: string;
    dia_asignado?: number;
}

export interface RecetaPayload {
    ejercicios: { id_ejercicio: number; orden?: number }[];
}

export interface PR {
    peso: number;
    unidad_peso: 'kg' | 'lbs';
    repeticiones: number;
    fecha: string;
}

export interface SerieSinId {
    numero_serie: number;
    repeticiones: number;
    peso: number;
    unidad_peso: 'kg' | 'lbs';
}

export interface UltimaVez {
    fecha: string;
    series: SerieSinId[];
}

export interface EjercicioHoy {
    id_ejercicio: number;
    nombre: string;
    grupo_muscular: string;
    orden: number;
    pr: PR | null;
    ultima_vez: UltimaVez | null;
}

export interface EntrenamientoActivo {
    id_entrenamiento: number;
    id_sesion_plan: number;
    nombre_sesion: string;
    dia_asignado: number;
    fecha_inicio: string;
    fecha_fin: string | null;
}

export interface PlanHoy {
    fecha: string;
    dia_semana: number;
    split: { id_split: number; nombre: string } | null;
    sesion: { id_sesion_plan: number; nombre_sesion: string; dia_asignado: number } | null;
    entrenamiento_activo: EntrenamientoActivo | null;
    ejercicios: EjercicioHoy[];
}

export interface SerieHistorial {
    id_serie: number;
    id_ejercicio: number;
    numero_serie: number;
    repeticiones: number;
    peso: number;
    unidad_peso: 'kg' | 'lbs';
}

export interface SeriePayload {
    id_ejercicio: number;
    numero_serie: number;
    repeticiones: number;
    peso: number;
    unidad_peso: 'kg' | 'lbs';
}

export interface SerieEdicionPayload {
    repeticiones?: number;
    peso?: number;
    unidad_peso?: 'kg' | 'lbs';
}

export interface EntrenamientoResumen {
    id_entrenamiento: number;
    id_sesion_plan: number;
    nombre_sesion: string;
    id_split: number;
    nombre_split: string;
    fecha_inicio: string;
    fecha_fin: string | null;
    ejercicios: number;
    series: number;
    duracion_minutos: number | null;
}

export interface EjercicioEntrenado {
    id_ejercicio: number;
    nombre: string;
    grupo_muscular: string;
    orden: number | null;
    series: SerieHistorial[];
}

export interface EntrenamientoDetalle {
    id_entrenamiento: number;
    id_sesion_plan: number;
    nombre_sesion: string;
    id_split: number;
    nombre_split: string;
    fecha_inicio: string;
    fecha_fin: string | null;
    duracion_minutos: number | null;
    ejercicios: EjercicioEntrenado[];
}

export interface FiltrosHistorial {
    [clave: string]: string | undefined;
    fecha?: string;
    mes?: string;
}

@Injectable({ providedIn: 'root' })
export class GimnasioService {
    private readonly api = inject(ApiService);
    private readonly cache = inject(CacheService);

    // ---------- Entrenamiento ----------

    obtenerPlan(): Observable<PlanHoy> {
        return this.cache.swr(CLAVES_CACHE.gimnasioHoy, () =>
            this.api.get<PlanHoy>('/entrenamientos/hoy'));
    }

    obtenerHistorial(filtros?: FiltrosHistorial): Observable<EntrenamientoResumen[]> {
        if (filtros && (filtros.fecha || filtros.mes)) {
            return this.api.get<EntrenamientoResumen[]>('/entrenamientos', filtros);
        }
        return this.cache.swr(CLAVES_CACHE.gimnasioHistorial, () =>
            this.api.get<EntrenamientoResumen[]>('/entrenamientos'));
    }

    iniciarEntrenamiento(): Observable<{ message: string; entrenamiento: { id_entrenamiento: number } }> {
        this.cache.invalidar(CLAVES_CACHE.gimnasioHoy, CLAVES_CACHE.gimnasioHistorial);
        return this.api.post('/entrenamientos', {});
    }

    obtenerEntrenamiento(id: number): Observable<EntrenamientoDetalle> {
        return this.api.get<EntrenamientoDetalle>(`/entrenamientos/${id}`);
    }

    finalizarEntrenamiento(id: number): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.gimnasioHoy, CLAVES_CACHE.gimnasioHistorial);
        return this.api.put(`/entrenamientos/${id}/finalizar`, {});
    }

    eliminarEntrenamiento(id: number): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.gimnasioHoy, CLAVES_CACHE.gimnasioHistorial);
        return this.api.delete(`/entrenamientos/${id}`);
    }

    crearSerie(idEntrenamiento: number, datos: SeriePayload): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.gimnasioHoy, CLAVES_CACHE.gimnasioHistorial);
        return this.api.post(`/entrenamientos/${idEntrenamiento}/series`, datos);
    }

    editarSerie(idSerie: number, datos: SerieEdicionPayload): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.gimnasioHoy, CLAVES_CACHE.gimnasioHistorial);
        return this.api.put(`/series/${idSerie}`, datos);
    }

    eliminarSerie(idSerie: number): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.gimnasioHoy, CLAVES_CACHE.gimnasioHistorial);
        return this.api.delete(`/series/${idSerie}`);
    }

    // ---------- Splits ----------

    obtenerSplits(): Observable<SplitResumen[]> {
        return this.cache.swr(CLAVES_CACHE.splits, () =>
            this.api.get<SplitResumen[]>('/splits'));
    }

    obtenerSplit(id: number): Observable<SplitDetalle> {
        return this.api.get<SplitDetalle>(`/splits/${id}`);
    }

    crearSplit(datos: SplitPayload): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.splits, CLAVES_CACHE.gimnasioHoy);
        return this.api.post('/splits', datos);
    }

    editarSplit(id: number, datos: Partial<SplitPayload>): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.splits);
        return this.api.put(`/splits/${id}`, datos);
    }

    activarSplit(id: number): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.splits, CLAVES_CACHE.gimnasioHoy);
        return this.api.put(`/splits/${id}/activar`, {});
    }

    eliminarSplit(id: number): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.splits, CLAVES_CACHE.gimnasioHoy);
        return this.api.delete(`/splits/${id}`);
    }

    crearSesion(idSplit: number, datos: SesionPayload): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.splits, CLAVES_CACHE.gimnasioHoy);
        return this.api.post(`/splits/${idSplit}/sesiones`, datos);
    }

    editarSesion(id: number, datos: SesionPayload): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.splits, CLAVES_CACHE.gimnasioHoy);
        return this.api.put(`/sesiones/${id}`, datos);
    }

    eliminarSesion(id: number): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.splits, CLAVES_CACHE.gimnasioHoy);
        return this.api.delete(`/sesiones/${id}`);
    }

    reemplazarEjercicios(idSesion: number, datos: RecetaPayload): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.splits, CLAVES_CACHE.gimnasioHoy);
        return this.api.put(`/sesiones/${idSesion}/ejercicios`, datos);
    }

    // ---------- Ejercicios ----------

    obtenerEjercicios(): Observable<Ejercicio[]> {
        return this.cache.swr(CLAVES_CACHE.ejercicios, () =>
            this.api.get<Ejercicio[]>('/ejercicios'));
    }

    crearEjercicio(datos: EjercicioPayload): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.ejercicios);
        return this.api.post('/ejercicios', datos);
    }

    editarEjercicio(id: number, datos: Partial<EjercicioPayload>): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.ejercicios);
        return this.api.put(`/ejercicios/${id}`, datos);
    }

    eliminarEjercicio(id: number): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.ejercicios);
        return this.api.delete(`/ejercicios/${id}`);
    }
}
