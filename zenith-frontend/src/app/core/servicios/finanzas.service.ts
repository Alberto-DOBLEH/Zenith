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

export interface MovimientoPayload {
    tipo_movimiento: Movimiento['tipo_movimiento'];
    cantidad: number;
    id_metodo_pago: number;
    id_categoria?: number;
    id_metodo_pago_destino?: number;
    fecha?: string;
    descripcion?: string;
}

export type FiltrosMovimientos = {
    fecha?: string;
    mes?: string;
    tipo?: Movimiento['tipo_movimiento'];
    metodo?: number;
};

export type TipoPrestamo = 'ME_PRESTAN' | 'PRESTO';
export type EstadoPrestamo = 'ACTIVO' | 'LIQUIDADO';

export interface Prestamo {
    id_prestamo: number;
    tipo: TipoPrestamo;
    persona: string;
    concepto: string | null;
    monto_total: number | string;
    saldo_pendiente: number | string;
    fecha: string;
    estado: EstadoPrestamo;
    id_metodo_pago: number;
    metodo_nombre?: string;
    metodo_tipo?: string;
}

export interface PrestamoPago {
    id_pago_prestamo: number;
    monto: number | string;
    fecha: string;
    id_metodo_pago: number;
    id_movimiento?: number | null;
    metodo_nombre?: string;
    metodo_tipo?: string;
}

export interface PrestamoPayload {
    tipo: TipoPrestamo;
    persona: string;
    concepto?: string | null;
    monto_total: number | string;
    fecha: string;
    id_metodo_pago: number;
}

export interface AbonoPayload {
    monto: number | string;
    fecha?: string;
    id_metodo_pago: number;
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

    obtenerMovimientos(filtros?: FiltrosMovimientos): Observable<Movimiento[]> {
        if (filtros && Object.values(filtros).some(v => v !== undefined && v !== '')) {
            return this.api.get<Movimiento[]>('/movimientos', filtros);
        }
        return this.cache.swr(CLAVES_CACHE.movimientos, () =>
            this.api.get<Movimiento[]>('/movimientos'));
    }

    crearMovimiento(datos: MovimientoPayload): Observable<{ message: string; movimiento: Movimiento }> {
        this.cache.invalidar(CLAVES_CACHE.movimientos, CLAVES_CACHE.metodosPago);
        return this.api.post('/movimientos', datos);
    }

    obtenerPrestamos(filtros?: { tipo?: TipoPrestamo; estado?: EstadoPrestamo }): Observable<Prestamo[]> {
        const hasFiltro = filtros && Object.values(filtros).some(v => !!v);
        if (hasFiltro) {
            return this.api.get<Prestamo[]>('/prestamos', filtros as Record<string, string | number | undefined>);
        }
        return this.cache.swr(CLAVES_CACHE.prestamos, () => this.api.get<Prestamo[]>('/prestamos'));
    }

    obtenerPrestamo(id_prestamo: number): Observable<Prestamo> {
        return this.api.get<Prestamo>(`/prestamos/${id_prestamo}`);
    }

    crearPrestamo(datos: PrestamoPayload): Observable<{ message: string; prestamo: Prestamo; id_movimiento?: number }> {
        this.cache.invalidar(CLAVES_CACHE.prestamos, CLAVES_CACHE.prestamosDetalle, CLAVES_CACHE.movimientos, CLAVES_CACHE.metodosPago);
        return this.api.post('/prestamos', datos);
    }

    registrarAbono(id_prestamo: number, datos: AbonoPayload): Observable<{ message: string; prestamo: Prestamo; id_movimiento?: number }> {
        this.cache.invalidar(CLAVES_CACHE.prestamos, CLAVES_CACHE.prestamosDetalle, CLAVES_CACHE.movimientos, CLAVES_CACHE.metodosPago);
        return this.api.post(`/prestamos/${id_prestamo}/abonos`, datos);
    }

    obtenerAbonos(id_prestamo: number): Observable<PrestamoPago[]> {
        return this.api.get<PrestamoPago[]>(`/prestamos/${id_prestamo}/abonos`);
    }
}
