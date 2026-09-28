import { Component, input, output } from '@angular/core';
import { textoFrecuencia, textoObjetivo } from '../../core/utilidades/habito-formato';

export interface DetallesHabito {
    id_habito: number;
    nombre: string;
    descripcion: string | null;
    tipo_habito: number;
    tipo_nombre: string;
    meta: number | null;
    unidad: string | null;
    esBueno: boolean;
    frecuencia: string;
    dias: string[];
    dia_del_mes: number | null;
    pomodoro_habilitado: boolean;
}

@Component({
  selector: 'app-modal-detalles-habito',
  imports: [],
  templateUrl: './modal-detalles-habito.html',
  styleUrl: './modal-detalles-habito.css',
})
export class ModalDetallesHabito {
  readonly habito = input<DetallesHabito | null>(null);
  readonly cerrar = output<void>();

  readonly frecuenciaTexto = textoFrecuencia;
  readonly objetivoTexto = textoObjetivo;
}
