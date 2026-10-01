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
});
