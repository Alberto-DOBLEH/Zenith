import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/servicios/auth.service';
import {
  FinanzasService,
  MetodoPago,
  Categoria,
  Movimiento,
  MovimientoPayload,
  FiltrosMovimientos
} from '../../core/servicios/finanzas.service';

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
  imports: [ReactiveFormsModule, FormsModule, LowerCasePipe],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class Finanzas implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly finanzasService = inject(FinanzasService);
  private readonly fb = inject(FormBuilder);

  private suscripciones: Subscription[] = [];
  private suscripcionFiltro: Subscription | null = null;

  cargando = signal(true);
  error = signal('');
  mensajeExito = signal('');
  metodosPago = signal<MetodoPago[]>([]);
  categorias = signal<Categoria[]>([]);
  movimientos = signal<Movimiento[]>([]);
  movimientosVisibles = signal<Movimiento[]>([]);
  filtrando = signal(false);

  modalMetodoAbierto = signal(false);
  modalCategoriaAbierto = signal(false);
  modalMovimientoAbierto = signal(false);
  modoEdicionCategoria = signal(false);
  categoriaEditandoId = signal<number | null>(null);

  mensajeForm = signal('');
  guardando = signal(false);

  formMetodo = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    tipo: ['EFECTIVO' as MetodoPago['tipo'], Validators.required],
    saldo_actual: [0, Validators.required]
  });

  formCategoria = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    tipo: ['GASTO' as Categoria['tipo'], Validators.required]
  });

  formMovimiento = this.fb.group({
    tipo_movimiento: ['GASTO' as Movimiento['tipo_movimiento'], Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    id_metodo_pago: [null as number | null, Validators.required],
    id_metodo_pago_destino: [null as number | null],
    id_categoria: [null as number | null],
    fecha: [''],
    descripcion: ['']
  });

  formFiltros = this.fb.group({
    fecha: [''],
    mes: [''],
    tipo: [''],
    metodo: ['']
  });

  ngOnInit() {
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.suscripciones.forEach(s => s.unsubscribe());
    this.suscripcionFiltro?.unsubscribe();
  }

  private cargarDatos() {
    this.cargando.set(true);
    this.error.set('');

    this.suscripciones.push(
      this.finanzasService.obtenerMetodosPago().subscribe({
        next: (metodos) => this.metodosPago.set(metodos),
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );

    this.suscripciones.push(
      this.finanzasService.obtenerCategorias().subscribe({
        next: (categorias) => this.categorias.set(categorias),
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );

    this.suscripciones.push(
      this.finanzasService.obtenerMovimientos().subscribe({
        next: (movimientos) => {
          this.movimientos.set(movimientos);
          this.movimientosVisibles.set(movimientos);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(this.authService.manejarError(error));
          this.cargando.set(false);
        }
      })
    );
  }

  private recargarMetodos() {
    this.suscripciones.push(
      this.finanzasService.obtenerMetodosPago().subscribe({
        next: (metodos) => this.metodosPago.set(metodos),
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  private recargarCategorias() {
    this.suscripciones.push(
      this.finanzasService.obtenerCategorias().subscribe({
        next: (categorias) => this.categorias.set(categorias),
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  private recargarMovimientos() {
    this.suscripciones.push(
      this.finanzasService.obtenerMovimientos().subscribe({
        next: (movimientos) => {
          this.movimientos.set(movimientos);
          this.aplicarFiltros();
        },
        error: (error) => this.error.set(this.authService.manejarError(error))
      })
    );
  }

  get hayFiltros(): boolean {
    const v = this.formFiltros.value;
    return !!(v.fecha || v.mes || v.tipo || v.metodo);
  }

  aplicarFiltros() {
    const v = this.formFiltros.value;
    const filtros: FiltrosMovimientos = {};
    if (v.fecha) filtros.fecha = v.fecha;
    if (v.mes) filtros.mes = v.mes;
    if (v.tipo) filtros.tipo = v.tipo as Movimiento['tipo_movimiento'];
    if (v.metodo) filtros.metodo = Number(v.metodo);

    this.suscripcionFiltro?.unsubscribe();
    this.error.set('');

    if (Object.keys(filtros).length === 0) {
      this.filtrando.set(false);
      this.movimientosVisibles.set(this.movimientos());
      return;
    }

    this.filtrando.set(true);
    this.suscripcionFiltro = this.finanzasService.obtenerMovimientos(filtros).subscribe({
      next: (movimientos) => {
        this.movimientosVisibles.set(movimientos);
        this.filtrando.set(false);
      },
      error: (error) => {
        this.error.set(this.authService.manejarError(error));
        this.filtrando.set(false);
      }
    });
  }

  onCambioTipo(event: Event) {
    this.formFiltros.patchValue({ tipo: (event.target as HTMLSelectElement).value });
    this.aplicarFiltros();
  }

  onCambioMetodo(event: Event) {
    this.formFiltros.patchValue({ metodo: (event.target as HTMLSelectElement).value });
    this.aplicarFiltros();
  }

  onCambioFecha(event: Event) {
    this.formFiltros.patchValue({
      fecha: (event.target as HTMLInputElement).value,
      mes: ''
    });
    this.aplicarFiltros();
  }

  onCambioMes(event: Event) {
    this.formFiltros.patchValue({
      mes: (event.target as HTMLInputElement).value,
      fecha: ''
    });
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.formFiltros.reset({ fecha: '', mes: '', tipo: '', metodo: '' });
    this.aplicarFiltros();
  }

  get tipoMovimientoForm(): Movimiento['tipo_movimiento'] {
    return this.formMovimiento.value.tipo_movimiento ?? 'GASTO';
  }

  get categoriasFiltradas(): Categoria[] {
    const tipo: Categoria['tipo'] = this.tipoMovimientoForm === 'ENTRADA' ? 'ENTRADA' : 'GASTO';
    return this.categorias().filter(c => c.tipo === tipo);
  }

  get metodosDestino(): MetodoPago[] {
    const origen = this.formMovimiento.value.id_metodo_pago;
    return this.metodosPago().filter(m => m.id_metodo !== origen);
  }

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

  abrirCrearMetodo() {
    this.mensajeForm.set('');
    this.formMetodo.reset({
      nombre: '',
      tipo: 'EFECTIVO',
      saldo_actual: 0
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

    this.guardando.set(true);
    this.mensajeForm.set('');

    this.suscripciones.push(
      this.finanzasService.crearMetodoPago({
        nombre: valores.nombre!.trim(),
        tipo: valores.tipo!,
        saldo_inicial: Number(valores.saldo_actual ?? 0)
      }).subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.modalMetodoAbierto.set(false);
          this.mensajeExito.set(respuesta.message);
          this.recargarMetodos();
        },
        error: (error) => {
          this.guardando.set(false);
          this.mensajeForm.set(this.authService.manejarError(error));
        }
      })
    );
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

    this.guardando.set(true);
    this.mensajeForm.set('');

    const operacion = this.modoEdicionCategoria()
      ? this.finanzasService.editarCategoria(this.categoriaEditandoId()!, {
          nombre: valores.nombre!.trim(),
          tipo: valores.tipo!
        })
      : this.finanzasService.crearCategoria({
          nombre: valores.nombre!.trim(),
          tipo: valores.tipo!
        });

    this.suscripciones.push(
      operacion.subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.modalCategoriaAbierto.set(false);
          this.mensajeExito.set(respuesta.message);
          this.recargarCategorias();
        },
        error: (error) => {
          this.guardando.set(false);
          this.mensajeForm.set(this.authService.manejarError(error));
        }
      })
    );
  }

  abrirCrearMovimiento() {
    this.mensajeForm.set('');
    this.formMovimiento.reset({
      tipo_movimiento: 'GASTO',
      cantidad: null,
      id_metodo_pago: null,
      id_metodo_pago_destino: null,
      id_categoria: null,
      fecha: this.fechaHoy(),
      descripcion: ''
    });
    this.modalMovimientoAbierto.set(true);
  }

  cerrarMovimiento() {
    this.modalMovimientoAbierto.set(false);
  }

  guardarMovimiento() {
    const valores = this.formMovimiento.value;
    const tipo = valores.tipo_movimiento!;

    if (this.formMovimiento.invalid) {
      this.formMovimiento.markAllAsTouched();
      this.mensajeForm.set('Completa los campos requeridos.');
      return;
    }

    if (tipo === 'TRANSFERENCIA') {
      if (!valores.id_metodo_pago_destino) {
        this.mensajeForm.set('Selecciona el método destino.');
        return;
      }
      if (valores.id_metodo_pago === valores.id_metodo_pago_destino) {
        this.mensajeForm.set('El método destino debe ser distinto al de origen.');
        return;
      }
    } else if (!valores.id_categoria) {
      this.mensajeForm.set('Selecciona una categoría.');
      return;
    }

    const payload: MovimientoPayload = {
      tipo_movimiento: tipo,
      cantidad: Number(valores.cantidad),
      id_metodo_pago: Number(valores.id_metodo_pago)
    };

    if (tipo === 'TRANSFERENCIA') {
      payload.id_metodo_pago_destino = Number(valores.id_metodo_pago_destino);
    } else {
      payload.id_categoria = Number(valores.id_categoria);
      if (valores.fecha) payload.fecha = valores.fecha;
      if (valores.descripcion?.trim()) payload.descripcion = valores.descripcion.trim();
    }

    this.guardando.set(true);
    this.mensajeForm.set('');

    this.suscripciones.push(
      this.finanzasService.crearMovimiento(payload).subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.modalMovimientoAbierto.set(false);
          this.mensajeExito.set(respuesta.message);
          this.recargarMovimientos();
          this.recargarMetodos();
        },
        error: (error) => {
          this.guardando.set(false);
          this.mensajeForm.set(this.authService.manejarError(error));
        }
      })
    );
  }
}
