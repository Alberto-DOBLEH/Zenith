import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Avatar {
    id_avatar: number;
    nombre: string;
    ruta_imagen: string;
}

@Injectable({ providedIn: 'root' })
export class AvataresService {
    private readonly api = inject(ApiService);

    obtener(): Observable<Avatar[]> {
        return this.api.get<Avatar[]>('/avatares');
    }
}
