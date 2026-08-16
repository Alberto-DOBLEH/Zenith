import { Component, input, output } from '@angular/core';

export interface DetallesHabito {
    id_habito: number;
    nombre: string;
    descripcion: string | null;
    tipo_nombre: string;
    meta: number | null;
    unidad: string | null;
    esBueno: boolean;
    frecuencia: string;
    dias: string[];
    dia_del_mes: number | null;
}

const NOMBRES_DIAS: Record<string, string> = {
    LUNES: 'Lunes',
    MARTES: 'Martes',
    MIERCOLES: 'Miércoles',
    JUEVES: 'Jueves',
    VIERNES: 'Viernes',
    SABADO: 'Sábado',
    DOMINGO: 'Domingo'
};

@Component({
  selector: 'app-modal-detalles-habito',
  imports: [],
  templateUrl: './modal-detalles-habito.html',
  styleUrl: './modal-detalles-habito.css',
})
export class ModalDetallesHabito {
  readonly habito = input<DetallesHabito | null>(null);
  readonly cerrar = output<void>();

  frecuenciaTexto(frecuencia: string, dias: string[], diaDelMes: number | null): string {
    switch (frecuencia) {
        case 'SEMANAL':
            return `Semanal (${dias.map(d => NOMBRES_DIAS[d] || d).join(', ')})`;
        case 'MENSUAL':
            return `Mensual (día ${diaDelMes ?? '-'})`;
        default:
            return 'Diario';
    }
  }
}