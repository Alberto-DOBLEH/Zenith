import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Rutinas } from './rutinas';
import { GimnasioService } from '../../core/servicios/gimnasio.service';

describe('Rutinas', () => {
  let component: Rutinas;
  let fixture: ComponentFixture<Rutinas>;
  let servicio: {
    obtenerSplits: ReturnType<typeof vi.fn>;
    obtenerEjercicios: ReturnType<typeof vi.fn>;
    crearSplit: ReturnType<typeof vi.fn>;
    editarSplit: ReturnType<typeof vi.fn>;
    activarSplit: ReturnType<typeof vi.fn>;
    eliminarSplit: ReturnType<typeof vi.fn>;
    obtenerSplit: ReturnType<typeof vi.fn>;
    crearSesion: ReturnType<typeof vi.fn>;
    editarSesion: ReturnType<typeof vi.fn>;
    eliminarSesion: ReturnType<typeof vi.fn>;
    reemplazarEjercicios: ReturnType<typeof vi.fn>;
    crearEjercicio: ReturnType<typeof vi.fn>;
    editarEjercicio: ReturnType<typeof vi.fn>;
    eliminarEjercicio: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    servicio = {
      obtenerSplits: vi.fn(() => of([])),
      obtenerEjercicios: vi.fn(() => of([])),
      crearSplit: vi.fn(() => of({ message: 'Split creado con exito' })),
      editarSplit: vi.fn(() => of({ message: 'Split modificado con exito' })),
      activarSplit: vi.fn(() => of({ message: 'Split activado con exito' })),
      eliminarSplit: vi.fn(() => of({ message: 'Split eliminado con exito' })),
      obtenerSplit: vi.fn(() => of({
        id_split: 1,
        nombre: 'PPLxUL',
        es_activo: true,
        sesiones: [{
          id_sesion_plan: 5,
          nombre_sesion: 'Upper',
          dia_asignado: 5,
          ejercicios: [{ id_ejercicio: 1, nombre: 'Press Banca', grupo_muscular: 'Pecho', orden: 1 }]
        }]
      })),
      crearSesion: vi.fn(() => of({ message: 'Sesión creada con exito' })),
      editarSesion: vi.fn(() => of({ message: 'Sesión modificada con exito' })),
      eliminarSesion: vi.fn(() => of({ message: 'Sesión eliminada con exito' })),
      reemplazarEjercicios: vi.fn(() => of({ message: 'Ejercicios de la sesión actualizados con exito' })),
      crearEjercicio: vi.fn(() => of({ message: 'Ejercicio creado con exito' })),
      editarEjercicio: vi.fn(() => of({ message: 'Ejercicio modificado con exito' })),
      eliminarEjercicio: vi.fn(() => of({ message: 'Ejercicio eliminado con exito' }))
    };

    await TestBed.configureTestingModule({
      imports: [Rutinas],
      providers: [
        provideRouter([]),
        { provide: GimnasioService, useValue: servicio }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Rutinas);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el encabezado y el enlace de vuelta', () => {
    const texto: string = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('Rutinas');
    expect(texto).toContain('Volver al gimnasio');
  });

  it('muestra estados vacíos sin splits ni ejercicios', () => {
    const texto: string = fixture.nativeElement.textContent ?? '';
    expect(texto).toContain('No tienes splits creados');
    expect(component.splits().length).toBe(0);
    expect(component.ejercicios().length).toBe(0);
    expect(component.cargando()).toBe(false);
  });

  it('abre el modal de nuevo split con el formulario limpio', () => {
    component.abrirCrearSplit();
    fixture.detectChanges();

    const texto: string = fixture.nativeElement.querySelector('.modal')?.textContent ?? '';
    expect(component.modalSplitAbierto()).toBe(true);
    expect(component.modoEdicionSplit()).toBe(false);
    expect(component.formSplit.value.nombre).toBe('');
    expect(texto).toContain('Nuevo split');
  });

  it('guardar split valida el nombre antes de llamar al backend', () => {
    component.abrirCrearSplit();
    component.guardarSplit();

    expect(servicio.crearSplit).not.toHaveBeenCalled();
    expect(component.mensajeForm()).toContain('requeridos');

    component.formSplit.patchValue({ nombre: 'PPLxUL' });
    component.guardarSplit();

    expect(servicio.crearSplit).toHaveBeenCalledWith({ nombre: 'PPLxUL' });
  });

  it('editar split manda solo el nombre al backend', () => {
    component.abrirEditarSplit({ id_split: 3, nombre: 'Arnold', es_activo: false, sesiones: 4 });
    expect(component.modoEdicionSplit()).toBe(true);

    component.formSplit.patchValue({ nombre: 'Arnold v2' });
    component.guardarSplit();

    expect(servicio.editarSplit).toHaveBeenCalledWith(3, { nombre: 'Arnold v2' });
  });

  it('el catálogo se filtra por grupo y texto en el cliente', () => {
    component.ejercicios.set([
      { id_ejercicio: 1, nombre: 'Press Banca', grupo_muscular: 'Pecho' },
      { id_ejercicio: 2, nombre: 'Press con mancuernas', grupo_muscular: 'Pecho' },
      { id_ejercicio: 3, nombre: 'Remo con barra', grupo_muscular: 'Espalda' }
    ]);

    component.formFiltros.patchValue({ grupo: 'Pecho' });
    expect(component.ejerciciosVisibles.length).toBe(2);

    component.formFiltros.patchValue({ grupo: '', q: 'mancuernas' });
    expect(component.ejerciciosVisibles.length).toBe(1);

    component.formFiltros.patchValue({ q: 'zzz' });
    expect(component.ejerciciosVisibles.length).toBe(0);
  });

  it('abre el detalle del split con sus sesiones', async () => {
    component.abrirDetalle(1);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.modalDetalleAbierto()).toBe(true);
    expect(servicio.obtenerSplit).toHaveBeenCalledWith(1);
    expect(component.splitDetalle()?.sesiones.length).toBe(1);

    const texto: string = fixture.nativeElement.querySelector('.modal')?.textContent ?? '';
    expect(texto).toContain('Upper');
    expect(texto).toContain('Viernes');
    expect(texto).toContain('Press Banca');
  });

  it('abre el modal de sesión con el día seleccionado', () => {
    component.abrirCrearSesion();
    fixture.detectChanges();

    expect(component.modalSesionAbierto()).toBe(true);
    expect(component.formSesion.value.dia_asignado).toBe(1);

    component.abrirEditarSesion({ id_sesion_plan: 5, nombre_sesion: 'Upper', dia_asignado: 5 });
    expect(component.modoEdicionSesion()).toBe(true);
    expect(component.formSesion.value.nombre_sesion).toBe('Upper');
    expect(component.formSesion.value.dia_asignado).toBe(5);
  });

  it('la receta se abre ordenada y alterna/mueve ejercicios', () => {
    component.ejercicios.set([
      { id_ejercicio: 1, nombre: 'Press Banca', grupo_muscular: 'Pecho' },
      { id_ejercicio: 2, nombre: 'Remo', grupo_muscular: 'Espalda' },
      { id_ejercicio: 3, nombre: 'Sentadilla', grupo_muscular: 'Pierna' }
    ]);

    component.abrirReceta({
      id_sesion_plan: 5,
      nombre_sesion: 'Upper',
      dia_asignado: 5,
      ejercicios: [
        { id_ejercicio: 1, nombre: 'Press Banca', grupo_muscular: 'Pecho', orden: 1 },
        { id_ejercicio: 2, nombre: 'Remo', grupo_muscular: 'Espalda', orden: 2 }
      ]
    });

    expect(component.modalRecetaAbierto()).toBe(true);
    expect(component.recetaSeleccion()).toEqual([1, 2]);

    component.alternarEjercicio(3);
    expect(component.recetaSeleccion()).toEqual([1, 2, 3]);

    component.moverEnReceta(2, -1);
    expect(component.recetaSeleccion()).toEqual([1, 3, 2]);

    component.alternarEjercicio(2);
    expect(component.recetaSeleccion()).toEqual([1, 3]);
  });

  it('guardar receta reemplaza los ejercicios con el orden elegido', () => {
    component.ejercicios.set([
      { id_ejercicio: 1, nombre: 'Press Banca', grupo_muscular: 'Pecho' },
      { id_ejercicio: 2, nombre: 'Remo', grupo_muscular: 'Espalda' }
    ]);
    component.abrirReceta({ id_sesion_plan: 5, nombre_sesion: 'Upper', dia_asignado: 5, ejercicios: [] });
    component.recetaSeleccion.set([2, 1]);

    component.guardarReceta();

    expect(servicio.reemplazarEjercicios).toHaveBeenCalledWith(5, {
      ejercicios: [
        { id_ejercicio: 2, orden: 1 },
        { id_ejercicio: 1, orden: 2 }
      ]
    });
    expect(component.modalRecetaAbierto()).toBe(false);
  });

  it('eliminar ejercicio pide confirmación y luego llama al backend', () => {
    component.pedirEliminarEjercicio({ id_ejercicio: 9, nombre: 'Curl', grupo_muscular: 'Brazo' });
    expect(component.confirmacion()?.tipo).toBe('ejercicio');

    component.ejecutarConfirmacion();
    expect(servicio.eliminarEjercicio).toHaveBeenCalledWith(9);
    expect(component.confirmacion()).toBeNull();
  });

  it('activar split llama al backend y recarga la lista', () => {
    component.activarSplit(2);

    expect(servicio.activarSplit).toHaveBeenCalledWith(2);
    expect(servicio.obtenerSplits).toHaveBeenCalled();
  });
});
