-- 006_zona_horaria_clinicas
-- Agrega zona_horaria por clínica para validación de horario laboral

ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS zona_horaria VARCHAR(64) DEFAULT 'America/Mexico_City' NOT NULL;

-- Actualizar clínicas existentes con el valor por defecto
UPDATE public.clinicas SET zona_horaria = 'America/Mexico_City' WHERE zona_horaria IS NULL;
