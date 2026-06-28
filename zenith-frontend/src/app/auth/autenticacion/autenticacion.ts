import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-autenticacion',
  imports: [RouterLink],
  templateUrl: './autenticacion.html',
  styleUrl: './autenticacion.css',
})
export class Autenticacion {
  pestanaActiva: 'login' | 'registro' = 'login';

  cambiarPestana(pestana: 'login' | 'registro') {
    this.pestanaActiva = pestana;
  }
}
