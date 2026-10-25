-- Actividades con múltiples avisos
CREATE TABLE public.actividades_recordatorios (
    id_recordatorio integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    id_actividad integer NOT NULL,
    id_usuario integer NOT NULL,
    fecha_recordatorio date NOT NULL,
    enviado boolean DEFAULT false,
    fecha_envio timestamp with time zone
);

ALTER TABLE ONLY public.actividades_recordatorios
    ADD CONSTRAINT actividades_recordatorios_pkey PRIMARY KEY (id_recordatorio);

ALTER TABLE ONLY public.actividades_recordatorios
    ADD CONSTRAINT fk_actividades_recordatorios_actividad FOREIGN KEY (id_actividad)
    REFERENCES public.actividades(id_actividad) ON DELETE CASCADE;

ALTER TABLE ONLY public.actividades_recordatorios
    ADD CONSTRAINT fk_actividades_recordatorios_usuario FOREIGN KEY (id_usuario)
    REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

CREATE UNIQUE INDEX idx_actividades_recordatorios_unico
    ON public.actividades_recordatorios (id_actividad, fecha_recordatorio);

CREATE INDEX idx_actividades_recordatorios_pendientes
    ON public.actividades_recordatorios (enviado, fecha_recordatorio);

ALTER TABLE public.actividades_recordatorios ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.actividades_recordatorios TO anon;
GRANT ALL ON public.actividades_recordatorios TO authenticated;
GRANT ALL ON public.actividades_recordatorios TO service_role;
