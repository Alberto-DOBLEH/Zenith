-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE TYPE public.dia_semana AS ENUM (
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO'
);

CREATE TYPE public.estado_frecuencia AS ENUM (
  'DIARIO',
  'SEMANAL',
  'MENSUAL'
);

CREATE TYPE public.estado_registro_habito AS ENUM (
  'COMPLETADO',
  'PARCIAL',
  'NO_COMPLETADO',
  'EVITADO',
  'RECAIDA'
);

CREATE TYPE public.estado_usuario AS ENUM (
  'ACTIVO',
  'INACTIVO'
);

CREATE TABLE public.avatares (
  id_avatar   integer                GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre      character varying(50)  NOT NULL,
  ruta_imagen character varying(255) NOT NULL
);

ALTER TABLE public.avatares
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.avatares
  ADD CONSTRAINT avatares_pkey PRIMARY KEY (id_avatar);

GRANT ALL ON public.avatares TO anon;

GRANT ALL ON public.avatares TO authenticated;

GRANT ALL ON public.avatares TO service_role;

CREATE TABLE public.eventos (
  id_evento    integer                     GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuario      integer                     NOT NULL,
  titulo       character varying(100)      NOT NULL,
  descripcion  character varying(500),
  fecha_inicio timestamp without time zone NOT NULL,
  fecha_fin    timestamp without time zone NOT NULL,
  color        character varying(20)
);

ALTER TABLE public.eventos
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_fechas_check CHECK (fecha_fin >= fecha_inicio);

ALTER TABLE public.eventos
  ADD CONSTRAINT eventos_pkey PRIMARY KEY (id_evento);

GRANT ALL ON public.eventos TO anon;

GRANT ALL ON public.eventos TO authenticated;

GRANT ALL ON public.eventos TO service_role;

CREATE TABLE public.habito_dias (
  habito integer           NOT NULL,
  dia    public.dia_semana NOT NULL
);

ALTER TABLE public.habito_dias
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.habito_dias
  ADD CONSTRAINT habito_dias_pkey PRIMARY KEY (habito, dia);

GRANT ALL ON public.habito_dias TO anon;

GRANT ALL ON public.habito_dias TO authenticated;

GRANT ALL ON public.habito_dias TO service_role;

CREATE TABLE public.habitos (
  id_habito      integer                     GENERATED ALWAYS AS IDENTITY NOT NULL,
  tipo_habito    integer                     NOT NULL,
  usuario        integer                     NOT NULL,
  nombre         character varying(100)      NOT NULL,
  descripcion    character varying(255),
  frecuencia     public.estado_frecuencia    DEFAULT 'DIARIO'::public.estado_frecuencia NOT NULL,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  estado         public.estado_usuario       DEFAULT 'ACTIVO'::public.estado_usuario NOT NULL,
  meta           numeric(10,2),
  unidad         character varying(50),
  dia_del_mes    smallint
);

ALTER TABLE public.habitos
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.habitos
  ADD CONSTRAINT habitos_dia_del_mes_check CHECK (dia_del_mes IS NULL OR dia_del_mes >= 1 AND dia_del_mes <= 31);

ALTER TABLE public.habitos
  ADD CONSTRAINT habitos_meta_check CHECK (meta IS NULL OR meta > 0::numeric);

ALTER TABLE public.habitos
  ADD CONSTRAINT habitos_pkey PRIMARY KEY (id_habito);

ALTER TABLE public.habito_dias
  ADD CONSTRAINT fk_habito_dias_habito FOREIGN KEY (habito) REFERENCES public.habitos(id_habito) ON DELETE CASCADE;

GRANT ALL ON public.habitos TO anon;

GRANT ALL ON public.habitos TO authenticated;

GRANT ALL ON public.habitos TO service_role;

CREATE TABLE public.notas (
  id_nota            integer                     GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuario            integer                     NOT NULL,
  fecha              date                        NOT NULL,
  contenido          character varying(1000)     NOT NULL,
  fecha_creacion     timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_modificacion timestamp without time zone
);

ALTER TABLE public.notas
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notas
  ADD CONSTRAINT notas_pkey PRIMARY KEY (id_nota);

ALTER TABLE public.notas
  ADD CONSTRAINT notas_unica_por_dia UNIQUE (usuario, fecha);

GRANT ALL ON public.notas TO anon;

GRANT ALL ON public.notas TO authenticated;

GRANT ALL ON public.notas TO service_role;

CREATE TABLE public.recordatorios_evento (
  id_recordatorio    integer                     GENERATED ALWAYS AS IDENTITY NOT NULL,
  evento             integer                     NOT NULL,
  fecha_recordatorio timestamp without time zone NOT NULL
);

ALTER TABLE public.recordatorios_evento
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.recordatorios_evento
  ADD CONSTRAINT fk_recordatorio_evento FOREIGN KEY (evento) REFERENCES public.eventos(id_evento) ON DELETE CASCADE;

ALTER TABLE public.recordatorios_evento
  ADD CONSTRAINT recordatorios_evento_pkey PRIMARY KEY (id_recordatorio);

GRANT ALL ON public.recordatorios_evento TO anon;

GRANT ALL ON public.recordatorios_evento TO authenticated;

GRANT ALL ON public.recordatorios_evento TO service_role;

CREATE TABLE public.registro_habitos (
  id_registro_habito integer                       GENERATED ALWAYS AS IDENTITY NOT NULL,
  habito             integer                       NOT NULL,
  fecha              date                          NOT NULL,
  estado             public.estado_registro_habito DEFAULT 'NO_COMPLETADO'::public.estado_registro_habito NOT NULL,
  valor_realizado    numeric(10,2),
  fecha_inicio       timestamp without time zone,
  fecha_completado   timestamp without time zone
);

ALTER TABLE public.registro_habitos
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.registro_habitos
  ADD CONSTRAINT fk_registro_habito FOREIGN KEY (habito) REFERENCES public.habitos(id_habito) ON DELETE CASCADE;

ALTER TABLE public.registro_habitos
  ADD CONSTRAINT registro_habitos_pkey PRIMARY KEY (id_registro_habito);

ALTER TABLE public.registro_habitos
  ADD CONSTRAINT registro_habitos_unico_por_dia UNIQUE (habito, fecha);

ALTER TABLE public.registro_habitos
  ADD CONSTRAINT registro_habitos_valor_check CHECK (valor_realizado IS NULL OR valor_realizado >= 0::numeric);

GRANT ALL ON public.registro_habitos TO anon;

GRANT ALL ON public.registro_habitos TO authenticated;

GRANT ALL ON public.registro_habitos TO service_role;

CREATE TABLE public.sesiones_pomodoro (
  id_sesion          integer                     GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuario            integer                     NOT NULL,
  habito             integer,
  fecha_inicio       timestamp without time zone NOT NULL,
  fecha_fin          timestamp without time zone,
  minutos_objetivo   integer                     NOT NULL,
  minutos_realizados integer                     DEFAULT 0 NOT NULL,
  ciclos_objetivo    integer                     NOT NULL,
  ciclos_completados integer                     DEFAULT 0 NOT NULL
);

ALTER TABLE public.sesiones_pomodoro
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sesiones_pomodoro
  ADD CONSTRAINT fk_sesion_habito FOREIGN KEY (habito) REFERENCES public.habitos(id_habito) ON DELETE SET NULL;

ALTER TABLE public.sesiones_pomodoro
  ADD CONSTRAINT sesiones_ciclos_completados_check CHECK (ciclos_completados >= 0);

ALTER TABLE public.sesiones_pomodoro
  ADD CONSTRAINT sesiones_ciclos_objetivo_check CHECK (ciclos_objetivo > 0);

ALTER TABLE public.sesiones_pomodoro
  ADD CONSTRAINT sesiones_minutos_objetivo_check CHECK (minutos_objetivo > 0);

ALTER TABLE public.sesiones_pomodoro
  ADD CONSTRAINT sesiones_minutos_realizados_check CHECK (minutos_realizados >= 0);

ALTER TABLE public.sesiones_pomodoro
  ADD CONSTRAINT sesiones_pomodoro_pkey PRIMARY KEY (id_sesion);

GRANT ALL ON public.sesiones_pomodoro TO anon;

GRANT ALL ON public.sesiones_pomodoro TO authenticated;

GRANT ALL ON public.sesiones_pomodoro TO service_role;

CREATE TABLE public.tipos_habitos (
  id_tipo_habito integer               GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre         character varying(20) NOT NULL
);

ALTER TABLE public.tipos_habitos
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tipos_habitos
  ADD CONSTRAINT tipos_habitos_nombre_unico UNIQUE (nombre);

ALTER TABLE public.tipos_habitos
  ADD CONSTRAINT tipos_habitos_pkey PRIMARY KEY (id_tipo_habito);

ALTER TABLE public.habitos
  ADD CONSTRAINT fk_habito_tipo FOREIGN KEY (tipo_habito) REFERENCES public.tipos_habitos(id_tipo_habito);

GRANT ALL ON public.tipos_habitos TO anon;

GRANT ALL ON public.tipos_habitos TO authenticated;

GRANT ALL ON public.tipos_habitos TO service_role;

CREATE TABLE public.usuarios (
  id_usuario       integer                GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre           character varying(30)  NOT NULL,
  primer_apellido  character varying(30)  NOT NULL,
  segundo_apellido character varying(30),
  correo           character varying(100) NOT NULL,
  telefono         character varying(10)  NOT NULL,
  username         character varying(50)  NOT NULL,
  foto_perfil      character varying(255),
  avatar           integer,
  fecha_nacimiento date,
  estado           public.estado_usuario  DEFAULT 'ACTIVO'::public.estado_usuario NOT NULL
);

ALTER TABLE public.usuarios
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.usuarios
  ADD CONSTRAINT fk_usuario_avatar FOREIGN KEY (avatar) REFERENCES public.avatares(id_avatar);

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_correo_unico UNIQUE (correo);

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);

ALTER TABLE public.eventos
  ADD CONSTRAINT fk_evento_usuario FOREIGN KEY (usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE public.habitos
  ADD CONSTRAINT fk_habito_usuario FOREIGN KEY (usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE public.notas
  ADD CONSTRAINT fk_notas_usuario FOREIGN KEY (usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE public.sesiones_pomodoro
  ADD CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_telefono_unico UNIQUE (telefono);

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_username_unico UNIQUE (username);

GRANT ALL ON public.usuarios TO anon;

GRANT ALL ON public.usuarios TO authenticated;

GRANT ALL ON public.usuarios TO service_role;
