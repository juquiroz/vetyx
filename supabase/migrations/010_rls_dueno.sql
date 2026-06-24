-- ============================================================================
-- Vetyx.io — RLS para dueños sin clínica
-- Versión: 1.0
-- Fecha: 2026-06-22
-- Motivo: Permitir que dueños con clinic_id = NULL accedan a sus propios
--         datos a través de user_id. Las políticas existentes se mantienen
--         para usuarios con clinic_id no nulo.
-- ============================================================================

-- 1. usuarios — política para que dueño vea su propia fila
CREATE POLICY usuarios_select_propio ON public.usuarios
  FOR SELECT
  USING (id = auth.uid());

-- 2. duenos — agregar ruta para dueños (clinic_id IS NULL + user_id match)
DROP POLICY IF EXISTS tenant_isolation_duenos ON public.duenos;
CREATE POLICY tenant_isolation_duenos ON public.duenos
  FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id()
    OR (clinic_id IS NULL AND user_id = auth.uid())
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    OR (clinic_id IS NULL AND user_id = auth.uid())
  );

-- 3. mascotas — ruta para dueños (clinic_id IS NULL + owner_id match via duenos)
DROP POLICY IF EXISTS tenant_isolation_mascotas ON public.mascotas;
CREATE POLICY tenant_isolation_mascotas ON public.mascotas
  FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id()
    OR (
      clinic_id IS NULL
      AND owner_id IN (SELECT id FROM public.duenos WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    OR (
      clinic_id IS NULL
      AND owner_id IN (SELECT id FROM public.duenos WHERE user_id = auth.uid())
    )
  );

-- 4. citas — ruta para dueños (clinic_id IS NULL + mascota_id chain)
DROP POLICY IF EXISTS tenant_isolation_citas ON public.citas;
CREATE POLICY tenant_isolation_citas ON public.citas
  FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id()
    OR (
      clinic_id IS NULL
      AND mascota_id IN (
        SELECT id FROM public.mascotas WHERE owner_id IN (
          SELECT id FROM public.duenos WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    OR (
      clinic_id IS NULL
      AND mascota_id IN (
        SELECT id FROM public.mascotas WHERE owner_id IN (
          SELECT id FROM public.duenos WHERE user_id = auth.uid()
        )
      )
    )
  );

-- 5. historial_medico — misma cadena
DROP POLICY IF EXISTS tenant_isolation_historial_medico ON public.historial_medico;
CREATE POLICY tenant_isolation_historial_medico ON public.historial_medico
  FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id()
    OR (
      clinic_id IS NULL
      AND mascota_id IN (
        SELECT id FROM public.mascotas WHERE owner_id IN (
          SELECT id FROM public.duenos WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    OR (
      clinic_id IS NULL
      AND mascota_id IN (
        SELECT id FROM public.mascotas WHERE owner_id IN (
          SELECT id FROM public.duenos WHERE user_id = auth.uid()
        )
      )
    )
  );

-- 6. vacunas — misma cadena
DROP POLICY IF EXISTS tenant_isolation_vacunas ON public.vacunas;
CREATE POLICY tenant_isolation_vacunas ON public.vacunas
  FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id()
    OR (
      clinic_id IS NULL
      AND mascota_id IN (
        SELECT id FROM public.mascotas WHERE owner_id IN (
          SELECT id FROM public.duenos WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    OR (
      clinic_id IS NULL
      AND mascota_id IN (
        SELECT id FROM public.mascotas WHERE owner_id IN (
          SELECT id FROM public.duenos WHERE user_id = auth.uid()
        )
      )
    )
  );
