import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Estadisticas } from './estadisticas';
import { EstadisticasService } from '../../core/servicios/estadisticas.service';
import { BitacoraService } from '../../core/servicios/bitacora.service';

describe('Estadisticas', () => {
  let component: Estadisticas;
  let fixture: ComponentFixture<Estadisticas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Estadisticas],
      providers: [
        provideRouter([]),
        {
          provide: EstadisticasService,
          useValue: {
            obtenerGenerales: () => of({
              cumplimiento: 72,
              completados: 148,
              no_completados: 58,
              racha_actual: 4,
              racha_maxima: 12
            }),
            obtenerMapa: () => of({
              periodo: 'semestre',
              inicio: '2026-04-01',
              fin: '2026-09-28',
              habitos: []
            })
          }
        },
        {
          provide: BitacoraService,
          useValue: {
            obtenerPorPeriodo: () => of([])
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Estadisticas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
