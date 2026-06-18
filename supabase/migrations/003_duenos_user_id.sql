-- ============================================================================
-- Vetyx.io — Agrega columna user_id a dueños para futuro portal de clientes
-- Versión: 1.0
-- Fecha: 2026-06-17
-- Motivo: Preparar la base para que dueños de mascotas puedan tener cuenta
--         de usuario y eventualmente acceder a un portal de cliente.
-- ============================================================================

ALTER TABLE public.duenos
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_duenos_user_id ON public.duenos(user_id);

-- Policy para que un dueño pueda ver su propio registro (futuro portal).
-- No interfiere con las policies actuales de tenant_isolation porque RLS
-- usa OR entre policies del mismo tipo.
CREATE POLICY duenos_select_propio ON public.duenos
  FOR SELECT
  USING (user_id = auth.uid());
