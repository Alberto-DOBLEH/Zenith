-- Préstamos
CREATE TYPE public.tipo_prestamo AS ENUM ('ME_PRESTAN', 'PRESTO');
CREATE TYPE public.estado_prestamo AS ENUM ('ACTIVO', 'LIQUIDADO');

CREATE TABLE public.prestamos (
    id_prestamo integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    id_usuario integer NOT NULL,
    tipo public.tipo_prestamo NOT NULL,
    persona character varying(100) NOT NULL,
    concepto character varying(150),
    monto_total numeric(12,2) NOT NULL,
    saldo_pendiente numeric(12,2) NOT NULL,
    fecha date NOT NULL,
    id_metodo_pago integer NOT NULL,
    estado public.estado_prestamo DEFAULT 'ACTIVO'::public.estado_prestamo NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT prestamos_monto_total_check CHECK ((monto_total > 0::numeric)),
    CONSTRAINT prestamos_saldo_pendiente_check CHECK ((saldo_pendiente >= 0::numeric))
);

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_pkey PRIMARY KEY (id_prestamo);

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT fk_prestamo_usuario FOREIGN KEY (id_usuario)
    REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT fk_prestamo_metodo FOREIGN KEY (id_metodo_pago)
    REFERENCES public.metodos_pago(id_metodo) ON DELETE RESTRICT;

CREATE INDEX idx_prestamos_usuario_tipo_estado ON public.prestamos (id_usuario, tipo, estado);
CREATE INDEX idx_prestamos_fecha ON public.prestamos (fecha);

ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.prestamos TO anon;
GRANT ALL ON public.prestamos TO authenticated;
GRANT ALL ON public.prestamos TO service_role;

-- Pagos/abonos de préstamos
CREATE TABLE public.prestamos_pagos (
    id_pago_prestamo integer GENERATED ALWAYS AS IDENTITY NOT NULL,
    id_prestamo integer NOT NULL,
    id_usuario integer NOT NULL,
    monto numeric(12,2) NOT NULL,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    id_metodo_pago integer NOT NULL,
    id_movimiento integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT prestamos_pagos_monto_check CHECK ((monto > 0::numeric))
);

ALTER TABLE ONLY public.prestamos_pagos
    ADD CONSTRAINT prestamos_pagos_pkey PRIMARY KEY (id_pago_prestamo);

ALTER TABLE ONLY public.prestamos_pagos
    ADD CONSTRAINT fk_prestamo_pago_prestamo FOREIGN KEY (id_prestamo)
    REFERENCES public.prestamos(id_prestamo) ON DELETE RESTRICT;

ALTER TABLE ONLY public.prestamos_pagos
    ADD CONSTRAINT fk_prestamo_pago_usuario FOREIGN KEY (id_usuario)
    REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE ONLY public.prestamos_pagos
    ADD CONSTRAINT fk_prestamo_pago_metodo FOREIGN KEY (id_metodo_pago)
    REFERENCES public.metodos_pago(id_metodo) ON DELETE RESTRICT;

ALTER TABLE ONLY public.prestamos_pagos
    ADD CONSTRAINT fk_prestamo_pago_movimiento FOREIGN KEY (id_movimiento)
    REFERENCES public.movimientos(id_movimiento) ON DELETE SET NULL;

CREATE INDEX idx_prestamos_pagos_prestamo ON public.prestamos_pagos (id_prestamo);
CREATE INDEX idx_prestamos_pagos_usuario_fecha ON public.prestamos_pagos (id_usuario, fecha);

ALTER TABLE public.prestamos_pagos ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.prestamos_pagos TO anon;
GRANT ALL ON public.prestamos_pagos TO authenticated;
GRANT ALL ON public.prestamos_pagos TO service_role;
