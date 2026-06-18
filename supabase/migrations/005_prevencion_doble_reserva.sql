-- 005_prevencion_doble_reserva
-- Exclusion constraint para evitar solapamiento de citas del mismo veterinario.
-- Reemplaza el índice único por fecha_hora exacta con un constraint de rangos.
-- Estados que bloquean: confirmed, in_progress
-- Estados que NO bloquean: scheduled, completed, cancelled, no_show

-- 1. Extensión btree_gist para operador = con UUID en exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Actualizar CHECK de estado (6 estados en lugar de 4)
ALTER TABLE public.citas
  DROP CONSTRAINT IF EXISTS citas_estado_check;

ALTER TABLE public.citas
  ADD CONSTRAINT ck_citas_estado
  CHECK (estado IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show'));

-- 3. Actualizar CHECK de motivo_cancelacion (estado 'cancelled' en lugar de 'cancelada')
ALTER TABLE public.citas
  DROP CONSTRAINT IF EXISTS citas_motivo_cancelacion_check;

ALTER TABLE public.citas
  ADD CONSTRAINT ck_citas_motivo_cancelacion
  CHECK (motivo_cancelacion IS NULL OR estado = 'cancelled');

-- 4. Agregar columna observaciones
ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 5. Columna rango_horario (regular, no generada — PostgreSQL exige inmutabilidad
--    para columnas generadas, pero tstzrange no es inmutable).
ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS rango_horario TSTZRANGE;

-- 5b. Backfill rango_horario para filas existentes
UPDATE public.citas
  SET rango_horario = tstzrange(fecha_hora, fecha_hora + (duracion_minutos * interval '1 minute'))
  WHERE rango_horario IS NULL;

-- 5c. NOT NULL constraint (después del backfill)
ALTER TABLE public.citas
  ALTER COLUMN rango_horario SET NOT NULL;

-- 5d. Función trigger para mantener rango_horario sincronizado
CREATE OR REPLACE FUNCTION public.actualizar_rango_horario()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rango_horario = tstzrange(NEW.fecha_hora, NEW.fecha_hora + (NEW.duracion_minutos * interval '1 minute'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5e. Trigger BEFORE INSERT OR UPDATE para mantener rango_horario
DROP TRIGGER IF EXISTS trg_actualizar_rango_horario ON public.citas;
CREATE TRIGGER trg_actualizar_rango_horario
  BEFORE INSERT OR UPDATE OF fecha_hora, duracion_minutos
  ON public.citas
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_rango_horario();

-- 6. Exclusion constraint: solapamiento de rangos
-- Usa GiST con btree_gist para operadores = con UUID y && con TSTZRANGE
ALTER TABLE public.citas
  ADD CONSTRAINT excl_citas_solapamiento
  EXCLUDE USING gist (
    clinic_id WITH =,
    veterinario_id WITH =,
    rango_horario WITH &&
  )
  WHERE (estado IN ('confirmed', 'in_progress'));

-- 7. El índice parcial para doble reserva ya no es necesario
-- (el exclusion constraint lo reemplaza con mayor precisión)
DROP INDEX IF EXISTS idx_citas_doble_reserva;

-- 8. Nota: los índices existentes idx_citas_fecha_hora, idx_citas_estado,
--    idx_citas_veterinario_fecha se mantienen para performance en consultas.
