import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Finanzas } from './finanzas';
import { FinanzasService } from '../../core/servicios/finanzas.service';

describe('Finanzas', () => {
  let component: Finanzas;
  let fixture: ComponentFixture<Finanzas>;
  let servicio: {
    obtenerMetodosPago: ReturnType<typeof vi.fn>;
    obtenerCategorias: ReturnType<typeof vi.fn>;
    obtenerMovimientos: ReturnType<typeof vi.fn>;
    crearMetodoPago: ReturnType<typeof vi.fn>;
    crearCategoria: ReturnType<typeof vi.fn>;
    editarCategoria: ReturnType<typeof vi.fn>;
    crearMovimiento: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    servicio = {
      obtenerMetodosPago: vi.fn(() => of([])),
      obtenerCategorias: vi.fn(() => of([])),
      obtenerMovimientos: vi.fn(() => of([])),
      crearMetodoPago: vi.fn(() => of({ message: 'ok', metodo: {} })),
      crearCategoria: vi.fn(() => of({ message: 'ok', categoria: {} })),
      editarCategoria: vi.fn(() => of({ message: 'ok' })),
      crearMovimiento: vi.fn(() => of({ message: 'ok', movimiento: {} }))
    };

    await TestBed.configureTestingModule({
      imports: [Finanzas],
      providers: [
        provideRouter([]),
        { provide: FinanzasService, useValue: servicio }
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

  it('consulta al backend con los filtros seleccionados', () => {
    component.formFiltros.patchValue({ tipo: 'GASTO', metodo: '3' });
    component.aplicarFiltros();

    expect(servicio.obtenerMovimientos).toHaveBeenCalledWith({ tipo: 'GASTO', metodo: 3 });
    expect(component.hayFiltros).toBe(true);
  });

  it('al elegir fecha limpia el mes para evitar filtros contradictorios', () => {
    component.formFiltros.patchValue({ mes: '2026-10' });
    component.onCambioFecha({ target: { value: '2026-10-01' } } as unknown as Event);

    expect(component.formFiltros.value.mes).toBe('');
    expect(servicio.obtenerMovimientos).toHaveBeenCalledWith({ fecha: '2026-10-01' });
  });

  it('limpiar filtros vuelve a mostrar todos los movimientos', () => {
    const todos = [{ id_movimiento: 1, cantidad: '50.00' }] as any;
    component.movimientos.set(todos);
    component.formFiltros.patchValue({ tipo: 'GASTO' });
    component.limpiarFiltros();

    expect(component.hayFiltros).toBe(false);
    expect(component.movimientosVisibles()).toEqual(todos);
  });

  it('el select de meses muestra nombres pero manda YYYY-MM al backend', () => {
    const meses = component.mesesDisponibles;

    expect(meses.length).toBe(12);
    expect(meses[0].nombre).toBe('Enero');
    expect(meses[9].nombre).toBe('Octubre');
    expect(meses.every(m => /^\d{4}-(0[1-9]|1[0-2])$/.test(m.valor))).toBe(true);

    component.onCambioMes({ target: { value: '2026-10' } } as unknown as Event);
    expect(servicio.obtenerMovimientos).toHaveBeenCalledWith({ mes: '2026-10' });
  });
});
