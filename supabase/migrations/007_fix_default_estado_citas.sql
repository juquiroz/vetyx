-- 007_fix_default_estado_citas
-- Corrige el DEFAULT de citas.estado de 'confirmada' a 'scheduled'
-- La migración 005 cambió el CHECK a 6 estados en inglés pero no actualizó
-- el DEFAULT, que seguía siendo 'confirmada' (español del schema original 001).
-- Esto causaba que cualquier INSERT sin estado explícito violara el CHECK.

ALTER TABLE public.citas
  ALTER COLUMN estado SET DEFAULT 'scheduled';
