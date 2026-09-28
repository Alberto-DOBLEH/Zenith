import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, CLAVES_CACHE } from './cache.service';

export interface Estadisticas {
    cumplimiento: number;
    completados: number;
    no_completados: number;
    racha_actual: number;
    racha_maxima: number;
}

export interface DiaMapa {
    fecha: string;
    estado: string | null;
    nivel: number;
}

export interface HabitoMapa {
    id_habito: number;
    nombre: string;
    tipo_habito: number;
    racha_actual: number;
    racha_maxima: number;
    dias: DiaMapa[];
}

export interface MapaEstadisticas {
    periodo: string;
    inicio: string;
    fin: string;
    habitos: HabitoMapa[];
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
    private readonly api = inject(ApiService);
    private readonly cache = inject(CacheService);

    obtenerGenerales(periodo = 'mes'): Observable<Estadisticas> {
        return this.cache.swr(
            CLAVES_CACHE.estadisticasGenerales,
            () => this.api.get<Estadisticas>('/estadisticas', { periodo })
        );
    }

    obtenerMapa(periodo = 'semestre'): Observable<MapaEstadisticas> {
        return this.cache.swr(
            CLAVES_CACHE.estadisticasMapa,
            () => this.api.get<MapaEstadisticas>('/estadisticas/mapa', { periodo })
        );
    }
}