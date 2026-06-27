import { Component } from '@angular/core';

@Component({
  selector: 'app-autenticacion',
  imports: [],
  templateUrl: './autenticacion.html',
  styleUrl: './autenticacion.css',
})
export class Autenticacion {
  pestanaActiva: 'login' | 'registro' = 'login';

  cambiarPestana(pestana: 'login' | 'registro') {
    this.pestanaActiva = pestana;
  }
}
