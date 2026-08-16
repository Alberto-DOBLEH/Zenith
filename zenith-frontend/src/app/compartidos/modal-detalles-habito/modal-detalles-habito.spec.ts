import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDetallesHabito } from './modal-detalles-habito';

describe('ModalDetallesHabito', () => {
  let component: ModalDetallesHabito;
  let fixture: ComponentFixture<ModalDetallesHabito>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDetallesHabito],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalDetallesHabito);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formatea la frecuencia semanal con sus días', () => {
    const texto = component.frecuenciaTexto('SEMANAL', ['LUNES', 'VIERNES'], null);
    expect(texto).toContain('Lunes');
    expect(texto).toContain('Viernes');
  });
});
