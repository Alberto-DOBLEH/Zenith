import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, Usuario } from '../../core/servicios/auth.service';
import { UsuariosService } from '../../core/servicios/usuarios.service';
import { AvataresService, Avatar } from '../../core/servicios/avatares.service';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly avataresService = inject(AvataresService);

  private suscripciones: Subscription[] = [];

  cargando = signal(true);
  error = signal('');
  mensaje = signal('');
  avatares = signal<Avatar[]>([]);

  modalDatos = signal(false);
  modalPassword = signal(false);
  modalEliminar = signal(false);
  modalCerrar = signal(false);
  guardando = signal(false);
  guardandoPassword = signal(false);
  eliminando = signal(false);

  formNombre = '';
  formPrimerApellido = '';
  formSegundoApellido = '';
  formFechaNacimiento = '';
  formPais = '';
  formAvatar: number | null = null;

  pwActual = '';
  pwNueva = '';
  mensajePassword = signal('');
  errorPassword = signal('');
  errorDatos = signal('');

  ngOnInit() {
    if (!this.authService.usuario()) {
      this.authService.cargarPerfil().subscribe();
    }
    this.cargarAvatares();
  }

  ngOnDestroy() {
    this.suscripciones.forEach(s => s.unsubscribe());
  }

  private cargarAvatares() {
    this.suscripciones.push(
      this.avataresService.obtener().subscribe({
        next: (avatares) => {
          this.avatares.set(avatares);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargando.set(false);
        }
      })
    );
  }

  get usuario(): Usuario | null {
    return this.authService.usuario();
  }

  nombreCompleto(): string {
    const u = this.usuario;
    if (!u) return '';
    return [u.nombre, u.primer_apellido, u.segundo_apellido].filter(Boolean).join(' ');
  }

  avatarRuta(): string {
    const u = this.usuario;
    if (!u) return '';
    if (u.foto_perfil) return u.foto_perfil;
    const avatar = this.avatares().find(a => a.id_avatar === u.avatar);
    return avatar?.ruta_imagen || '';
  }

  iniciales(): string {
    const u = this.usuario;
    if (!u) return 'Z';
    return (u.nombre.charAt(0) + u.primer_apellido.charAt(0)).toUpperCase();
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const texto = String(fecha);
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
      const [anio, mes, dia] = texto.slice(0, 10).split('-').map(Number);
      return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatearTelefono(telefono: string): string {
    return telefono || '—';
  }

  private aYyyyMmDd(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const texto = String(fecha);
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
    return '';
  }

  abrirEditarDatos() {
    const u = this.usuario;
    if (!u) return;
    this.errorDatos.set('');
    this.mensaje.set('');
    this.formNombre = u.nombre;
    this.formPrimerApellido = u.primer_apellido;
    this.formSegundoApellido = u.segundo_apellido || '';
    this.formFechaNacimiento = this.aYyyyMmDd(u.fecha_nacimiento);
    this.formPais = u.pais || '';
    this.formAvatar = u.avatar ?? null;
    this.modalDatos.set(true);
  }

  cerrarEditarDatos() {
    this.modalDatos.set(false);
    this.errorDatos.set('');
  }

  guardarDatos() {
    if (!this.formNombre.trim() || !this.formPrimerApellido.trim()) {
      this.errorDatos.set('Nombre y primer apellido son obligatorios.');
      return;
    }
    this.guardando.set(true);
    this.errorDatos.set('');

    this.suscripciones.push(
      this.usuariosService.editarPerfil({
        nombre: this.formNombre.trim(),
        primer_apellido: this.formPrimerApellido.trim(),
        segundo_apellido: this.formSegundoApellido.trim() || null,
        avatar: this.formAvatar,
        fecha_nacimiento: this.formFechaNacimiento || null,
        pais: this.formPais.trim() || null
      }).subscribe({
        next: () => {
          this.authService.cargarPerfil().subscribe();
          this.guardando.set(false);
          this.modalDatos.set(false);
          this.errorDatos.set('');
          this.mensaje.set('Datos actualizados correctamente.');
        },
        error: (error) => {
          this.guardando.set(false);
          this.errorDatos.set(this.authService.manejarError(error));
        }
      })
    );
  }

  abrirCambiarPassword() {
    this.errorPassword.set('');
    this.mensajePassword.set('');
    this.pwActual = '';
    this.pwNueva = '';
    this.modalPassword.set(true);
  }

  cerrarCambiarPassword() {
    this.modalPassword.set(false);
  }

  guardarPassword() {
    if (!this.pwActual || !this.pwNueva) {
      this.errorPassword.set('Ambos campos son obligatorios.');
      return;
    }
    this.guardandoPassword.set(true);
    this.errorPassword.set('');

    this.suscripciones.push(
      this.usuariosService.cambiarPassword(this.pwActual, this.pwNueva).subscribe({
        next: () => {
          this.guardandoPassword.set(false);
          this.modalPassword.set(false);
          this.mensaje.set('Contraseña actualizada correctamente.');
        },
        error: (error) => {
          this.guardandoPassword.set(false);
          this.errorPassword.set(this.authService.manejarError(error));
        }
      })
    );
  }

  abrirEliminarCuenta() {
    this.error.set('');
    this.mensaje.set('');
    this.modalEliminar.set(true);
  }

  cerrarEliminarCuenta() {
    if (this.eliminando()) return;
    this.modalEliminar.set(false);
  }

  confirmarEliminarCuenta() {
    this.eliminando.set(true);
    this.suscripciones.push(
      this.usuariosService.eliminarCuenta().subscribe({
        next: () => {
          this.eliminando.set(false);
          this.modalEliminar.set(false);
          this.authService.cerrarSesion();
        },
        error: (error) => {
          this.eliminando.set(false);
          this.error.set(this.authService.manejarError(error));
        }
      })
    );
  }

  abrirCerrarSesion() {
    this.error.set('');
    this.mensaje.set('');
    this.modalCerrar.set(true);
  }

  cerrarCerrarSesion() {
    this.modalCerrar.set(false);
  }

  confirmarCerrarSesion() {
    this.modalCerrar.set(false);
    this.authService.cerrarSesion();
  }
}
