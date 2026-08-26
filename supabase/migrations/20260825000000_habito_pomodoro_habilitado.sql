-- Agregar columna para indicar si un hábito de tiempo tiene Pomodoro habilitado
ALTER TABLE public.habitos
  ADD COLUMN IF NOT EXISTS pomodoro_habilitado boolean DEFAULT false NOT NULL;
