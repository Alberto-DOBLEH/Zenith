import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, take } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import { HabitosService, Habito } from '../../core/servicios/habitos.service';
import { PomodoroService, SesionPomodoro } from '../../core/servicios/pomodoro.service';

const SEGUNDOS_TRABAJO = 25 * 60;
const SEGUNDOS_DESCANSO = 5 * 60;

@Component({
  selector: 'app-pomodoro',
  imports: [FormsModule],
  templateUrl: './pomodoro.html',
  styleUrl: './pomodoro.css',
})
export class Pomodoro implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly pomodoroService = inject(PomodoroService);
  private readonly habitosService = inject(HabitosService);
  private readonly route = inject(ActivatedRoute);

  private suscripciones: Subscription[] = [];
  private temporizador: ReturnType<typeof setInterval> | null = null;

  cargando = signal(true);
  error = signal('');
  mensaje = signal('');
  sesiones = signal<SesionPomodoro[]>([]);
  habitosTiempo = signal<Habito[]>([]);

  minutosObjetivo = 25;
  unidadTiempo = 'minutos';
  habitoSeleccionado: number | null = null;
  habitoBloqueado = signal(false);
  modo = signal<'pomodoro' | 'continuo'>('pomodoro');

  tituloSesion = computed(() => {
    if (this.habitoSeleccionado) {
      const habito = this.habitosTiempo().find(h => h.id_habito === this.habitoSeleccionado);
      return habito ? habito.nombre : 'Sesión de pomodoro';
    }
    return 'Sesión de pomodoro';
  });

  sesionActiva = signal<SesionPomodoro | null>(null);
  fase = signal<'trabajo' | 'descanso'>('trabajo');
  corriendo = signal(false);
  tiempoRestante = signal(SEGUNDOS_TRABAJO);
  cicloActual = signal(1);
  ciclosCompletados = signal(0);
  minutosRealizados = signal(0);
  sesionTerminada = signal(false);
  esContinuo = signal(false);

  ngOnInit() {
    this.cargarDatos();

    this.route.queryParamMap.pipe(take(1)).subscribe(params => {
      const habitoParam = params.get('habito');
      if (habitoParam) {
        this.habitoSeleccionado = Number(habitoParam);
        this.habitoBloqueado.set(true);
        this.aplicarConfigHabito();
      }
    });
  }

  ngOnDestroy() {
    this.detenerTemporizador();
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  aplicarConfigHabito() {
    if (!this.habitoSeleccionado) {
      this.minutosObjetivo = 25;
      this.unidadTiempo = 'minutos';
      this.modo.set('pomodoro');
      return;
    }
    const habito = this.habitosTiempo().find(h => h.id_habito === this.habitoSeleccionado);
    if (habito) {
      const metaMinutos = habito.meta ?? 25;
      if (metaMinutos >= 60 && metaMinutos % 60 === 0) {
        this.minutosObjetivo = metaMinutos / 60;
        this.unidadTiempo = 'horas';
      } else {
        this.minutosObjetivo = metaMinutos;
        this.unidadTiempo = 'minutos';
      }
      this.modo.set(habito.pomodoro_habilitado ? 'pomodoro' : 'continuo');
    }
  }

  private cargarDatos() {
    this.suscripciones.push(
      this.pomodoroService.obtenerSesiones().subscribe({
        next: (sesiones) => {
          this.sesiones.set(sesiones);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargando.set(false);
        }
      })
    );

    this.suscripciones.push(
      this.habitosService.obtener().subscribe({
        next: (habitos) => {
          this.habitosTiempo.set(habitos.filter(h => h.tipo_habito === 2));
        }
      })
    );
  }

  iniciar() {
    if (!this.minutosObjetivo || this.minutosObjetivo <= 0) {
      this.error.set('Indica una duración mayor a 0.');
      return;
    }
    this.error.set('');
    this.mensaje.set('');

    const minutosFinales = this.unidadTiempo === 'horas'
      ? this.minutosObjetivo * 60
      : this.minutosObjetivo;

    this.suscripciones.push(
      this.pomodoroService.crearSesion(minutosFinales, this.habitoSeleccionado, this.modo()).subscribe({
        next: (respuesta) => {
          const sesion = {
            ...respuesta.sesion,
            habito_nombre: null,
            fecha_fin: null,
            minutos_realizados: 0,
            ciclos_completados: 0
          } as SesionPomodoro;
          this.cargarSesionEnCurso(sesion, this.modo() === 'continuo');
        },
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  retomar(sesion: SesionPomodoro) {
    if (this.sesionActiva() || sesion.fecha_fin) return;
    const continuo = sesion.ciclos_objetivo === 1;
    this.cargarSesionEnCurso({
      ...sesion,
      habito_nombre: sesion.habito_nombre || null
    }, continuo);
  }

  private cargarSesionEnCurso(sesion: SesionPomodoro, continuo = false) {
    this.sesionActiva.set(sesion);
    this.esContinuo.set(continuo);
    this.ciclosCompletados.set(sesion.ciclos_completados || 0);
    this.minutosRealizados.set(sesion.minutos_realizados || 0);
    this.cicloActual.set(this.ciclosCompletados() + 1);
    this.fase.set('trabajo');
    this.sesionTerminada.set(false);

    if (continuo) {
      const totalSegundos = sesion.minutos_objetivo * 60;
      const yaAvanzado = (sesion.minutos_realizados || 0) * 60;
      this.tiempoRestante.set(totalSegundos - yaAvanzado);
    } else {
      this.tiempoRestante.set(SEGUNDOS_TRABAJO);
    }
    this.correr();
  }

  alternar() {
    if (!this.sesionActiva()) return;
    if (this.corriendo()) {
      this.pausar();
    } else {
      this.correr();
    }
  }

  private correr() {
    this.corriendo.set(true);
    if (this.temporizador) return;
    this.temporizador = setInterval(() => this.tick(), 1000);
  }

  private pausar() {
    this.corriendo.set(false);
    this.detenerTemporizador();
    this.guardarProgreso();
  }

  private detenerTemporizador() {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }

  private tick() {
    if (!this.sesionActiva()) return;
    this.tiempoRestante.update(restante => restante - 1);

    if (this.esContinuo()) {
      const totalSegundos = this.sesionActiva()!.minutos_objetivo * 60;
      this.minutosRealizados.set(Math.round((totalSegundos - this.tiempoRestante()) / 60));
    } else if (this.fase() === 'trabajo') {
      this.minutosRealizados.set(Math.round(
        ((this.ciclosCompletados() * SEGUNDOS_TRABAJO) + (SEGUNDOS_TRABAJO - this.tiempoRestante())) / 60
      ));
    }

    if (this.tiempoRestante() <= 0) {
      if (this.esContinuo()) {
        this.finalizarSesion();
      } else {
        this.completarFase();
      }
    }
  }

  private completarFase() {
    if (this.fase() === 'trabajo') {
      this.ciclosCompletados.update(valor => valor + 1);
      this.minutosRealizados.set(this.ciclosCompletados() * 25);

      if (this.sesionActiva() && this.ciclosCompletados() >= this.sesionActiva()!.ciclos_objetivo) {
        this.finalizarSesion();
        return;
      }

      this.fase.set('descanso');
      this.tiempoRestante.set(SEGUNDOS_DESCANSO);
      this.cicloActual.set(this.ciclosCompletados() + 1);
      this.guardarProgreso();
    } else {
      this.fase.set('trabajo');
      this.tiempoRestante.set(SEGUNDOS_TRABAJO);
    }
  }

  private guardarProgreso() {
    const sesion = this.sesionActiva();
    if (!sesion) return;
    this.suscripciones.push(
      this.pomodoroService.avanzarSesion(sesion.id_sesion, {
        minutos_realizados: this.minutosRealizados(),
        ciclos_completados: this.ciclosCompletados()
      }).subscribe()
    );
  }

  private finalizarSesion() {
    const sesion = this.sesionActiva();
    if (!sesion) return;

    this.pausar();
    this.corriendo.set(false);

    this.suscripciones.push(
      this.pomodoroService.avanzarSesion(sesion.id_sesion, {
        minutos_realizados: this.minutosRealizados(),
        ciclos_completados: this.ciclosCompletados(),
        finalizar: true
      }).subscribe({
        next: (respuesta) => {
          this.sesionTerminada.set(true);
          this.mensaje.set(respuesta.completado
            ? '¡Sesión completada! ' + (sesion.habito ? 'Tu hábito quedó marcado como completado.' : '')
            : 'Sesión finalizada.');
          this.recargarHistorial();
        },
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  cerrarSesionTerminada() {
    this.sesionActiva.set(null);
    this.sesionTerminada.set(false);
    this.esContinuo.set(false);
    this.cicloActual.set(1);
    this.ciclosCompletados.set(0);
    this.minutosRealizados.set(0);
    this.tiempoRestante.set(SEGUNDOS_TRABAJO);
  }

  eliminarSesion(sesion: SesionPomodoro) {
    this.suscripciones.push(
      this.pomodoroService.eliminarSesion(sesion.id_sesion).subscribe({
        next: () => this.recargarHistorial(),
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  private recargarHistorial() {
    this.suscripciones.push(
      this.pomodoroService.obtenerSesiones().subscribe({
        next: (sesiones) => this.sesiones.set(sesiones)
      })
    );
  }

  tiempoFormateado(): string {
    const minutos = Math.floor(this.tiempoRestante() / 60);
    const segundos = this.tiempoRestante() % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }

  progresoCirculo(): number {
    if (this.esContinuo()) {
      const total = (this.sesionActiva()?.minutos_objetivo || this.minutosObjetivo) * 60;
      return (1 - this.tiempoRestante() / total) * 100;
    }
    const total = this.fase() === 'trabajo' ? SEGUNDOS_TRABAJO : SEGUNDOS_DESCANSO;
    return (1 - this.tiempoRestante() / total) * 100;
  }

  etiquetaFase(): string {
    if (this.esContinuo()) return 'Tiempo';
    return this.fase() === 'trabajo' ? 'Trabajo' : 'Descanso';
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  esHoy(sesion: SesionPomodoro): boolean {
    return !sesion.fecha_fin;
  }
}
