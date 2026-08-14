-- Reconciliación del esquema remoto con el backend (bcrypt + JWT)
-- 1) contraseña: columna necesaria para autenticación backend (bcrypt)
-- 2) pais: solicitado en Docs/pantallas-pensadas.md (tarjeta de información de usuario)

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS contraseña character varying(255) NOT NULL DEFAULT '';

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS pais character varying(50);

-- Catálogos iniciales
-- Tipos de hábitos (el id autogenerado corresponde al orden: 1=Normal, 2=Tiempo, 3=Repetición, 4=Evitado)
INSERT INTO public.tipos_habitos (nombre) VALUES
  ('Normal'),
  ('Tiempo'),
  ('Repeticion'),
  ('Evitado')
ON CONFLICT (nombre) DO NOTHING;

-- Catálogo base de avatares
INSERT INTO public.avatares (nombre, ruta_imagen) VALUES
  ('Avatar 1', '/assets/avatares/av-1.png'),
  ('Avatar 2', '/assets/avatares/av-2.png'),
  ('Avatar 3', '/assets/avatares/av-3.png'),
  ('Avatar 4', '/assets/avatares/av-4.png'),
  ('Avatar 5', '/assets/avatares/av-5.png'),
  ('Avatar 6', '/assets/avatares/av-6.png')
ON CONFLICT (id_avatar) DO NOTHING;
