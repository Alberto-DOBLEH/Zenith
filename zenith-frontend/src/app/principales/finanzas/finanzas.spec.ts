import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Finanzas } from './finanzas';
import { FinanzasService } from '../../core/servicios/finanzas.service';

describe('Finanzas', () => {
  let component: Finanzas;
  let fixture: ComponentFixture<Finanzas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Finanzas],
      providers: [
        provideRouter([]),
        {
          provide: FinanzasService,
          useValue: {
            obtenerMetodosPago: () => of([]),
            obtenerCategorias: () => of([]),
            obtenerMovimientos: () => of([]),
            crearMetodoPago: () => of({ message: 'ok', metodo: {} }),
            crearCategoria: () => of({ message: 'ok', categoria: {} }),
            editarCategoria: () => of({ message: 'ok' }),
            crearMovimiento: () => of({ message: 'ok', movimiento: {} })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Finanzas);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el encabezado Finanzas', () => {
    const elemento: HTMLElement = fixture.nativeElement;
    expect(elemento.querySelector('h1')?.textContent).toContain('Finanzas');
  });

  it('muestra estados vacíos cuando no hay datos', () => {
    const texto: string = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Métodos de pago');
    expect(texto).toContain('Categorías');
    expect(texto).toContain('Movimientos');
    expect(component.cargando()).toBe(false);
    expect(component.metodosPago().length).toBe(0);
  });

  it('abre el modal de nuevo método de pago', () => {
    component.abrirCrearMetodo();
    fixture.detectChanges();

    const texto: string = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.modalMetodoAbierto()).toBe(true);
    expect(texto).toContain('Nuevo método de pago');
    expect(texto).toContain('Saldo inicial');
  });

  it('abre el modal de nueva categoría', () => {
    component.abrirCrearCategoria();
    fixture.detectChanges();

    const texto: string = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.modalCategoriaAbierto()).toBe(true);
    expect(texto).toContain('Nueva categoría');
    expect(component.formCategoria.value.tipo).toBe('GASTO');
  });

  it('abre el modal de editar categoría con los datos existentes', () => {
    component.abrirEditarCategoria({ id_categoria: 7, nombre: 'Comida', tipo: 'GASTO' });
    fixture.detectChanges();

    const texto: string = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.modalCategoriaAbierto()).toBe(true);
    expect(component.modoEdicionCategoria()).toBe(true);
    expect(component.categoriaEditandoId()).toBe(7);
    expect(texto).toContain('Editar categoría');
    expect(component.formCategoria.value.nombre).toBe('Comida');
  });

  it('abre el modal de movimiento con tipo GASTO por defecto', () => {
    component.abrirCrearMovimiento();
    fixture.detectChanges();

    const texto: string = fixture.nativeElement.querySelector('.modal')?.textContent ?? '';
    expect(component.modalMovimientoAbierto()).toBe(true);
    expect(component.formMovimiento.value.tipo_movimiento).toBe('GASTO');
    expect(texto).toContain('Nuevo movimiento');
    expect(texto).toContain('Tipo de movimiento');
    expect(texto).toContain('Categoría');
    expect(texto).toContain('Descripción');
  });

  it('al elegir transferencia solo muestra cantidad y los dos métodos', () => {
    component.abrirCrearMovimiento();
    component.formMovimiento.patchValue({ tipo_movimiento: 'TRANSFERENCIA' });
    fixture.detectChanges();

    const texto: string = fixture.nativeElement.querySelector('.modal')?.textContent ?? '';
    expect(texto).toContain('Método de origen');
    expect(texto).toContain('Método destino');
    expect(texto).not.toContain('Categoría');
    expect(texto).not.toContain('Descripción');
    expect(texto).not.toContain('Fecha');
  });

  it('filtra las categorías según el tipo de movimiento', () => {
    component.categorias.set([
      { id_categoria: 1, nombre: 'Comida', tipo: 'GASTO' },
      { id_categoria: 2, nombre: 'Sueldo', tipo: 'ENTRADA' }
    ]);

    component.formMovimiento.patchValue({ tipo_movimiento: 'GASTO' });
    expect(component.categoriasFiltradas.map(c => c.id_categoria)).toEqual([1]);

    component.formMovimiento.patchValue({ tipo_movimiento: 'ENTRADA' });
    expect(component.categoriasFiltradas.map(c => c.id_categoria)).toEqual([2]);
  });

  it('excluye el método de origen de los destinos de transferencia', () => {
    component.metodosPago.set([
      { id_metodo: 1, nombre: 'Efectivo', tipo: 'EFECTIVO', saldo_actual: 100 },
      { id_metodo: 2, nombre: 'BBVA', tipo: 'DEBITO', saldo_actual: 200 }
    ]);

    component.formMovimiento.patchValue({ id_metodo_pago: 1 });
    expect(component.metodosDestino.map(m => m.id_metodo)).toEqual([2]);
  });
});
