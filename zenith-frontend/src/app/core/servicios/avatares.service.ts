import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, CLAVES_CACHE } from './cache.service';

export interface Avatar {
    id_avatar: number;
    nombre: string;
    ruta_imagen: string;
}

@Injectable({ providedIn: 'root' })
export class AvataresService {
    private readonly api = inject(ApiService);
    private readonly cache = inject(CacheService);

    obtener(): Observable<Avatar[]> {
        // Catálogo estático: se cachea para siempre.
        return this.cache.swr(
            CLAVES_CACHE.avatares,
            () => this.api.get<Avatar[]>('/avatares'),
            Number.POSITIVE_INFINITY
        );
    }
}
