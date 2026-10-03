import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { AuthService } from '../../core/servicios/auth.service';
import { DashboardService, ResumenDashboard } from '../../core/servicios/dashboard.service';
import { HabitosService } from '../../core/servicios/habitos.service';
import { EventosService } from '../../core/servicios/eventos.service';
import { EstadisticasService } from '../../core/servicios/estadisticas.service';
import { FinanzasService } from '../../core/servicios/finanzas.service';
import { GimnasioService } from '../../core/servicios/gimnasio.service';

const hoy = (() => {
  const fecha = new Date();
  const offset = fecha.getTimezoneOffset();
  return new Date(fecha.getTime() - offset * 60000).toISOString().slice(0, 10);
})();

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const planSesion = {
    fecha: hoy,
    dia_semana: 6,
    split: { id_split: 1, nombre: 'PPLxUL' },
    sesion: { id_sesion_plan: 1, nombre_sesion: 'Upper', dia_asignado: 6 },
    entrenamiento_activo: null,
    ejercicios: [
      { id_ejercicio: 1, nombre: 'Press Banca', grupo_muscular: 'Pecho', orden: 1, pr: null, ultima_vez: null }
    ]
  };

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
              habitos: []
            } as ResumenDashboard)
          }
        },
        { provide: HabitosService, useValue: { obtener: () => of([]) } },
        { provide: EventosService, useValue: { obtener: () => of([]) } },
        {
          provide: EstadisticasService,
          useValue: {
            obtenerGenerales: () => of({
              cumplimiento: 80,
              completados: 16,
              no_completados: 4,
              racha_actual: 7,
              racha_maxima: 20
            })
          }
        },
        {
          provide: FinanzasService,
          useValue: {
            obtenerMetodosPago: () => of([
              { id_metodo: 1, nombre: 'Efectivo', tipo: 'EFECTIVO', saldo_actual: 1500 },
              { id_metodo: 2, nombre: 'Banamex', tipo: 'DEBITO', saldo_actual: 2500 }
            ]),
            obtenerMovimientos: () => of([
              { id_movimiento: 1, id_metodo_pago: 1, id_categoria: null, tipo_movimiento: 'ENTRADA', cantidad: 800, fecha: hoy, descripcion: null, id_metodo_pago_destino: null },
              { id_movimiento: 2, id_metodo_pago: 1, id_categoria: null, tipo_movimiento: 'GASTO', cantidad: 300, fecha: hoy, descripcion: null, id_metodo_pago_destino: null }
            ])
          }
        },
        { provide: GimnasioService, useValue: { obtenerPlan: () => of(planSesion) } }
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra las stats rápidas de racha y cumplimiento', () => {
    const elemento = fixture.nativeElement as HTMLElement;
    expect(component.stats()?.racha_actual).toBe(7);
    const texto = elemento.textContent ?? '';
    expect(texto).toContain('Racha actual (días)');
    expect(texto).toContain('Cumplimiento del mes');
    expect(texto).toContain('80%');
  });

  it('muestra el resumen financiero con saldo, entradas y gastos del mes', () => {
    const elemento = fixture.nativeElement as HTMLElement;
    expect(component.saldoTotal).toBe(4000);
    expect(component.entradasMes).toBe(800);
    expect(component.gastosMes).toBe(300);
    const texto = elemento.textContent ?? '';
    expect(texto).toContain('Saldo total');
    expect(texto).toContain('Entradas del mes');
    expect(texto).toContain('Gastos del mes');
  });

  it('muestra la tarjeta de entrenamiento de hoy con la sesión del plan', () => {
    const elemento = fixture.nativeElement as HTMLElement;
    const seccion = elemento.querySelector('.seccion-gimnasio');
    expect(seccion).toBeTruthy();
    const texto = seccion?.textContent ?? '';
    expect(texto).toContain('Upper');
    expect(texto).toContain('Split PPLxUL');
    expect(texto).toContain('Empezar');
  });

  it('muestra la sección de eventos próximos con enlace Ver todo', () => {
    const elemento = fixture.nativeElement as HTMLElement;
    const seccion = elemento.querySelector('.seccion-eventos');
    expect(seccion?.textContent).toContain('Eventos próximos');
    const enlace = seccion?.querySelector('a.ver-todo');
    expect(enlace?.getAttribute('href')).toBe('/calendario');
  });
});
