import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/servicios/auth.service';
import { UiService } from '../../core/servicios/ui.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly authService = inject(AuthService);
  private readonly uiService = inject(UiService);

  alternarSidebar() {
    this.uiService.sidebarAbierta.update((abierta) => !abierta);
  }

  fotoPerfil(): string {
    const usuario = this.authService.usuario();
    if (usuario?.foto_perfil) return usuario.foto_perfil;
    if (usuario?.avatar) return `/assets/avatares/av-${usuario.avatar}.png`;
    return 'zenith_icon_app.png';
  }

  iniciales(): string {
    const usuario = this.authService.usuario();
    if (!usuario) return 'Z';
    return (usuario.nombre.charAt(0) + usuario.primer_apellido.charAt(0)).toUpperCase();
  }
}