import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface HabitoResumen {
    id_habito: number;
    nombre: string;
    tipo_habito: number;
    estado: string;
    valor_realizado: number | null;
}

export interface ResumenDashboard {
    fecha: string;
    racha_actual: number;
    habitos_completados: number;
    habitos_pendientes: number;
    habitos_recaida: number;
    porcentaje_cumplimiento: number;
    habitos: HabitoResumen[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly api = inject(ApiService);

    obtenerResumen(): Observable<ResumenDashboard> {
        return this.api.get<ResumenDashboard>('/dashboard');
    }
}