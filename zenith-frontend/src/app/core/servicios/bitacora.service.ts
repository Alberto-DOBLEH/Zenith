import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, CLAVES_CACHE } from './cache.service';

export interface RespuestaBitacora {
    message: string;
    estado: string;
    valor_realizado: number | null;
}

export interface DiaEstadistica {
    fecha: string;
    total_programados: number;
    completados: number;
    otros: number;
}

export interface RegistrarProgresoPayload {
    habito: number;
    incremento?: number;
    valor_realizado?: number;
    estado?: string;
}

@Injectable({ providedIn: 'root' })
export class BitacoraService {
    private readonly api = inject(ApiService);
    private readonly cache = inject(CacheService);

    registrar(datos: RegistrarProgresoPayload): Observable<RespuestaBitacora> {
        // Marcar un hábito cambia estados, rachas y cumplimiento en todas partes.
        this.cache.invalidar(
            CLAVES_CACHE.dashboard,
            CLAVES_CACHE.estadisticasGenerales,
            CLAVES_CACHE.estadisticasMapa
        );
        this.cache.invalidarPrefijo(CLAVES_CACHE.bitacora);
        return this.api.post<RespuestaBitacora>('/bitacora', datos);
    }

    obtenerPorPeriodo(periodo: string): Observable<DiaEstadistica[]> {
        return this.cache.swr(
            `${CLAVES_CACHE.bitacora}${periodo}`,
            () => this.api.get<DiaEstadistica[]>('/bitacora', { periodo })
        );
    }
}