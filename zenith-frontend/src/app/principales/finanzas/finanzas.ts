import { Component, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';

export interface MetodoPago {
  id_metodo: number;
  id_usuario: number;
  nombre: string;
  tipo: 'DEBITO' | 'EFECTIVO' | 'CREDITO';
  saldo_actual: number | string;
}

export interface Categoria {
  id_categoria: number;
  id_usuario: number;
  nombre: string;
  tipo: 'GASTO' | 'ENTRADA';
}

export interface Movimiento {
  id_movimiento: number;
  id_usuario: number;
  id_metodo_pago: number;
  id_categoria: number | null;
  tipo_movimiento: 'GASTO' | 'ENTRADA' | 'TRANSFERENCIA';
  cantidad: number | string;
  fecha: string;
  descripcion: string | null;
  id_metodo_pago_destino: number | null;
}

const ETIQUETAS_METODO: Record<MetodoPago['tipo'], string> = {
  DEBITO: 'Débito',
  EFECTIVO: 'Efectivo',
  CREDITO: 'Crédito'
};

const ICONOS_METODO: Record<MetodoPago['tipo'], string> = {
  DEBITO: 'bi-credit-card',
  EFECTIVO: 'bi-cash',
  CREDITO: 'bi-credit-card-2-front'
};

const ETIQUETAS_MOVIMIENTO: Record<Movimiento['tipo_movimiento'], string> = {
  GASTO: 'Gasto',
  ENTRADA: 'Entrada',
  TRANSFERENCIA: 'Transferencia'
};

@Component({
  selector: 'app-finanzas',
  imports: [LowerCasePipe],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class Finanzas {
  cargando = signal(false);
  error = signal('');
  mensajeExito = signal('');
  metodosPago = signal<MetodoPago[]>([]);
  categorias = signal<Categoria[]>([]);
  movimientos = signal<Movimiento[]>([]);

  get saldoTotal(): number {
    return this.metodosPago().reduce((total, m) => total + Number(m.saldo_actual), 0);
  }

  get ingresosMes(): number {
    return this.movimientosDeMes('ENTRADA');
  }

  get gastosMes(): number {
    return this.movimientosDeMes('GASTO');
  }

  private movimientosDeMes(tipo: Movimiento['tipo_movimiento']): number {
    const mes = this.fechaHoy().slice(0, 7);
    return this.movimientos()
      .filter(m => m.tipo_movimiento === tipo && String(m.fecha).slice(0, 7) === mes)
      .reduce((total, m) => total + Number(m.cantidad), 0);
  }

  private fechaHoy(): string {
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset();
    return new Date(ahora.getTime() - offset * 60000).toISOString().split('T')[0];
  }

  formatearMoneda(valor: number | string): string {
    return Number(valor).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    });
  }

  formatearFecha(fecha: string): string {
    const [anio, mes, dia] = String(fecha).slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  etiquetaMetodo(tipo: MetodoPago['tipo']): string {
    return ETIQUETAS_METODO[tipo] ?? tipo;
  }

  iconoMetodo(tipo: MetodoPago['tipo']): string {
    return ICONOS_METODO[tipo] ?? 'bi-wallet2';
  }

  etiquetaMovimiento(tipo: Movimiento['tipo_movimiento']): string {
    return ETIQUETAS_MOVIMIENTO[tipo] ?? tipo;
  }

  nombreMetodo(idMetodo: number | null): string {
    if (idMetodo === null) return '';
    return this.metodosPago().find(m => m.id_metodo === idMetodo)?.nombre ?? '';
  }

  nombreCategoria(idCategoria: number | null): string {
    if (idCategoria === null) return '';
    return this.categorias().find(c => c.id_categoria === idCategoria)?.nombre ?? '';
  }

  textoCantidad(movimiento: Movimiento): string {
    const cantidad = this.formatearMoneda(movimiento.cantidad);
    if (movimiento.tipo_movimiento === 'ENTRADA') return `+${cantidad}`;
    if (movimiento.tipo_movimiento === 'GASTO') return `-${cantidad}`;
    return cantidad;
  }
}
