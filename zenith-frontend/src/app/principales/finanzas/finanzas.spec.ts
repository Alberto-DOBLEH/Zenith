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
            editarCategoria: () => of({ message: 'ok' })
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
});
