-- Verificación de correo electrónico
-- 1) Agregar columna email_verificado a usuarios
-- 2) Crear tabla tokens_verificacion para almacenar tokens temporales

-- Columna para indicar si el correo fue verificado
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

-- Tabla de tokens de verificación
CREATE TABLE IF NOT EXISTS public.tokens_verificacion (
  id SERIAL PRIMARY KEY,
  usuario INTEGER NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiracion TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_tokens_verificacion_token ON public.tokens_verificacion(token);

-- Índice para limpiar tokens expirados
CREATE INDEX IF NOT EXISTS idx_tokens_verificacion_expiracion ON public.tokens_verificacion(expiracion);

-- Hacer teléfono opcional (quitar NOT NULL)
ALTER TABLE public.usuarios
  ALTER COLUMN telefono DROP NOT NULL;
