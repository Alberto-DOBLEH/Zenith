-- Actividades (tareas con fecha de entrega), control de correos enviados y
-- corrección de zona horaria de eventos/avisos.
--
-- 1) `actividades`: tareas de todo el día visibles en el Calendario.
-- 2) `correos_enviados`: dedup idempotente de los correos automáticos (resumen
--    matutino y "mañana vence"), para que un reinicio de Render no duplique
--    envíos ni los pierda.
-- 3) Eventos y avisos pasan a `timestamptz`: los valores guardados son "muro
--    local" (el frontend mandaba hora local sin offset), así que se interpretan
--    con la zona fija del proyecto antes de convertirlos a instante. Con esto
--    los cálculos dejan de depender de la timezone del servidor (Render = UTC);
--    el frontend pasa a enviar ISO UTC (con Z).
-- 4) `enviado`/`fecha_envio` de recordatorios_evento quedan como migración real
--    (antes los creaba un DO $$ en runtime desde recordatorios.job.js).

CREATE TYPE public.estado_actividad AS ENUM ('PENDIENTE', 'COMPLETADA');

CREATE TABLE public.actividades (
    id_actividad integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    usuario integer NOT NULL,
    titulo character varying(100) NOT NULL,
    descripcion character varying(500),
    fecha_limite date NOT NULL,
    estado public.estado_actividad DEFAULT 'PENDIENTE'::public.estado_actividad NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id_actividad);

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT fk_actividad_usuario FOREIGN KEY (usuario)
    REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

CREATE INDEX idx_actividades_usuario_fecha ON public.actividades (usuario, fecha_limite);

CREATE TABLE public.correos_enviados (
    id_correo integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    usuario integer NOT NULL,
    tipo character varying(40) NOT NULL,
    referencia integer DEFAULT 0 NOT NULL,
    fecha date NOT NULL,
    enviado_en timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.correos_enviados
    ADD CONSTRAINT correos_enviados_pkey PRIMARY KEY (id_correo);

ALTER TABLE ONLY public.correos_enviados
    ADD CONSTRAINT correos_enviados_unico UNIQUE (usuario, tipo, referencia, fecha);

ALTER TABLE ONLY public.correos_enviados
    ADD CONSTRAINT fk_correo_usuario FOREIGN KEY (usuario)
    REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

-- Zona horaria: los valores naive actuales son hora local (America/Monterrey).
-- El CHECK (fecha_fin >= fecha_inicio) se quita y se re-agrega porque validar la
-- conversión a mitad de camino (una columna timestamptz vs. la otra naive) viola
-- la restricción aunque el orden final se conserve.
ALTER TABLE public.eventos
    DROP CONSTRAINT eventos_fechas_check;

ALTER TABLE public.eventos
    ALTER COLUMN fecha_inicio TYPE timestamp with time zone
    USING fecha_inicio AT TIME ZONE 'America/Monterrey';

ALTER TABLE public.eventos
    ALTER COLUMN fecha_fin TYPE timestamp with time zone
    USING fecha_fin AT TIME ZONE 'America/Monterrey';

ALTER TABLE public.eventos
    ADD CONSTRAINT eventos_fechas_check CHECK (fecha_fin >= fecha_inicio);

ALTER TABLE public.recordatorios_evento
    ALTER COLUMN fecha_recordatorio TYPE timestamp with time zone
    USING fecha_recordatorio AT TIME ZONE 'America/Monterrey';

ALTER TABLE public.recordatorios_evento
    ADD COLUMN IF NOT EXISTS enviado boolean DEFAULT FALSE;

ALTER TABLE public.recordatorios_evento
    ADD COLUMN IF NOT EXISTS fecha_envio timestamp with time zone;

-- RLS habilitado sin policies (el backend entra como postgres) + GRANTs,
-- igual que el resto del esquema.
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correos_enviados ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.actividades TO anon;
GRANT ALL ON public.actividades TO authenticated;
GRANT ALL ON public.actividades TO service_role;

GRANT ALL ON public.correos_enviados TO anon;
GRANT ALL ON public.correos_enviados TO authenticated;
GRANT ALL ON public.correos_enviados TO service_role;
