-- ============================================================================
-- Vetyx.io — Fix: SECURITY DEFINER en get_user_clinic_id()
-- Versión: 1.0
-- Fecha: 2026-06-16
-- Motivo: Sin SECURITY DEFINER, la función causa recursión infinita en RLS
--         porque al consultar usuarios desde una policy que también usa
--         get_user_clinic_id(), se crea un loop infinito.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT clinic_id FROM public.usuarios WHERE id = auth.uid()
$$;
