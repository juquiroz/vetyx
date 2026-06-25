-- ============================================================================
-- Vetyx.io — Migración 012: Expandir CHECK constraint en historial_medico.tipo
-- Versión: 1.0
-- Fecha: 2026-06-23
-- Motivo: La migración 001 solo permitía 'consulta' y 'cirugia', pero la UI
--         y Zod aceptan 6 tipos. Sincronizar BD con el frontend.
-- ============================================================================

ALTER TABLE public.historial_medico
  DROP CONSTRAINT IF EXISTS historial_medico_tipo_check,
  ADD CONSTRAINT historial_medico_tipo_check
    CHECK (tipo IN ('consulta', 'cirugia', 'hospitalizacion', 'control', 'procedimiento', 'otro'));
