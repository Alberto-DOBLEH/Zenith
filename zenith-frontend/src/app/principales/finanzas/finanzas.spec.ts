import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Finanzas } from './finanzas';

describe('Finanzas', () => {
  let component: Finanzas;
  let fixture: ComponentFixture<Finanzas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Finanzas],
      providers: [provideRouter([])]
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
  });

  it('abre el modal de nuevo método de pago', () => {
    component.abrirCrearMetodo();
    fixture.detectChanges();

    const texto: string = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.modalMetodoAbierto()).toBe(true);
    expect(texto).toContain('Nuevo método de pago');
    expect(texto).toContain('Saldo inicial');
  });

  it('abre el modal de editar método de pago sin saldo inicial', () => {
    component.abrirEditarMetodo({
      id_metodo: 1,
      id_usuario: 1,
      nombre: 'Efectivo',
      tipo: 'EFECTIVO',
      saldo_actual: 0
    });
    fixture.detectChanges();

    const texto: string = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.modoEdicionMetodo()).toBe(true);
    expect(texto).toContain('Editar método de pago');
    expect(texto).not.toContain('Saldo inicial');
  });

  it('abre el modal de nueva categoría', () => {
    component.abrirCrearCategoria();
    fixture.detectChanges();

    const texto: string = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.modalCategoriaAbierto()).toBe(true);
    expect(texto).toContain('Nueva categoría');
    expect(component.formCategoria.value.tipo).toBe('GASTO');
  });
});
