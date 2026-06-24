-- ============================================================================
-- Vetyx.io — Migración 011: Tabla clinic_memberships
-- Versión: 1.0
-- Fecha: 2026-06-23
-- Motivo: Separar identidad de membresía. Un usuario (dueño) puede ser staff
--         o cliente de una o más clínicas. Tabla nueva permite relaciones
--         N:N entre usuarios y clínicas sin modificar usuaios.clinic_id.
-- ============================================================================

-- 1. Crear tabla
-- ============================================================================
CREATE TABLE public.clinic_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('staff', 'cliente')),
  rol VARCHAR(20) CHECK (rol IS NULL OR rol IN ('admin', 'vet', 'recepcionista')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_membership_user_clinic UNIQUE (user_id, clinic_id),
  CONSTRAINT ck_membership_tipo_rol CHECK (
    (tipo = 'staff' AND rol IS NOT NULL)
    OR (tipo = 'cliente' AND rol IS NULL)
  )
);

COMMENT ON TABLE public.clinic_memberships IS 'Relación usuario-clínica. Una persona tiene 1 fila en usuarios y N filas aquí.';
COMMENT ON COLUMN public.clinic_memberships.tipo IS 'staff = miembro del equipo con rol, cliente = dueño de mascota vinculado';
COMMENT ON COLUMN public.clinic_memberships.rol IS 'Solo para staff: admin, vet, recepcionista';

-- 2. Trigger updated_at
-- ============================================================================
CREATE TRIGGER trg_clinic_memberships_set_updated_at
  BEFORE UPDATE ON public.clinic_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. RLS
-- ============================================================================
ALTER TABLE public.clinic_memberships ENABLE ROW LEVEL SECURITY;

-- 3.1 Cualquier usuario ve sus propias membresías
CREATE POLICY memberships_select_own ON public.clinic_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- 3.2 Staff de una clínica ve todas las membresías de esa clínica
--     (usa get_user_clinic_id() que es SECURITY DEFINER → sin recursión)
CREATE POLICY memberships_select_staff ON public.clinic_memberships
  FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

-- 3.3 Admin puede insertar membresías en su clínica
CREATE POLICY memberships_insert_admin ON public.clinic_memberships
  FOR INSERT
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol = 'admin' AND activo = true
    )
  );

-- 3.4 Admin puede actualizar membresías en su clínica
CREATE POLICY memberships_update_admin ON public.clinic_memberships
  FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol = 'admin' AND activo = true
    )
  );

-- 3.5 Admin puede eliminar membresías (soft delete via activo = false,
--     pero se permite DELETE para limpieza administrativa)
CREATE POLICY memberships_delete_admin ON public.clinic_memberships
  FOR DELETE
  USING (
    clinic_id = public.get_user_clinic_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol = 'admin' AND activo = true
    )
  );

-- 4. Índices
-- ============================================================================
CREATE INDEX idx_memberships_user_id ON public.clinic_memberships (user_id) WHERE activo = true;
CREATE INDEX idx_memberships_clinic_id ON public.clinic_memberships (clinic_id) WHERE activo = true;
CREATE INDEX idx_memberships_clinic_tipo ON public.clinic_memberships (clinic_id, tipo) WHERE activo = true;

-- 5. Backfill: migrar staff existente desde usuarios a clinic_memberships
-- ============================================================================
INSERT INTO public.clinic_memberships (user_id, clinic_id, tipo, rol)
SELECT id, clinic_id, 'staff', rol
FROM public.usuarios
WHERE clinic_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.clinic_memberships cm
    WHERE cm.user_id = usuarios.id AND cm.clinic_id = usuarios.clinic_id
  );

-- 6. Verificación (opcional, comentado)
-- ============================================================================
-- SELECT u.email, u.rol, cm.tipo, cm.rol AS membership_rol
-- FROM public.usuarios u
-- LEFT JOIN public.clinic_memberships cm ON cm.user_id = u.id
-- ORDER BY u.email;
