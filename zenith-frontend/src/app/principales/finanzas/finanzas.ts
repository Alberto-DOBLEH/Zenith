import { Component, inject, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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
  imports: [ReactiveFormsModule, LowerCasePipe],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class Finanzas {
  private readonly fb = inject(FormBuilder);

  cargando = signal(false);
  error = signal('');
  mensajeExito = signal('');
  metodosPago = signal<MetodoPago[]>([]);
  categorias = signal<Categoria[]>([]);
  movimientos = signal<Movimiento[]>([]);

  modalMetodoAbierto = signal(false);
  modoEdicionMetodo = signal(false);
  metodoEditandoId = signal<number | null>(null);

  modalCategoriaAbierto = signal(false);
  modoEdicionCategoria = signal(false);
  categoriaEditandoId = signal<number | null>(null);

  mensajeForm = signal('');

  formMetodo = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    tipo: ['EFECTIVO' as MetodoPago['tipo'], Validators.required],
    saldo_actual: [0, Validators.required]
  });

  formCategoria = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    tipo: ['GASTO' as Categoria['tipo'], Validators.required]
  });

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

  private siguienteId(numeros: number[]): number {
    return numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
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

  abrirCrearMetodo() {
    this.modoEdicionMetodo.set(false);
    this.metodoEditandoId.set(null);
    this.mensajeForm.set('');
    this.formMetodo.reset({
      nombre: '',
      tipo: 'EFECTIVO',
      saldo_actual: 0
    });
    this.modalMetodoAbierto.set(true);
  }

  abrirEditarMetodo(metodo: MetodoPago) {
    this.modoEdicionMetodo.set(true);
    this.metodoEditandoId.set(metodo.id_metodo);
    this.mensajeForm.set('');
    this.formMetodo.reset({
      nombre: metodo.nombre,
      tipo: metodo.tipo,
      saldo_actual: Number(metodo.saldo_actual)
    });
    this.modalMetodoAbierto.set(true);
  }

  cerrarMetodo() {
    this.modalMetodoAbierto.set(false);
  }

  guardarMetodo() {
    if (this.formMetodo.invalid) {
      this.formMetodo.markAllAsTouched();
      this.mensajeForm.set('Completa los campos requeridos.');
      return;
    }

    const valores = this.formMetodo.value;

    if (this.modoEdicionMetodo()) {
      this.metodosPago.set(this.metodosPago().map(m =>
        m.id_metodo === this.metodoEditandoId()
          ? { ...m, nombre: valores.nombre!, tipo: valores.tipo! }
          : m
      ));
      this.mensajeExito.set('Método de pago actualizado.');
    } else {
      const nuevo: MetodoPago = {
        id_metodo: this.siguienteId(this.metodosPago().map(m => m.id_metodo)),
        id_usuario: 0,
        nombre: valores.nombre!,
        tipo: valores.tipo!,
        saldo_actual: Number(valores.saldo_actual ?? 0)
      };
      this.metodosPago.set([...this.metodosPago(), nuevo]);
      this.mensajeExito.set('Método de pago creado.');
    }

    this.modalMetodoAbierto.set(false);
  }

  abrirCrearCategoria() {
    this.modoEdicionCategoria.set(false);
    this.categoriaEditandoId.set(null);
    this.mensajeForm.set('');
    this.formCategoria.reset({
      nombre: '',
      tipo: 'GASTO'
    });
    this.modalCategoriaAbierto.set(true);
  }

  abrirEditarCategoria(categoria: Categoria) {
    this.modoEdicionCategoria.set(true);
    this.categoriaEditandoId.set(categoria.id_categoria);
    this.mensajeForm.set('');
    this.formCategoria.reset({
      nombre: categoria.nombre,
      tipo: categoria.tipo
    });
    this.modalCategoriaAbierto.set(true);
  }

  cerrarCategoria() {
    this.modalCategoriaAbierto.set(false);
  }

  guardarCategoria() {
    if (this.formCategoria.invalid) {
      this.formCategoria.markAllAsTouched();
      this.mensajeForm.set('Completa los campos requeridos.');
      return;
    }

    const valores = this.formCategoria.value;

    if (this.modoEdicionCategoria()) {
      this.categorias.set(this.categorias().map(c =>
        c.id_categoria === this.categoriaEditandoId()
          ? { ...c, nombre: valores.nombre!, tipo: valores.tipo! }
          : c
      ));
      this.mensajeExito.set('Categoría actualizada.');
    } else {
      const nueva: Categoria = {
        id_categoria: this.siguienteId(this.categorias().map(c => c.id_categoria)),
        id_usuario: 0,
        nombre: valores.nombre!,
        tipo: valores.tipo!
      };
      this.categorias.set([...this.categorias(), nueva]);
      this.mensajeExito.set('Categoría creada.');
    }

    this.modalCategoriaAbierto.set(false);
  }
}
