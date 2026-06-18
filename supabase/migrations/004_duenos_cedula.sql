-- 004_duenos_cedula
-- Agrega columna cedula a duenos para identificación fiscal/personal.
-- La cédula es opcional pero única dentro de la clínica cuando se ingresa.

ALTER TABLE public.duenos ADD COLUMN cedula VARCHAR(50);

-- CHECK: si se ingresa, formato alfanumérico básico con guiones
ALTER TABLE public.duenos
  ADD CONSTRAINT ck_duenos_cedula CHECK (
    cedula IS NULL OR cedula ~ '^[A-Za-z0-9-]+$'
  );

-- Índice para búsquedas por cédula dentro de la clínica
CREATE INDEX idx_duenos_clinic_id_cedula ON public.duenos (clinic_id, cedula);
