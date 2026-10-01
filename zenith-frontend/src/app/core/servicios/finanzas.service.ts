import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService, CLAVES_CACHE } from './cache.service';

export interface MetodoPago {
    id_metodo: number;
    nombre: string;
    tipo: 'DEBITO' | 'EFECTIVO' | 'CREDITO';
    saldo_actual: number | string;
}

export interface MetodoPagoPayload {
    nombre: string;
    tipo: MetodoPago['tipo'];
    saldo_inicial?: number;
}

export interface Categoria {
    id_categoria: number;
    nombre: string;
    tipo: 'GASTO' | 'ENTRADA';
}

export interface CategoriaPayload {
    nombre: string;
    tipo: Categoria['tipo'];
}

export interface Movimiento {
    id_movimiento: number;
    id_metodo_pago: number;
    id_categoria: number | null;
    tipo_movimiento: 'GASTO' | 'ENTRADA' | 'TRANSFERENCIA';
    cantidad: number | string;
    fecha: string;
    descripcion: string | null;
    id_metodo_pago_destino: number | null;
    metodo_nombre?: string | null;
    metodo_destino_nombre?: string | null;
    categoria_nombre?: string | null;
    categoria_tipo?: Categoria['tipo'] | null;
}

@Injectable({ providedIn: 'root' })
export class FinanzasService {
    private readonly api = inject(ApiService);
    private readonly cache = inject(CacheService);

    obtenerMetodosPago(): Observable<MetodoPago[]> {
        return this.cache.swr(CLAVES_CACHE.metodosPago, () =>
            this.api.get<MetodoPago[]>('/metodos-pago'));
    }

    crearMetodoPago(datos: MetodoPagoPayload): Observable<{ message: string; metodo: MetodoPago }> {
        this.cache.invalidar(CLAVES_CACHE.metodosPago);
        return this.api.post('/metodos-pago', datos);
    }

    obtenerCategorias(): Observable<Categoria[]> {
        return this.cache.swr(CLAVES_CACHE.categorias, () =>
            this.api.get<Categoria[]>('/categorias'));
    }

    crearCategoria(datos: CategoriaPayload): Observable<{ message: string; categoria: Categoria }> {
        this.cache.invalidar(CLAVES_CACHE.categorias);
        return this.api.post('/categorias', datos);
    }

    editarCategoria(id_categoria: number, datos: Partial<CategoriaPayload>): Observable<{ message: string }> {
        this.cache.invalidar(CLAVES_CACHE.categorias);
        return this.api.put(`/categorias/${id_categoria}`, datos);
    }

    obtenerMovimientos(): Observable<Movimiento[]> {
        return this.cache.swr(CLAVES_CACHE.movimientos, () =>
            this.api.get<Movimiento[]>('/movimientos'));
    }
}
