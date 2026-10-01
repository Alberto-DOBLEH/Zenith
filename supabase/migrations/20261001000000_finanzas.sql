-- Módulo de finanzas
-- 1) Enum tipo_metodo_pago: débito, efectivo, crédito
-- 2) Enum tipo_categoria: gasto, entrada
-- 3) Enum tipo_movimiento: gasto, entrada, transferencia
-- 4) Tablas metodos_pago, categorias y movimientos
-- 5) Backfill: método "Efectivo" para los usuarios existentes
--    (los usuarios nuevos lo recibe en el registro desde el backend)

CREATE TYPE public.tipo_metodo_pago AS ENUM (
  'DEBITO',
  'EFECTIVO',
  'CREDITO'
);

CREATE TYPE public.tipo_categoria AS ENUM (
  'GASTO',
  'ENTRADA'
);

CREATE TYPE public.tipo_movimiento AS ENUM (
  'GASTO',
  'ENTRADA',
  'TRANSFERENCIA'
);

-- Métodos de pago (1 usuario → varios métodos; 1 método → 1 usuario)
CREATE TABLE public.metodos_pago (
  id_metodo     integer                      GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_usuario    integer                      NOT NULL,
  nombre        character varying(50)        NOT NULL,
  tipo          public.tipo_metodo_pago      NOT NULL,
  saldo_actual  numeric(12,2)                DEFAULT 0 NOT NULL
);

ALTER TABLE public.metodos_pago ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.metodos_pago
  ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id_metodo);

ALTER TABLE public.metodos_pago
  ADD CONSTRAINT metodos_pago_usuario_nombre_unico UNIQUE (id_usuario, nombre);

ALTER TABLE public.metodos_pago
  ADD CONSTRAINT fk_metodo_pago_usuario
  FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE public.metodos_pago
  ADD CONSTRAINT metodos_pago_nombre_no_vacio CHECK (nombre <> '');

GRANT ALL ON public.metodos_pago TO anon;
GRANT ALL ON public.metodos_pago TO authenticated;
GRANT ALL ON public.metodos_pago TO service_role;

-- Categorías de gastos/entradas por usuario
CREATE TABLE public.categorias (
  id_categoria integer                  GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_usuario   integer                  NOT NULL,
  nombre       character varying(50)    NOT NULL,
  tipo         public.tipo_categoria    NOT NULL
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categorias
  ADD CONSTRAINT categorias_pkey PRIMARY KEY (id_categoria);

ALTER TABLE public.categorias
  ADD CONSTRAINT categorias_usuario_nombre_tipo_unico UNIQUE (id_usuario, nombre, tipo);

ALTER TABLE public.categorias
  ADD CONSTRAINT fk_categoria_usuario
  FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE public.categorias
  ADD CONSTRAINT categorias_nombre_no_vacio CHECK (nombre <> '');

GRANT ALL ON public.categorias TO anon;
GRANT ALL ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;

-- Movimientos (cantidad siempre positiva; el backend suma/resta según tipo)
CREATE TABLE public.movimientos (
  id_metodo_pago_destino  integer                    NULL,
  id_movimiento           integer                    GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_usuario              integer                    NOT NULL,
  id_metodo_pago          integer                    NOT NULL,
  id_categoria            integer                    NULL,
  tipo_movimiento         public.tipo_movimiento     NOT NULL,
  cantidad                numeric(12,2)              NOT NULL,
  fecha                   date                       DEFAULT CURRENT_DATE NOT NULL,
  descripcion             character varying(255)
);

ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.movimientos
  ADD CONSTRAINT movimientos_pkey PRIMARY KEY (id_movimiento);

ALTER TABLE public.movimientos
  ADD CONSTRAINT movimientos_cantidad_positiva CHECK (cantidad > 0);

-- Solo una transferencia tiene método destino, y nunca puede ser el mismo origen
ALTER TABLE public.movimientos
  ADD CONSTRAINT movimientos_destino_solo_transferencia
  CHECK ((tipo_movimiento = 'TRANSFERENCIA') = (id_metodo_pago_destino IS NOT NULL));

ALTER TABLE public.movimientos
  ADD CONSTRAINT movimientos_destino_diferente
  CHECK (id_metodo_pago_destino IS NULL OR id_metodo_pago_destino <> id_metodo_pago);

ALTER TABLE public.movimientos
  ADD CONSTRAINT fk_movimiento_usuario
  FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

-- RESTRICT: no se puede borrar un método de pago con movimientos asociados
ALTER TABLE public.movimientos
  ADD CONSTRAINT fk_movimiento_metodo_pago
  FOREIGN KEY (id_metodo_pago) REFERENCES public.metodos_pago(id_metodo) ON DELETE RESTRICT;

ALTER TABLE public.movimientos
  ADD CONSTRAINT fk_movimiento_metodo_pago_destino
  FOREIGN KEY (id_metodo_pago_destino) REFERENCES public.metodos_pago(id_metodo) ON DELETE RESTRICT;

-- SET NULL: si se borra una categoría, el movimiento conserva su historial sin categoría
ALTER TABLE public.movimientos
  ADD CONSTRAINT fk_movimiento_categoria
  FOREIGN KEY (id_categoria) REFERENCES public.categorias(id_categoria) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_fecha
  ON public.movimientos (id_usuario, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_metodo
  ON public.movimientos (id_metodo_pago);

GRANT ALL ON public.movimientos TO anon;
GRANT ALL ON public.movimientos TO authenticated;
GRANT ALL ON public.movimientos TO service_role;

-- Backfill: cada usuario existente recibe su método "Efectivo"
INSERT INTO public.metodos_pago (id_usuario, nombre, tipo, saldo_actual)
SELECT id_usuario, 'Efectivo', 'EFECTIVO'::public.tipo_metodo_pago, 0
FROM public.usuarios
ON CONFLICT (id_usuario, nombre) DO NOTHING;
