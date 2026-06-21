-- 008_vacunas_campos_extra
-- Agrega nombre_personalizado y observaciones a la tabla vacunas
-- para soportar vacunas personalizadas (catálogo "Otra") y notas adicionales.

ALTER TABLE public.vacunas
  ADD COLUMN IF NOT EXISTS nombre_personalizado VARCHAR(100),
  ADD COLUMN IF NOT EXISTS observaciones TEXT;
