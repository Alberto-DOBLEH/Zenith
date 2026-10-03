import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { Habitos } from './habitos';
import { RedireccionTab } from '../redireccion-tab/redireccion-tab';
import { HabitosService } from '../../core/servicios/habitos.service';
import { AuthService } from '../../core/servicios/auth.service';
import { EstadisticasService } from '../../core/servicios/estadisticas.service';
import { BitacoraService } from '../../core/servicios/bitacora.service';

describe('Habitos', () => {
  let component: Habitos;
  let fixture: ComponentFixture<Habitos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Habitos],
      providers: [
        provideRouter([
          { path: 'estadisticas', component: RedireccionTab },
          { path: 'habitos', component: Habitos }
        ]),
        {
          provide: HabitosService,
          useValue: {
            obtenerTipos: () => of([{ id_tipo_habito: 1, nombre: 'Normal' }]),
            obtener: () => of([])
          }
        },
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

    const authService = TestBed.inject(AuthService);
    authService.usuario.set({
      id_usuario: 1,
      nombre: 'Alberto',
      primer_apellido: 'Doble',
      correo: '',
      telefono: '',
      username: '',
      estado: 'ACTIVO'
    });

    fixture = TestBed.createComponent(Habitos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clasifica como bueno un hábito que no es evitado', () => {
    const habito = {
      id_habito: 1,
      tipo_habito: 1,
      tipo_nombre: 'Normal',
      nombre: 'Leer',
      descripcion: null,
      meta: null,
      unidad: null,
      frecuencia: 'DIARIO' as const,
      dia_del_mes: null,
      estado: 'ACTIVO',
      fecha_creacion: '',
      pomodoro_habilitado: false,
      dias: []
    };
    expect(component.esBueno(habito)).toBe(true);
  });

  it('muestra la barra de pestañas Hábitos y Estadísticas', () => {
    const elemento = fixture.nativeElement as HTMLElement;
    const pestañas = elemento.querySelectorAll('.pestana');
    expect(pestañas.length).toBe(2);
    expect(pestañas[0].textContent).toContain('Hábitos');
    expect(pestañas[1].textContent).toContain('Estadísticas');
    expect(component.pestana()).toBe('habitos');
  });

  it('cambia a la pestaña de estadísticas y muestra el componente', async () => {
    component.irAPestana('estadisticas');
    await fixture.whenStable();
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(component.pestana()).toBe('estadisticas');
    expect(elemento.querySelector('app-estadisticas')).toBeTruthy();
    expect(elemento.querySelector('.lista')).toBeNull();
  });

  it('vuelve a la pestaña de hábitos desde estadísticas', async () => {
    component.irAPestana('estadisticas');
    await fixture.whenStable();
    fixture.detectChanges();
    component.irAPestana('habitos');
    await fixture.whenStable();
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(component.pestana()).toBe('habitos');
    expect(elemento.querySelector('app-estadisticas')).toBeNull();
    expect(elemento.querySelector('.estado-vacio')).toBeTruthy();
  });

  it('abre directo la pestaña de estadísticas con ?tab=estadisticas', async () => {
    const arnés = await RouterTestingHarness.create('/habitos?tab=estadisticas');
    const instancia = arnés.routeDebugElement?.componentInstance as Habitos;
    expect(instancia.pestana()).toBe('estadisticas');
    expect(arnés.routeNativeElement?.querySelector('app-estadisticas')).toBeTruthy();
  });

  it('redirige /estadisticas a /habitos?tab=estadisticas', async () => {
    const arnés = await RouterTestingHarness.create('/estadisticas');
    const router = TestBed.inject(Router);
    for (let i = 0; i < 40 && router.url !== '/habitos?tab=estadisticas'; i++) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    expect(router.url).toBe('/habitos?tab=estadisticas');
    arnés.detectChanges();
    const instancia = arnés.routeDebugElement?.componentInstance as Habitos;
    expect(instancia.pestana()).toBe('estadisticas');
    expect(arnés.routeNativeElement?.querySelector('app-estadisticas')).toBeTruthy();
  });
});
