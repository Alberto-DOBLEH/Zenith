import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UiService } from '../../core/servicios/ui.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly uiService = inject(UiService);

  readonly abierta = this.uiService.sidebarAbierta;

  cerrar() {
    this.uiService.sidebarAbierta.set(false);
  }
}