import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface Nota {
    id_nota: number;
    fecha: string;
    contenido: string;
}

export interface RespuestaNota {
    message: string;
    nota: Nota;
}

@Injectable({ providedIn: 'root' })
export class NotasService {
    private readonly api = inject(ApiService);

    obtener(): Observable<Nota[]> {
        return this.api.get<Nota[]>('/notas').pipe(
            map(notas => notas.map(n => ({ ...n, fecha: fechaCorta(n.fecha) })))
        );
    }

    obtenerPorFecha(fecha: string): Observable<Nota | null> {
        return this.api.get<Nota | null>('/notas/por-fecha', { fecha }).pipe(
            map(n => (n ? { ...n, fecha: fechaCorta(n.fecha) } : null))
        );
    }

    crear(contenido: string): Observable<RespuestaNota> {
        return this.api.post<RespuestaNota>('/notas', { contenido }).pipe(
            map(r => ({ ...r, nota: { ...r.nota, fecha: fechaCorta(r.nota.fecha) } }))
        );
    }

    editar(id_nota: number, contenido: string): Observable<RespuestaNota> {
        return this.api.put<RespuestaNota>(`/notas/${id_nota}`, { contenido }).pipe(
            map(r => ({ ...r, nota: { ...r.nota, fecha: fechaCorta(r.nota.fecha) } }))
        );
    }
}

const fechaCorta = (fecha: string): string => fecha.slice(0, 10);
