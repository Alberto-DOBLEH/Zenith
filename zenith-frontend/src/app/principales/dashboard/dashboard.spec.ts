import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { AuthService } from '../../core/servicios/auth.service';
import { DashboardService, ResumenDashboard } from '../../core/servicios/dashboard.service';
import { HabitosService } from '../../core/servicios/habitos.service';
import { EventosService } from '../../core/servicios/eventos.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: {
            obtenerResumen: () => of({
              fecha: '2026-08-14',
              racha_actual: 3,
              habitos_completados: 2,
              habitos_pendientes: 1,
              habitos_recaida: 0,
              porcentaje_cumplimiento: 67,
              habitos: []
            } as ResumenDashboard)
          }
        },
        { provide: HabitosService, useValue: { obtener: () => of([]) } },
        { provide: EventosService, useValue: { obtener: () => of([]) } }
      ]
    }).compileComponents();

    const authService = TestBed.inject(AuthService);
    authService.usuario.set({
      id_usuario: 1,
      nombre: 'Alberto',
      primer_apellido: 'Doble',
      correo: 'alberto@mail.com',
      telefono: '6141234567',
      username: 'alberto_dh',
      estado: 'ACTIVO'
    });

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
