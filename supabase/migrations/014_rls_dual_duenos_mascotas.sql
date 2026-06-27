-- ============================================================================
-- Vetyx.io — RLS dual para duenos y mascotas (convivencia old + new)
-- Versión: 1.0
-- Fecha: 2026-06-25
-- Motivo: Agregar rutas alternativas vía clinic_clients y clinic_patients
--          sin eliminar las rutas legacy (clinic_id). Permite que el código
--          migrado a las nuevas tablas funcione mientras el código legacy
--          sigue usando clinic_id.
-- ============================================================================

-- 1. duenos
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_duenos ON public.duenos;

CREATE POLICY tenant_isolation_duenos ON public.duenos
  FOR ALL
  USING (
    -- OLD: staff ve dueños con clinic_id de su clínica
    clinic_id = public.get_user_clinic_id()
    -- OLD: personal ve su propio dueño (clinic_id NULL)
    OR (clinic_id IS NULL AND user_id = auth.uid())
    -- NEW: staff ve dueños que son clientes de su clínica
    OR EXISTS (
      SELECT 1 FROM public.clinic_clients
      WHERE dueno_id = duenos.id
      AND clinic_id = public.get_user_clinic_id()
      AND activo = true
    )
  )
  WITH CHECK (
    -- OLD: staff creando dueño con clinic_id
    clinic_id = public.get_user_clinic_id()
    -- OLD/PERSONAL: usuario creando su propio dueño
    OR (clinic_id IS NULL AND user_id = auth.uid())
    -- NOTA: El path NEW usa service_role (admin client) para inserts,
    -- por lo que no necesita WITH CHECK aquí.
  );

-- 2. mascotas
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_mascotas ON public.mascotas;

CREATE POLICY tenant_isolation_mascotas ON public.mascotas
  FOR ALL
  USING (
    -- OLD: staff ve mascotas con clinic_id de su clínica
    clinic_id = public.get_user_clinic_id()
    -- OLD: personal ve sus propias mascotas (clinic_id NULL)
    OR (clinic_id IS NULL AND owner_id IN (
      SELECT id FROM public.duenos WHERE user_id = auth.uid()
    ))
    -- NEW: staff ve mascotas que son pacientes de su clínica
    OR EXISTS (
      SELECT 1 FROM public.clinic_patients
      WHERE mascota_id = mascotas.id
      AND clinic_id = public.get_user_clinic_id()
      AND activo = true
    )
  )
  WITH CHECK (
    -- OLD: staff creando mascota con clinic_id
    clinic_id = public.get_user_clinic_id()
    -- OLD/PERSONAL: usuario creando su propia mascota
    OR (clinic_id IS NULL AND owner_id IN (
      SELECT id FROM public.duenos WHERE user_id = auth.uid()
    ))
  );

-- 3. citas — agregar ruta cliente vía clinic_memberships + clinic_patients
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_citas ON public.citas;

CREATE POLICY tenant_isolation_citas ON public.citas
  FOR ALL
  USING (
    -- OLD: staff
    clinic_id = public.get_user_clinic_id()
    -- OLD: personal
    OR (clinic_id IS NULL AND mascota_id IN (
      SELECT id FROM public.mascotas WHERE owner_id IN (
        SELECT id FROM public.duenos WHERE user_id = auth.uid()
      )
    ))
    -- NEW: cliente ve citas de sus mascotas en clínicas donde es cliente
    OR (
      clinic_id IN (
        SELECT clinic_id FROM public.clinic_memberships
        WHERE user_id = auth.uid() AND tipo = 'cliente' AND activo = true
      )
      AND mascota_id IN (
        SELECT cp.mascota_id FROM public.clinic_patients cp
        WHERE cp.clinic_id = citas.clinic_id
        AND cp.activo = true
        AND cp.mascota_id IN (
          SELECT m.id FROM public.mascotas m
          JOIN public.duenos d ON d.id = m.owner_id
          WHERE d.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    OR (clinic_id IS NULL AND mascota_id IN (
      SELECT id FROM public.mascotas WHERE owner_id IN (
        SELECT id FROM public.duenos WHERE user_id = auth.uid()
      )
    ))
  );

-- 4. historial_medico — misma lógica
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_historial_medico ON public.historial_medico;

CREATE POLICY tenant_isolation_historial_medico ON public.historial_medico
  FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id()
    OR (clinic_id IS NULL AND mascota_id IN (
      SELECT id FROM public.mascotas WHERE owner_id IN (
        SELECT id FROM public.duenos WHERE user_id = auth.uid()
      )
    ))
    OR (
      clinic_id IN (
        SELECT clinic_id FROM public.clinic_memberships
        WHERE user_id = auth.uid() AND tipo = 'cliente' AND activo = true
      )
      AND mascota_id IN (
        SELECT cp.mascota_id FROM public.clinic_patients cp
        WHERE cp.clinic_id = historial_medico.clinic_id
        AND cp.activo = true
        AND cp.mascota_id IN (
          SELECT m.id FROM public.mascotas m
          JOIN public.duenos d ON d.id = m.owner_id
          WHERE d.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    OR (clinic_id IS NULL AND mascota_id IN (
      SELECT id FROM public.mascotas WHERE owner_id IN (
        SELECT id FROM public.duenos WHERE user_id = auth.uid()
      )
    ))
  );

-- 5. vacunas — misma lógica
-- ============================================================================
DROP POLICY IF EXISTS tenant_isolation_vacunas ON public.vacunas;

CREATE POLICY tenant_isolation_vacunas ON public.vacunas
  FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id()
    OR (clinic_id IS NULL AND mascota_id IN (
      SELECT id FROM public.mascotas WHERE owner_id IN (
        SELECT id FROM public.duenos WHERE user_id = auth.uid()
      )
    ))
    OR (
      clinic_id IN (
        SELECT clinic_id FROM public.clinic_memberships
        WHERE user_id = auth.uid() AND tipo = 'cliente' AND activo = true
      )
      AND mascota_id IN (
        SELECT cp.mascota_id FROM public.clinic_patients cp
        WHERE cp.clinic_id = vacunas.clinic_id
        AND cp.activo = true
        AND cp.mascota_id IN (
          SELECT m.id FROM public.mascotas m
          JOIN public.duenos d ON d.id = m.owner_id
          WHERE d.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    OR (clinic_id IS NULL AND mascota_id IN (
      SELECT id FROM public.mascotas WHERE owner_id IN (
        SELECT id FROM public.duenos WHERE user_id = auth.uid()
      )
    ))
  );
