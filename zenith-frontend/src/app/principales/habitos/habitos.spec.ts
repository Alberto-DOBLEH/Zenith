import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Habitos } from './habitos';
import { HabitosService } from '../../core/servicios/habitos.service';
import { AuthService } from '../../core/servicios/auth.service';

describe('Habitos', () => {
  let component: Habitos;
  let fixture: ComponentFixture<Habitos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Habitos],
      providers: [
        provideRouter([]),
        {
          provide: HabitosService,
          useValue: {
            obtenerTipos: () => of([{ id_tipo_habito: 1, nombre: 'Normal' }]),
            obtener: () => of([])
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
      dias: []
    };
    expect(component.esBueno(habito)).toBe(true);
  });
});
