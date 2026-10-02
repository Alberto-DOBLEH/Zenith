-- Módulo de gimnasio (complemento)
-- 1) Seed del catálogo universal de ejercicios (~43 comunes)
-- 2) Índice parcial: un solo entrenamiento activo (sin finalizar) por usuario

INSERT INTO public.ejercicios (nombre, grupo_muscular) VALUES
  -- Pecho
  ('Press Banca', 'Pecho'),
  ('Press Banca con mancuernas', 'Pecho'),
  ('Press inclinado con barra', 'Pecho'),
  ('Aperturas con mancuernas', 'Pecho'),
  ('Fondos en paralelas', 'Pecho'),
  ('Cruzadas en polea', 'Pecho'),
  -- Espalda
  ('Remo con barra', 'Espalda'),
  ('Remo con mancuerna', 'Espalda'),
  ('Jalón al pecho', 'Espalda'),
  ('Jalón al pecho agarre cerrado', 'Espalda'),
  ('Remo en polea baja', 'Espalda'),
  ('Peso muerto', 'Espalda'),
  ('Pull over', 'Espalda'),
  ('Dominadas', 'Espalda'),
  -- Pierna
  ('Sentadilla con barra', 'Pierna'),
  ('Press de piernas', 'Pierna'),
  ('Sentadilla búlgara', 'Pierna'),
  ('Prensa 45', 'Pierna'),
  ('Extensión de cuádriceps', 'Pierna'),
  ('Curl femoral acostado', 'Pierna'),
  ('Curl femoral sentado', 'Pierna'),
  ('Zancadas con mancuernas', 'Pierna'),
  ('Hip thrust', 'Pierna'),
  ('Elevación de gemelos', 'Pierna'),
  -- Hombro
  ('Press militar con barra', 'Hombro'),
  ('Press militar con mancuernas', 'Hombro'),
  ('Elevaciones laterales', 'Hombro'),
  ('Elevaciones frontales', 'Hombro'),
  ('Pájaros', 'Hombro'),
  ('Remo al mentón', 'Hombro'),
  -- Brazo
  ('Curl de bíceps con barra', 'Brazo'),
  ('Curl martillo', 'Brazo'),
  ('Curl en predicador', 'Brazo'),
  ('Curl de bíceps en polea', 'Brazo'),
  ('Extensión de tríceps en polea', 'Brazo'),
  ('Press francés', 'Brazo'),
  ('Extensión de tríceps tras nuca', 'Brazo'),
  ('Curl de bíceps con mancuerna', 'Brazo'),
  -- Core
  ('Plancha abdominal', 'Core'),
  ('Crunch en máquina', 'Core'),
  ('Elevación de piernas acostado', 'Core'),
  ('Rueda abdominal', 'Core'),
  ('Giros rusos', 'Core')
ON CONFLICT (nombre) DO NOTHING;

-- Solo un entrenamiento sin finalizar por usuario (backstop del servicio)
CREATE UNIQUE INDEX IF NOT EXISTS entrenamientos_uno_activo_por_usuario
  ON public.entrenamientos_historial (id_usuario)
  WHERE fecha_fin IS NULL;
