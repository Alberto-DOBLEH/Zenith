-- Módulo de gimnasio (entrenamientos)
-- 1) Enum unidad_peso: kg, lbs
-- 2) Tabla ejercicios: catálogo universal (sin id_usuario, no se duplica)
-- 3) Tabla splits: programas de entrenamiento del usuario (solo uno activo)
-- 4) Tabla sesiones_plan: días del molde de un split
-- 5) Tabla ejercicios_por_sesion: pivote que arma la receta de cada sesión
-- 6) Tabla entrenamientos_historial: la ida real al gimnasio
-- 7) Tabla series_historial: métrica granular (pesos, reps, progresión)

CREATE TYPE public.unidad_peso AS ENUM (
  'kg',
  'lbs'
);

-- Catálogo universal de ejercicios (compartido por todos los usuarios)
CREATE TABLE public.ejercicios (
  id_ejercicio    integer                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre          character varying(100)    NOT NULL,
  grupo_muscular  character varying(50)     NOT NULL
);

ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ejercicios
  ADD CONSTRAINT ejercicios_pkey PRIMARY KEY (id_ejercicio);

ALTER TABLE public.ejercicios
  ADD CONSTRAINT ejercicios_nombre_unico UNIQUE (nombre);

ALTER TABLE public.ejercicios
  ADD CONSTRAINT ejercicios_nombre_no_vacio CHECK (nombre <> '');

ALTER TABLE public.ejercicios
  ADD CONSTRAINT ejercicios_grupo_no_vacio CHECK (grupo_muscular <> '');

GRANT ALL ON public.ejercicios TO anon;
GRANT ALL ON public.ejercicios TO authenticated;
GRANT ALL ON public.ejercicios TO service_role;

-- Splits (programas de entrenamiento del usuario)
CREATE TABLE public.splits (
  id_split    integer                  GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_usuario  integer                  NOT NULL,
  nombre      character varying(50)    NOT NULL,
  es_activo   boolean                  DEFAULT FALSE NOT NULL
);

ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.splits
  ADD CONSTRAINT splits_pkey PRIMARY KEY (id_split);

ALTER TABLE public.splits
  ADD CONSTRAINT splits_nombre_no_vacio CHECK (nombre <> '');

ALTER TABLE public.splits
  ADD CONSTRAINT fk_split_usuario
  FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

-- Solo un split activo por usuario
CREATE UNIQUE INDEX splits_uno_activo_por_usuario
  ON public.splits (id_usuario)
  WHERE es_activo;

GRANT ALL ON public.splits TO anon;
GRANT ALL ON public.splits TO authenticated;
GRANT ALL ON public.splits TO service_role;

-- Sesiones_plan (días del molde dentro de un split)
CREATE TABLE public.sesiones_plan (
  id_sesion_plan  integer                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_split        integer                   NOT NULL,
  nombre_sesion   character varying(50)     NOT NULL,
  dia_asignado    smallint                  NOT NULL
);

ALTER TABLE public.sesiones_plan ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sesiones_plan
  ADD CONSTRAINT sesiones_plan_pkey PRIMARY KEY (id_sesion_plan);

ALTER TABLE public.sesiones_plan
  ADD CONSTRAINT sesiones_plan_dia_valido CHECK (dia_asignado BETWEEN 1 AND 7);

ALTER TABLE public.sesiones_plan
  ADD CONSTRAINT sesiones_plan_nombre_no_vacio CHECK (nombre_sesion <> '');

ALTER TABLE public.sesiones_plan
  ADD CONSTRAINT fk_sesion_plan_split
  FOREIGN KEY (id_split) REFERENCES public.splits(id_split) ON DELETE CASCADE;

ALTER TABLE public.sesiones_plan
  ADD CONSTRAINT sesiones_plan_split_dia_unico UNIQUE (id_split, dia_asignado);

GRANT ALL ON public.sesiones_plan TO anon;
GRANT ALL ON public.sesiones_plan TO authenticated;
GRANT ALL ON public.sesiones_plan TO service_role;

-- Ejercicios por sesión (receta de cada día del molde)
CREATE TABLE public.ejercicios_por_sesion (
  id_ejercicio_sesion  integer    GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_sesion_plan       integer    NOT NULL,
  id_ejercicio         integer    NOT NULL,
  orden                smallint   NOT NULL
);

ALTER TABLE public.ejercicios_por_sesion ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ejercicios_por_sesion
  ADD CONSTRAINT ejercicios_por_sesion_pkey PRIMARY KEY (id_ejercicio_sesion);

ALTER TABLE public.ejercicios_por_sesion
  ADD CONSTRAINT ejercicios_por_sesion_orden_positivo CHECK (orden > 0);

ALTER TABLE public.ejercicios_por_sesion
  ADD CONSTRAINT fk_ejercicio_sesion_plan
  FOREIGN KEY (id_sesion_plan) REFERENCES public.sesiones_plan(id_sesion_plan) ON DELETE CASCADE;

ALTER TABLE public.ejercicios_por_sesion
  ADD CONSTRAINT fk_ejercicio_sesion_ejercicio
  FOREIGN KEY (id_ejercicio) REFERENCES public.ejercicios(id_ejercicio) ON DELETE RESTRICT;

ALTER TABLE public.ejercicios_por_sesion
  ADD CONSTRAINT ejercicios_por_sesion_orden_unico UNIQUE (id_sesion_plan, orden);

ALTER TABLE public.ejercicios_por_sesion
  ADD CONSTRAINT ejercicios_por_sesion_ejercicio_unico UNIQUE (id_sesion_plan, id_ejercicio);

CREATE INDEX IF NOT EXISTS idx_ejercicios_por_sesion_ejercicio
  ON public.ejercicios_por_sesion (id_ejercicio);

GRANT ALL ON public.ejercicios_por_sesion TO anon;
GRANT ALL ON public.ejercicios_por_sesion TO authenticated;
GRANT ALL ON public.ejercicios_por_sesion TO service_role;

-- Entrenamientos (la ida real al gimnasio)
CREATE TABLE public.entrenamientos_historial (
  id_entrenamiento  integer         GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_usuario        integer         NOT NULL,
  id_sesion_plan    integer         NOT NULL,
  fecha_inicio      timestamptz     DEFAULT now() NOT NULL,
  fecha_fin         timestamptz     NULL
);

ALTER TABLE public.entrenamientos_historial ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.entrenamientos_historial
  ADD CONSTRAINT entrenamientos_historial_pkey PRIMARY KEY (id_entrenamiento);

ALTER TABLE public.entrenamientos_historial
  ADD CONSTRAINT entrenamientos_fecha_fin_posterior
  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

ALTER TABLE public.entrenamientos_historial
  ADD CONSTRAINT fk_entrenamiento_usuario
  FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

-- RESTRICT: no se puede borrar un día del molde con entrenamientos registrados
ALTER TABLE public.entrenamientos_historial
  ADD CONSTRAINT fk_entrenamiento_sesion_plan
  FOREIGN KEY (id_sesion_plan) REFERENCES public.sesiones_plan(id_sesion_plan) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_entrenamientos_usuario_fecha
  ON public.entrenamientos_historial (id_usuario, fecha_inicio DESC);

CREATE INDEX IF NOT EXISTS idx_entrenamientos_sesion_plan
  ON public.entrenamientos_historial (id_sesion_plan);

GRANT ALL ON public.entrenamientos_historial TO anon;
GRANT ALL ON public.entrenamientos_historial TO authenticated;
GRANT ALL ON public.entrenamientos_historial TO service_role;

-- Series (métrica granular: peso, reps, progresión)
CREATE TABLE public.series_historial (
  id_serie          integer              GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_entrenamiento  integer              NOT NULL,
  id_ejercicio      integer              NOT NULL,
  numero_serie      smallint             NOT NULL,
  repeticiones      integer              NOT NULL,
  peso              numeric(7,2)         NOT NULL,
  unidad_peso       public.unidad_peso   NOT NULL
);

ALTER TABLE public.series_historial ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.series_historial
  ADD CONSTRAINT series_historial_pkey PRIMARY KEY (id_serie);

ALTER TABLE public.series_historial
  ADD CONSTRAINT series_historial_numero_positivo CHECK (numero_serie > 0);

ALTER TABLE public.series_historial
  ADD CONSTRAINT series_historial_reps_positivas CHECK (repeticiones > 0);

ALTER TABLE public.series_historial
  ADD CONSTRAINT series_historial_peso_positivo CHECK (peso > 0);

ALTER TABLE public.series_historial
  ADD CONSTRAINT fk_serie_entrenamiento
  FOREIGN KEY (id_entrenamiento) REFERENCES public.entrenamientos_historial(id_entrenamiento) ON DELETE CASCADE;

-- RESTRICT: no se puede borrar un ejercicio del catálogo con historial (PRs)
ALTER TABLE public.series_historial
  ADD CONSTRAINT fk_serie_ejercicio
  FOREIGN KEY (id_ejercicio) REFERENCES public.ejercicios(id_ejercicio) ON DELETE RESTRICT;

-- La numeración de series es por ejercicio dentro del entrenamiento
ALTER TABLE public.series_historial
  ADD CONSTRAINT series_historial_entrenamiento_ejercicio_serie_unico
  UNIQUE (id_entrenamiento, id_ejercicio, numero_serie);

CREATE INDEX IF NOT EXISTS idx_series_entrenamiento
  ON public.series_historial (id_entrenamiento);

-- Consultas directas de PR / último peso por ejercicio (sin JOINs)
CREATE INDEX IF NOT EXISTS idx_series_ejercicio_peso
  ON public.series_historial (id_ejercicio, peso DESC);

GRANT ALL ON public.series_historial TO anon;
GRANT ALL ON public.series_historial TO authenticated;
GRANT ALL ON public.series_historial TO service_role;
