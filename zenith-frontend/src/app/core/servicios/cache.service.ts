import { Injectable } from '@angular/core';
import { Observable, catchError, concat, defer, of, EMPTY, tap } from 'rxjs';

/** Claves de caché compartidas entre servicios (evitan typos y sirven para invalidar). */
export const CLAVES_CACHE = {
    habitos: 'habitos',
    habitosTipos: 'habitos:tipos',
    eventos: 'eventos',
    actividades: 'actividades',
    notas: 'notas',
    dashboard: 'dashboard',
    estadisticasGenerales: 'estadisticas:generales',
    estadisticasMapa: 'estadisticas:mapa',
    bitacora: 'bitacora:',
    avatares: 'avatares',
    metodosPago: 'metodosPago',
    categorias: 'categorias',
    movimientos: 'movimientos',
    gimnasioHoy: 'gimnasio:hoy',
    gimnasioHistorial: 'gimnasio:historial',
    splits: 'splits',
    ejercicios: 'ejercicios'
} as const;

/** Tiempo de vida por defecto de una entrada (ms) antes de refrescar en segundo plano. */
export const TTL_CACHE = 60_000;

interface Entrada {
    valor: unknown;
    ts: number;
}

/**
 * Caché en memoria con patrón stale-while-revalidate.
 *
 * - Caché fresca (dentro del TTL): emite el valor guardado sin ir al servidor.
 * - Sin caché o vencida: emite primero la caché vencida (si existe) y enseguida
 *   refresca en segundo plano, por lo que la pantalla se pinta al instante.
 * - Si el refresco falla pero había caché vencida, se conserva el valor viejo
 *   sin notificar error (solo falla la primera carga, cuando no hay nada).
 * - Las mutaciones (crear/editar/eliminar) invalidan las claves afectadas para
 *   que la siguiente lectura sí vaya al servidor.
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
    private readonly entradas = new Map<string, Entrada>();

    leer<T>(clave: string): T | null {
        const entrada = this.entradas.get(clave);
        return entrada !== undefined ? (entrada.valor as T) : null;
    }

    guardar(clave: string, valor: unknown): void {
        this.entradas.set(clave, { valor, ts: Date.now() });
    }

    invalidar(...claves: string[]): void {
        claves.forEach(clave => this.entradas.delete(clave));
    }

    invalidarPrefijo(prefijo: string): void {
        for (const clave of [...this.entradas.keys()]) {
            if (clave.startsWith(prefijo)) this.entradas.delete(clave);
        }
    }

    /** Vacía toda la caché (al cerrar sesión o iniciar otra para no mezclar usuarios). */
    limpiar(): void {
        this.entradas.clear();
    }

    private esFresco(clave: string, ttl: number): boolean {
        const entrada = this.entradas.get(clave);
        return entrada !== undefined && Date.now() - entrada.ts < ttl;
    }

    swr<T>(clave: string, peticion: () => Observable<T>, ttl: number = TTL_CACHE): Observable<T> {
        return defer(() => {
            const cache = this.leer<T>(clave);

            if (cache !== null && this.esFresco(clave, ttl)) {
                return of(cache);
            }

            const refresco = peticion().pipe(tap(valor => this.guardar(clave, valor)));

            if (cache === null) {
                return refresco;
            }

            return concat(of(cache), refresco.pipe(catchError(() => EMPTY)));
        });
    }
}
