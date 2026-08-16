import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Evento {
    id_evento: number;
    titulo: string;
    descripcion: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    color: string | null;
    avisos: string[];
}

export interface EventoPayload {
    titulo: string;
    descripcion?: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    color?: string | null;
    avisos?: string[];
}

export interface RespuestaIdEvento {
    message: string;
    id_evento: number;
}

@Injectable({ providedIn: 'root' })
export class EventosService {
    private readonly api = inject(ApiService);

    obtener(): Observable<Evento[]> {
        return this.api.get<Evento[]>('/eventos');
    }

    obtenerPorId(id_evento: number): Observable<Evento> {
        return this.api.get<Evento>(`/eventos/${id_evento}`);
    }

    crear(datos: EventoPayload): Observable<RespuestaIdEvento> {
        return this.api.post<RespuestaIdEvento>('/eventos', datos);
    }

    editar(id_evento: number, datos: Partial<EventoPayload>): Observable<{ message: string }> {
        return this.api.put<{ message: string }>(`/eventos/${id_evento}`, datos);
    }

    eliminar(id_evento: number): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`/eventos/${id_evento}`);
    }
}
