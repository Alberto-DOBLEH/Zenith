import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Estadisticas {
    cumplimiento: number;
    completados: number;
    no_completados: number;
    racha_actual: number;
    racha_maxima: number;
}

export interface EstadisticasHabito {
    id_habito: number;
    nombre: string;
    cumplimiento: number;
    dias_registrados: number;
    racha_actual: number;
    racha_maxima: number;
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
    private readonly api = inject(ApiService);

    obtenerGenerales(periodo = 'mes'): Observable<Estadisticas> {
        return this.api.get<Estadisticas>('/estadisticas', { periodo });
    }

    obtenerDeHabito(id_habito: number): Observable<EstadisticasHabito> {
        return this.api.get<EstadisticasHabito>(`/estadisticas/habito/${id_habito}`);
    }
}