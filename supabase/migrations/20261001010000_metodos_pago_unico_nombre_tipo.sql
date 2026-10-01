-- Métodos de pago: permitir el mismo nombre con distinto tipo
-- (ej. dos "Banamex", uno DEBITO y otro CREDITO)
-- Antes la restricción era UNIQUE(id_usuario, nombre), lo que bloqueaba ese caso.

ALTER TABLE public.metodos_pago
  DROP CONSTRAINT IF EXISTS metodos_pago_usuario_nombre_unico;

ALTER TABLE public.metodos_pago
  ADD CONSTRAINT metodos_pago_usuario_nombre_tipo_unico UNIQUE (id_usuario, nombre, tipo);
