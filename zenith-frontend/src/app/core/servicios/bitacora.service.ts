import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RespuestaBitacora {
    message: string;
    estado: string;
    valor_realizado: number | null;
}

export interface RegistroBitacora {
    id_registro_habito: number;
    id_habito: number;
    habito: string;
    fecha: string;
    valor_realizado: number | null;
    meta: number | null;
    estado: string;
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

    registrar(datos: RegistrarProgresoPayload): Observable<RespuestaBitacora> {
        return this.api.post<RespuestaBitacora>('/bitacora', datos);
    }

    obtenerPorPeriodo(periodo: string): Observable<RegistroBitacora[]> {
        return this.api.get<RegistroBitacora[]>('/bitacora', { periodo });
    }
}