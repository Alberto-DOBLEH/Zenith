import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = TestBed.inject(CacheService);
  });

  it('sin caché hace la petición y guarda el resultado', () => {
    const llamadas: number[] = [];
    const peticion = () => { llamadas.push(1); return of(['a']); };

    const valores: string[][] = [];
    cache.swr('k', peticion).subscribe(v => valores.push(v));
    cache.swr('k', peticion).subscribe(v => valores.push(v));

    expect(llamadas.length).toBe(1);
    expect(valores).toEqual([['a'], ['a']]);
  });

  it('caché fresca emite sin volver a pedir', () => {
    let pedidas = 0;
    cache.guardar('k', ['v']);

    cache.swr('k', () => { pedidas++; return of(['nuevo']); }).subscribe();

    expect(pedidas).toBe(0);
    expect(cache.leer<string[]>('k')).toEqual(['v']);
  });

  it('caché vencida emite primero el valor viejo y luego el nuevo', () => {
    cache.guardar('k', ['viejo']);
    const valores: string[][] = [];

    cache.swr('k', () => of(['nuevo']), 0).subscribe(v => valores.push(v));

    expect(valores).toEqual([['viejo'], ['nuevo']]);
    expect(cache.leer<string[]>('k')).toEqual(['nuevo']);
  });

  it('si el refresco falla con caché vencida, se conserva el valor viejo sin error', () => {
    cache.guardar('k', ['viejo']);
    const valores: string[][] = [];
    let erro = false;

    cache.swr('k', () => throwError(() => new Error('fallo')), 0).subscribe({
      next: v => valores.push(v),
      error: () => erro = true
    });

    expect(valores).toEqual([['viejo']]);
    expect(erro).toBe(false);
    expect(cache.leer<string[]>('k')).toEqual(['viejo']);
  });

  it('sin caché el error sí se notifica al suscriptor', () => {
    let erro = false;

    cache.swr('k', () => throwError(() => new Error('fallo'))).subscribe({
      error: () => erro = true
    });

    expect(erro).toBe(true);
  });

  it('invalidar fuerza una nueva petición (y por prefijo)', () => {
    let pedidas = 0;
    const peticion = () => { pedidas++; return of([pedidas]); };

    cache.swr('bitacora:semana', peticion).subscribe();
    cache.swr('bitacora:mes', peticion).subscribe();
    expect(pedidas).toBe(2);

    cache.invalidarPrefijo('bitacora:');
    cache.swr('bitacora:semana', peticion).subscribe();
    cache.swr('bitacora:mes', peticion).subscribe();
    expect(pedidas).toBe(4);
  });

  it('limpiar vacía toda la caché (cambio de usuario)', () => {
    cache.guardar('habitos', ['deA']);
    cache.guardar('notas', ['deA']);

    cache.limpiar();

    expect(cache.leer('habitos')).toBeNull();
    expect(cache.leer('notas')).toBeNull();
  });
});
