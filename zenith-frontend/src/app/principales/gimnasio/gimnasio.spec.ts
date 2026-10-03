import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Gimnasio } from './gimnasio';
import { GimnasioService, PlanHoy } from '../../core/servicios/gimnasio.service';

const planSinSplit: PlanHoy = {
  fecha: '2026-10-02',
  dia_semana: 5,
  split: null,
  sesion: null,
  entrenamiento_activo: null,
  ejercicios: []
};

const planDescanso: PlanHoy = {
  ...planSinSplit,
  split: { id_split: 1, nombre: 'PPLxUL' }
};

const planSesion: PlanHoy = {
  ...planSinSplit,
  split: { id_split: 1, nombre: 'PPLxUL' },
  sesion: { id_sesion_plan: 5, nombre_sesion: 'Upper', dia_asignado: 5 },
  ejercicios: [
    {
      id_ejercicio: 1,
      nombre: 'Press Banca',
      grupo_muscular: 'Pecho',
      orden: 1,
      pr: { peso: 225, unidad_peso: 'lbs', repeticiones: 3, fecha: '2026-09-30' },
      ultima_vez: { fecha: '2026-09-30', series: [] }
    }
  ]
};

const planActivo: PlanHoy = {
  ...planSesion,
  entrenamiento_activo: {
    id_entrenamiento: 10,
    id_sesion_plan: 5,
    nombre_sesion: 'Upper',
    dia_asignado: 5,
    fecha_inicio: '2026-10-02T14:00:00.000Z',
    fecha_fin: null
  }
};

describe('Gimnasio', () => {
  let component: Gimnasio;
  let fixture: ComponentFixture<Gimnasio>;
  let servicio: {
    obtenerPlan: ReturnType<typeof vi.fn>;
    obtenerHistorial: ReturnType<typeof vi.fn>;
    iniciarEntrenamiento: ReturnType<typeof vi.fn>;
    obtenerEntrenamiento: ReturnType<typeof vi.fn>;
    finalizarEntrenamiento: ReturnType<typeof vi.fn>;
    eliminarEntrenamiento: ReturnType<typeof vi.fn>;
    crearSerie: ReturnType<typeof vi.fn>;
    editarSerie: ReturnType<typeof vi.fn>;
    eliminarSerie: ReturnType<typeof vi.fn>;
    obtenerSplit: ReturnType<typeof vi.fn>;
  };

  const crearFixture = async (plan: PlanHoy) => {
    servicio.obtenerPlan.mockReturnValue(of(plan));
    fixture = TestBed.createComponent(Gimnasio);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    servicio = {
      obtenerPlan: vi.fn(() => of(planSinSplit)),
      obtenerHistorial: vi.fn(() => of([])),
      iniciarEntrenamiento: vi.fn(() => of({ message: 'Entrenamiento iniciado', entrenamiento: { id_entrenamiento: 10 } })),
      obtenerEntrenamiento: vi.fn(() => of({
        id_entrenamiento: 10,
        id_sesion_plan: 5,
        nombre_sesion: 'Upper',
        id_split: 1,
        nombre_split: 'PPLxUL',
        fecha_inicio: '2026-10-02T14:00:00.000Z',
        fecha_fin: null,
        duracion_minutos: null,
        ejercicios: []
      })),
      finalizarEntrenamiento: vi.fn(() => of({ message: 'Entrenamiento finalizado' })),
      eliminarEntrenamiento: vi.fn(() => of({ message: 'Entrenamiento eliminado con exito' })),
      crearSerie: vi.fn(() => of({ message: 'Serie registrada con exito' })),
      editarSerie: vi.fn(() => of({ message: 'Serie modificada con exito' })),
      eliminarSerie: vi.fn(() => of({ message: 'Serie eliminada con exito' })),
      obtenerSplit: vi.fn(() => of({
        id_split: 1,
        nombre: 'PPLxUL',
        es_activo: true,
        sesiones: []
      }))
    };

    await TestBed.configureTestingModule({
      imports: [Gimnasio],
      providers: [
        provideRouter([]),
        { provide: GimnasioService, useValue: servicio }
      ]
    }).compileComponents();

    await crearFixture(planSinSplit);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el encabezado Gimnasio', () => {
    const texto: string = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('Entrenamiento');
    expect(texto).toContain('Administrar rutinas');
  });

  it('sin split activo muestra el CTA hacia rutinas', () => {
    const texto: string = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('No tienes un split activo');
    expect(component.cargando()).toBe(false);
  });

  it('si la carga responde 404 se muestra el estado vacío sin banner de error', async () => {
    servicio.obtenerPlan.mockReturnValue(throwError(() => ({ status: 404 })));
    servicio.obtenerHistorial.mockReturnValue(throwError(() => ({ status: 404 })));

    fixture = TestBed.createComponent(Gimnasio);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.error()).toBe('');
    expect(component.cargando()).toBe(false);
    expect(component.plan()).toBeNull();
    const texto: string = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('No tienes un split activo');
  });

  it('otros errores de carga sí se muestran como banner', async () => {
    servicio.obtenerPlan.mockReturnValue(throwError(() => ({ status: 500, message: 'boom' })));

    fixture = TestBed.createComponent(Gimnasio);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.error()).toBe('boom');
  });

  it('si hoy es descanso lo indica junto al nombre del split', async () => {
    await crearFixture(planDescanso);

    const texto: string = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('Hoy es descanso');
    expect(texto).toContain('PPLxUL');
    expect(servicio.iniciarEntrenamiento).not.toHaveBeenCalled();
  });

  it('con sesión hoy muestra el plan y al iniciar llama al backend', async () => {
    await crearFixture(planSesion);

    const texto: string = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('Upper');
    expect(texto).toContain('Press Banca');
    expect(texto).toContain('225 lbs × 3');

    component.iniciar();
    expect(servicio.iniciarEntrenamiento).toHaveBeenCalledTimes(1);
  });

  it('con entrenamiento en curso muestra el badge y las series registradas', async () => {
    servicio.obtenerEntrenamiento.mockReturnValue(of({
      id_entrenamiento: 10,
      id_sesion_plan: 5,
      nombre_sesion: 'Upper',
      id_split: 1,
      nombre_split: 'PPLxUL',
      fecha_inicio: '2026-10-02T14:00:00.000Z',
      fecha_fin: null,
      duracion_minutos: null,
      ejercicios: [{
        id_ejercicio: 1,
        nombre: 'Press Banca',
        grupo_muscular: 'Pecho',
        orden: 1,
        series: [{ id_serie: 1, id_ejercicio: 1, numero_serie: 1, repeticiones: 8, peso: 75, unidad_peso: 'kg' }]
      }]
    }));
    await crearFixture(planActivo);

    const texto: string = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('EN CURSO');
    expect(texto).toContain('8 × 75 kg');
    expect(servicio.obtenerEntrenamiento).toHaveBeenCalledWith(10);
  });

  it('agregar serie valida los campos y manda el siguiente número', async () => {
    servicio.obtenerEntrenamiento.mockReturnValue(of({
      id_entrenamiento: 10,
      id_sesion_plan: 5,
      nombre_sesion: 'Upper',
      id_split: 1,
      nombre_split: 'PPLxUL',
      fecha_inicio: '2026-10-02T14:00:00.000Z',
      fecha_fin: null,
      duracion_minutos: null,
      ejercicios: [{
        id_ejercicio: 1,
        nombre: 'Press Banca',
        grupo_muscular: 'Pecho',
        orden: 1,
        series: [{ id_serie: 1, id_ejercicio: 1, numero_serie: 1, repeticiones: 8, peso: 75, unidad_peso: 'kg' }]
      }]
    }));
    await crearFixture(planActivo);

    component.agregarSerie(1);
    expect(component.errorActivo()).toContain('repeticiones');
    expect(servicio.crearSerie).not.toHaveBeenCalled();

    const borrador = component.borradorPara(1);
    borrador.repeticiones = 6;
    borrador.peso = 80;
    borrador.unidad_peso = 'kg';
    component.agregarSerie(1);

    expect(servicio.crearSerie).toHaveBeenCalledWith(10, {
      id_ejercicio: 1,
      numero_serie: 2,
      repeticiones: 6,
      peso: 80,
      unidad_peso: 'kg'
    });
  });

  it('finalizar pide confirmación y luego llama al backend', async () => {
    await crearFixture(planActivo);

    component.pedirFinalizar();
    expect(component.confirmacion()?.tipo).toBe('finalizar');

    component.ejecutarConfirmacion();
    expect(servicio.finalizarEntrenamiento).toHaveBeenCalledWith(10);
    expect(component.confirmacion()).toBeNull();
  });

  it('abre el detalle de un entrenamiento del historial', async () => {
    servicio.obtenerHistorial.mockReturnValue(of([{
      id_entrenamiento: 7,
      id_sesion_plan: 5,
      nombre_sesion: 'Upper',
      id_split: 1,
      nombre_split: 'PPLxUL',
      fecha_inicio: '2026-10-01T14:00:00.000Z',
      fecha_fin: '2026-10-01T15:00:00.000Z',
      ejercicios: 3,
      series: 12,
      duracion_minutos: 60
    }]));
    await crearFixture(planSinSplit);

    expect(component.historial().length).toBe(1);
    const texto: string = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('Upper · PPLxUL');

    component.abrirDetalle(7);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.modalDetalleAbierto()).toBe(true);
    expect(servicio.obtenerEntrenamiento).toHaveBeenCalledWith(7);
    expect(component.detalle()).toBeTruthy();
  });

  it('el filtro de mes consulta al backend con YYYY-MM', async () => {
    component.onCambioMes({ target: { value: '2026-10' } } as unknown as Event);

    expect(servicio.obtenerHistorial).toHaveBeenCalledWith({ mes: '2026-10' });
    expect(component.formFiltros.value.mes).toBe('2026-10');

    component.limpiarFiltroMes();
    expect(component.formFiltros.value.mes).toBe('');
  });

  it('el select de meses muestra nombres pero manda YYYY-MM', () => {
    const meses = component.mesesDisponibles;

    expect(meses.length).toBe(12);
    expect(meses[0].nombre).toBe('Enero');
    expect(meses.every(m => /^\d{4}-(0[1-9]|1[0-2])$/.test(m.valor))).toBe(true);
  });
});
