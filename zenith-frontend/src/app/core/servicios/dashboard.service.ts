import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, CLAVES_CACHE } from './cache.service';

export interface HabitoResumen {
    id_habito: number;
    nombre: string;
    tipo_habito: number;
    estado: string;
    valor_realizado: number | null;
}

export interface ResumenDashboard {
    fecha: string;
    habitos: HabitoResumen[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly api = inject(ApiService);
    private readonly cache = inject(CacheService);

    obtenerResumen(): Observable<ResumenDashboard> {
        return this.cache.swr(CLAVES_CACHE.dashboard, () => this.api.get<ResumenDashboard>('/dashboard'));
    }
}