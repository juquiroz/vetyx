-- ============================================================================
-- Vetyx.io — Tablas de relación: clinic_clients + clinic_patients
-- Versión: 1.0
-- Fecha: 2026-06-25
-- Motivo: Separar la relación comercial (clínica → dueño) de la relación
--          clínica (clínica → mascota). Dueños y mascotas pasan a ser
--          entidades globales. Estas tablas reemplazan el uso de clinic_id
--          en duenos y mascotas.
--
-- Fase 1: Crear tablas + RLS dual (convive con rutas legacy).
-- Fase 2: Backfill datos existentes.
-- Fase 3: Migrar Server Actions.
-- Fase 4: Drop clinic_id de duenos/mascotas.
-- ============================================================================

-- 1. clinic_clients — relación comercial: clínica ↔ dueño (cliente)
-- ============================================================================
CREATE TABLE public.clinic_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id   UUID NOT NULL REFERENCES public.clinicas(id),
  dueno_id    UUID NOT NULL REFERENCES public.duenos(id),
  activo      BOOLEAN DEFAULT true,
  created_by  UUID NOT NULL REFERENCES public.usuarios(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_clinic_clients_clinic_dueno UNIQUE (clinic_id, dueno_id)
);

-- 2. clinic_patients — relación clínica: clínica ↔ mascota (paciente)
-- ============================================================================
CREATE TABLE public.clinic_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id               UUID NOT NULL REFERENCES public.clinicas(id),
  mascota_id              UUID NOT NULL REFERENCES public.mascotas(id),
  numero_expediente       VARCHAR(50),
  fecha_ingreso           DATE,
  estado                  VARCHAR(20) DEFAULT 'activo'
                            CHECK (estado IN ('activo', 'inactivo', 'referido', 'fallecido')),
  veterinario_referente   UUID REFERENCES public.usuarios(id),
  notas                   TEXT,
  activo                  BOOLEAN DEFAULT true,
  created_by              UUID NOT NULL REFERENCES public.usuarios(id),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_clinic_patients_clinic_mascota UNIQUE (clinic_id, mascota_id)
);

-- 3. Triggers updated_at
-- ============================================================================
CREATE TRIGGER trg_clinic_clients_set_updated_at
  BEFORE UPDATE ON public.clinic_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_clinic_patients_set_updated_at
  BEFORE UPDATE ON public.clinic_patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. RLS — clinic_clients
-- ============================================================================
ALTER TABLE public.clinic_clients ENABLE ROW LEVEL SECURITY;

-- Staff: solo ve clientes de su clínica
CREATE POLICY clinic_clients_select_staff ON public.clinic_clients
  FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

-- Staff de su clínica puede insertar (admin)
CREATE POLICY clinic_clients_insert_staff ON public.clinic_clients
  FOR INSERT
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol = 'admin' AND activo = true
    )
  );

-- Staff de su clínica puede actualizar
CREATE POLICY clinic_clients_update_staff ON public.clinic_clients
  FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- Staff de su clínica puede eliminar (desactivar lógico)
CREATE POLICY clinic_clients_delete_staff ON public.clinic_clients
  FOR DELETE
  USING (clinic_id = public.get_user_clinic_id());

-- Dueño: ve sus propias membresías como cliente
CREATE POLICY clinic_clients_select_own ON public.clinic_clients
  FOR SELECT
  USING (dueno_id IN (
    SELECT id FROM public.duenos WHERE user_id = auth.uid()
  ));

-- 5. RLS — clinic_patients
-- ============================================================================
ALTER TABLE public.clinic_patients ENABLE ROW LEVEL SECURITY;

-- Staff: solo ve pacientes de su clínica
CREATE POLICY clinic_patients_select_staff ON public.clinic_patients
  FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

-- Staff de su clínica puede insertar (admin/vet)
CREATE POLICY clinic_patients_insert_staff ON public.clinic_patients
  FOR INSERT
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol IN ('admin', 'vet') AND activo = true
    )
  );

-- Staff puede actualizar pacientes de su clínica
CREATE POLICY clinic_patients_update_staff ON public.clinic_patients
  FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- Staff puede eliminar (desactivar)
CREATE POLICY clinic_patients_delete_staff ON public.clinic_patients
  FOR DELETE
  USING (clinic_id = public.get_user_clinic_id());

-- Dueño: ve los registros de pacientes de sus mascotas
CREATE POLICY clinic_patients_select_own ON public.clinic_patients
  FOR SELECT
  USING (mascota_id IN (
    SELECT m.id FROM public.mascotas m
    JOIN public.duenos d ON d.id = m.owner_id
    WHERE d.user_id = auth.uid()
  ));

-- 6. Índices
-- ============================================================================
CREATE INDEX idx_clinic_clients_clinic_activo
  ON public.clinic_clients (clinic_id)
  WHERE activo = true;

CREATE INDEX idx_clinic_clients_dueno
  ON public.clinic_clients (dueno_id);

CREATE INDEX idx_clinic_patients_clinic_activo
  ON public.clinic_patients (clinic_id)
  WHERE activo = true;

CREATE INDEX idx_clinic_patients_mascota
  ON public.clinic_patients (mascota_id);

CREATE INDEX idx_clinic_patients_expediente
  ON public.clinic_patients (clinic_id, numero_expediente)
  WHERE numero_expediente IS NOT NULL;

CREATE INDEX idx_clinic_patients_vet_referente
  ON public.clinic_patients (veterinario_referente)
  WHERE veterinario_referente IS NOT NULL;

-- ============================================================================
-- NOTA: La actualización de RLS en duenos, mascotas, citas, historial_medico
-- y vacunas se realizará en Fase 2 (backfill) o Fase 3 (drop column),
-- cuando existan datos en clinic_clients y clinic_patients.
-- Por ahora las tablas existen pero el código legacy sigue funcionando
-- con las políticas actuales basadas en clinic_id.
-- ============================================================================
