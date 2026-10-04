import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Eventos } from './eventos';
import { AuthService } from '../../core/servicios/auth.service';
import { EventosService, Evento } from '../../core/servicios/eventos.service';
import { ActividadesService, Actividad } from '../../core/servicios/actividades.service';

const aLocal = (fecha: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
};

const hoy = aLocal(new Date());
const ayer = aLocal(new Date(Date.now() - 86400000));

describe('Eventos (Calendario + Actividades)', () => {
  let component: Eventos;
  let fixture: ComponentFixture<Eventos>;

  let crearSpy: ReturnType<typeof vi.fn>;
  let editarSpy: ReturnType<typeof vi.fn>;
  let crearActSpy: ReturnType<typeof vi.fn>;
  let editarActSpy: ReturnType<typeof vi.fn>;
  let eliminarActSpy: ReturnType<typeof vi.fn>;

  const evento: Evento = {
    id_evento: 1,
    titulo: 'Examen Lenguajes',
    descripcion: null,
    fecha_inicio: '2026-10-10T16:00:00.000Z',
    fecha_fin: '2026-10-10T17:00:00.000Z',
    color: '#6366F1',
    avisos: ['2026-10-10T15:45:00.000Z']
  };

  const actividadHoy: Actividad = {
    id_actividad: 1,
    titulo: 'Entregar tarea de cálculo',
    descripcion: 'Capítulos 4 y 5',
    fecha_limite: hoy,
    estado: 'PENDIENTE'
  };

  const actividadVencida: Actividad = {
    id_actividad: 2,
    titulo: 'Informe viejo',
    descripcion: null,
    fecha_limite: ayer,
    estado: 'PENDIENTE'
  };

  const actividadCompletada: Actividad = {
    id_actividad: 3,
    titulo: 'Trámite',
    descripcion: null,
    fecha_limite: ayer,
    estado: 'COMPLETADA'
  };

  beforeEach(async () => {
    crearSpy = vi.fn(() => of({ message: 'Evento creado con exito', id_evento: 2 }));
    editarSpy = vi.fn(() => of({ message: 'Evento modificado con exito' }));
    crearActSpy = vi.fn(() => of({ message: 'Actividad creada con exito', actividad: actividadHoy }));
    editarActSpy = vi.fn(() => of({ message: 'Actividad modificada con exito', actividad: actividadHoy }));
    eliminarActSpy = vi.fn(() => of({ message: 'Actividad eliminada con exito' }));

    await TestBed.configureTestingModule({
      imports: [Eventos],
      providers: [
        { provide: AuthService, useValue: { manejarError: () => 'Error de prueba' } },
        {
          provide: EventosService,
          useValue: {
            obtener: () => of([evento]),
            crear: crearSpy,
            editar: editarSpy,
            eliminar: vi.fn(() => of({ message: 'ok' }))
          }
        },
        {
          provide: ActividadesService,
          useValue: {
            obtener: () => of([actividadHoy, actividadVencida, actividadCompletada]),
            crear: crearActSpy,
            editar: editarActSpy,
            eliminar: eliminarActSpy
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Eventos);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('crea el componente con eventos y actividades cargados', () => {
    expect(component).toBeTruthy();
    expect(component.eventos().length).toBe(1);
    expect(component.actividades().length).toBe(3);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Examen Lenguajes');
    expect(texto).toContain('Entregar tarea de cálculo');
  });

  it('abrirCrearActividad abre el modal con la fecha de hoy', () => {
    component.abrirCrearActividad();
    expect(component.modalActividadAbierto()).toBe(true);
    expect(component.modoEdicionActividad()).toBe(false);
    expect(component.formActFecha).toBe(hoy);
    expect(component.formActTitulo).toBe('');
  });

  it('guardarActividad exige título', () => {
    component.abrirCrearActividad();
    component.formActTitulo = '   ';
    component.guardarActividad();
    expect(component.mensajeActividad()).toContain('obligatorios');
    expect(crearActSpy).not.toHaveBeenCalled();
    expect(component.modalActividadAbierto()).toBe(true);
  });

  it('guardarActividad crea la actividad con el payload correcto', () => {
    component.abrirCrearActividad();
    component.formActTitulo = '  Entregar tarea  ';
    component.formActDescripcion = 'Cap 4';
    component.formActFecha = hoy;
    component.guardarActividad();

    expect(crearActSpy).toHaveBeenCalledTimes(1);
    expect(crearActSpy).toHaveBeenCalledWith({
      titulo: 'Entregar tarea',
      descripcion: 'Cap 4',
      fecha_limite: hoy
    });
    expect(component.modalActividadAbierto()).toBe(false);
  });

  it('alternarEstadoActividad cambia PENDIENTE a COMPLETADA', () => {
    component.alternarEstadoActividad(actividadHoy);
    expect(editarActSpy).toHaveBeenCalledTimes(1);
    expect(editarActSpy).toHaveBeenCalledWith(1, { estado: 'COMPLETADA' });
  });

  it('esVencida marca solo pendientes con fecha pasada', () => {
    expect(component.esVencida(actividadVencida)).toBe(true);
    expect(component.esVencida(actividadCompletada)).toBe(false);
    expect(component.esVencida(actividadHoy)).toBe(false);
  });

  it('actividadesDelDia filtra por la fecha del día', () => {
    const delHoy = component.actividadesDelDia(new Date());
    expect(delHoy.length).toBe(1);
    expect(delHoy[0].id_actividad).toBe(1);
  });

  it('guardar() envía eventos e instantes en ISO UTC (con Z)', () => {
    component.abrirCrear();
    component.formTitulo = 'Cita';
    component.formFecha = hoy;
    component.formHora = '10:00';
    component.formDuracion = 60;
    component.formAvisos = [`${hoy}T09:30`];
    component.guardar();

    expect(crearSpy).toHaveBeenCalledTimes(1);
    const payload = crearSpy.mock.calls[0][0];
    expect(payload.fecha_inicio.endsWith('Z')).toBe(true);
    expect(payload.fecha_fin.endsWith('Z')).toBe(true);
    expect(payload.avisos.length).toBe(1);
    expect(payload.avisos[0].endsWith('Z')).toBe(true);
  });

  it('abrirEditar convierte los avisos ISO a hora local para el input', () => {
    component.abrirEditar(evento);
    expect(component.formAvisos.length).toBe(1);
    expect(component.formAvisos[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

    const esperado = new Date(evento.avisos[0]);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${esperado.getFullYear()}-${pad(esperado.getMonth() + 1)}-${pad(esperado.getDate())}T${pad(esperado.getHours())}:${pad(esperado.getMinutes())}`;
    expect(component.formAvisos[0]).toBe(local);
  });

  it('confirmarEliminarActividad elimina y recarga la lista', () => {
    component.actividadAEliminar.set(actividadHoy);
    component.modalEliminarActividadAbierto.set(true);
    component.confirmarEliminarActividad();
    expect(eliminarActSpy).toHaveBeenCalledWith(1);
    expect(component.modalEliminarActividadAbierto()).toBe(false);
  });
});
