-- ============================================================================
-- Vetyx.io — Migración Inicial: Schema completo + RLS + Índices + Seed
-- Versión: 1.0
-- Fecha: 2026-06-16
-- ============================================================================

-- 0. Extensiones
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Función trigger para updated_at (no depende de tablas)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tablas
-- ============================================================================

-- 2.1 clinicas (tenant root)
CREATE TABLE public.clinicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL CHECK (nombre <> ''),
  slug VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL CHECK (email ~* '^.+@.+\..+$'),
  telefono VARCHAR(20),
  direccion TEXT,
  plan VARCHAR(20) DEFAULT 'mvp' CHECK (plan IN ('mvp')),
  activo BOOLEAN DEFAULT true,
  fecha_registro TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_clinicas_slug UNIQUE (slug)
);

-- 2.2 usuarios (staff)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinicas(id),
  email VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'vet', 'recepcionista')),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_usuarios_clinic_id_email UNIQUE (clinic_id, email)
);

-- 2.3 especies (catálogo global)
CREATE TABLE public.especies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_especies_nombre UNIQUE (nombre)
);

-- 2.4 duenos
CREATE TABLE public.duenos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinicas(id),
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(255) CHECK (email IS NULL OR email ~* '^.+@.+\..+$'),
  direccion TEXT,
  activo BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_duenos_clinic_id_telefono UNIQUE (clinic_id, telefono)
);

-- 2.5 mascotas
CREATE TABLE public.mascotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinicas(id),
  owner_id UUID NOT NULL REFERENCES public.duenos(id),
  especie_id UUID NOT NULL REFERENCES public.especies(id),
  nombre VARCHAR(80) NOT NULL,
  raza VARCHAR(80),
  fecha_nacimiento DATE,
  color VARCHAR(80),
  peso DECIMAL(5,1),
  sexo VARCHAR(20) DEFAULT 'no_especificado' CHECK (sexo IN ('macho', 'hembra', 'no_especificado')),
  esterilizado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ck_mascotas_peso CHECK (peso IS NULL OR (peso > 0 AND peso <= 200)),
  CONSTRAINT ck_mascotas_fecha_nacimiento CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= CURRENT_DATE)
);

-- 2.6 citas
CREATE TABLE public.citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinicas(id),
  mascota_id UUID NOT NULL REFERENCES public.mascotas(id),
  veterinario_id UUID NOT NULL REFERENCES public.usuarios(id),
  fecha_hora TIMESTAMPTZ NOT NULL,
  duracion_minutos INTEGER DEFAULT 30,
  motivo VARCHAR(200) NOT NULL CHECK (char_length(motivo) >= 5),
  estado VARCHAR(20) DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'completada', 'cancelada', 'no_show')),
  monto DECIMAL(10,2) CHECK (monto IS NULL OR monto >= 0),
  notas_internas TEXT,
  motivo_cancelacion TEXT CHECK (motivo_cancelacion IS NULL OR estado = 'cancelada'),
  created_by UUID NOT NULL REFERENCES public.usuarios(id),
  completed_by UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 historial_medico
CREATE TABLE public.historial_medico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinicas(id),
  mascota_id UUID NOT NULL REFERENCES public.mascotas(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('consulta', 'cirugia')),
  fecha DATE NOT NULL CHECK (fecha <= CURRENT_DATE),
  diagnostico TEXT NOT NULL CHECK (char_length(diagnostico) >= 10),
  tratamiento TEXT,
  notas TEXT,
  created_by UUID NOT NULL REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.8 catalogo_vacunas (catálogo global)
CREATE TABLE public.catalogo_vacunas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  especie_id UUID REFERENCES public.especies(id),
  dosis_tipica VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_catalogo_vacunas_nombre UNIQUE (nombre)
);

-- 2.9 vacunas
CREATE TABLE public.vacunas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinicas(id),
  mascota_id UUID NOT NULL REFERENCES public.mascotas(id),
  tipo_vacuna_id UUID NOT NULL REFERENCES public.catalogo_vacunas(id),
  lote VARCHAR(50),
  fecha_aplicacion DATE NOT NULL CHECK (fecha_aplicacion <= CURRENT_DATE),
  fecha_proxima_dosis DATE CHECK (fecha_proxima_dosis IS NULL OR fecha_proxima_dosis > fecha_aplicacion),
  recordatorio_enviado INTEGER DEFAULT 0 CHECK (recordatorio_enviado BETWEEN 0 AND 3),
  aplicado_por UUID NOT NULL REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Función helper para RLS (depende de usuarios)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT clinic_id FROM public.usuarios WHERE id = auth.uid()
$$;

-- 4. Triggers updated_at
-- ============================================================================
CREATE TRIGGER trg_clinicas_set_updated_at BEFORE UPDATE ON public.clinicas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_usuarios_set_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_duenos_set_updated_at BEFORE UPDATE ON public.duenos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_mascotas_set_updated_at BEFORE UPDATE ON public.mascotas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_citas_set_updated_at BEFORE UPDATE ON public.citas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_historial_medico_set_updated_at BEFORE UPDATE ON public.historial_medico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_vacunas_set_updated_at BEFORE UPDATE ON public.vacunas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. RLS
-- ============================================================================

-- 5.1 clinicas
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinicas_select_own ON public.clinicas
  FOR SELECT
  USING (id = public.get_user_clinic_id());

CREATE POLICY clinicas_update_admin ON public.clinicas
  FOR UPDATE
  USING (id = public.get_user_clinic_id())
  WITH CHECK (id = public.get_user_clinic_id());

-- 5.2 usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuarios_select_same_clinic ON public.usuarios
  FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY usuarios_insert_admin ON public.usuarios
  FOR INSERT
  WITH CHECK (
    clinic_id = public.get_user_clinic_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol = 'admin' AND activo = true
    )
  );

CREATE POLICY usuarios_update_admin ON public.usuarios
  FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- 5.3 duenos (tenant isolation)
ALTER TABLE public.duenos ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_duenos ON public.duenos
  FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- 5.4 especies (catálogo global)
ALTER TABLE public.especies ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalogos_select_authenticated ON public.especies
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5.5 mascotas (tenant isolation)
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_mascotas ON public.mascotas
  FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- 5.6 citas (tenant isolation)
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_citas ON public.citas
  FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- 5.7 historial_medico (tenant isolation)
ALTER TABLE public.historial_medico ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_historial_medico ON public.historial_medico
  FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- 5.8 catalogo_vacunas (catálogo global)
ALTER TABLE public.catalogo_vacunas ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalogos_select_authenticated_vacunas ON public.catalogo_vacunas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5.9 vacunas (tenant isolation)
ALTER TABLE public.vacunas ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_vacunas ON public.vacunas
  FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- 6. Índices de performance
-- ============================================================================

-- duenos
CREATE INDEX idx_duenos_clinic_id_nombre ON public.duenos (clinic_id, nombre);
CREATE INDEX idx_duenos_clinic_id_activo ON public.duenos (clinic_id) WHERE activo = true;

-- mascotas
CREATE INDEX idx_mascotas_clinic_id_nombre ON public.mascotas (clinic_id, nombre);
CREATE INDEX idx_mascotas_clinic_id_owner_id ON public.mascotas (clinic_id, owner_id);
CREATE INDEX idx_mascotas_clinic_id_activo ON public.mascotas (clinic_id) WHERE activo = true;

-- citas
CREATE INDEX idx_citas_doble_reserva ON public.citas (clinic_id, veterinario_id, fecha_hora) WHERE estado = 'confirmada';
CREATE INDEX idx_citas_fecha_hora ON public.citas (clinic_id, fecha_hora);
CREATE INDEX idx_citas_estado ON public.citas (clinic_id, estado);
CREATE INDEX idx_citas_veterinario_fecha ON public.citas (clinic_id, veterinario_id, fecha_hora);

-- historial_medico
CREATE INDEX idx_historial_medico_mascota_fecha ON public.historial_medico (clinic_id, mascota_id, fecha DESC);

-- vacunas
CREATE INDEX idx_vacunas_clinic_id_mascota_id ON public.vacunas (clinic_id, mascota_id);
CREATE INDEX idx_vacunas_recordatorio ON public.vacunas (fecha_proxima_dosis) WHERE recordatorio_enviado < 3;

-- 7. Seed data
-- ============================================================================

-- 7.1 especies
INSERT INTO public.especies (nombre, descripcion) VALUES
  ('Perro', 'Canis lupus familiaris'),
  ('Gato', 'Felis catus'),
  ('Otro', 'Otras especies (conejo, hurón, ave, etc.)');

-- 7.2 catalogo_vacunas
DO $$
DECLARE
  v_perro_id UUID;
  v_gato_id UUID;
BEGIN
  SELECT id INTO v_perro_id FROM public.especies WHERE nombre = 'Perro';
  SELECT id INTO v_gato_id FROM public.especies WHERE nombre = 'Gato';

  INSERT INTO public.catalogo_vacunas (nombre, especie_id, dosis_tipica) VALUES
    ('Múltiple canina (quíntuple séxtuple)', v_perro_id, '3 dosis + refuerzo anual'),
    ('Antirrábica canina', v_perro_id, '1 dosis + refuerzo anual'),
    ('Tos de las perreras (Bordetella)', v_perro_id, '1 dosis + refuerzo anual'),
    ('Leptospirosis canina', v_perro_id, '2 dosis + refuerzo anual'),
    ('Triple felina', v_gato_id, '2 dosis + refuerzo anual'),
    ('Antirrábica felina', v_gato_id, '1 dosis + refuerzo anual'),
    ('Leucemia felina (FeLV)', v_gato_id, '2 dosis + refuerzo anual'),
    ('Otra', NULL, 'A criterio del vet');
END $$;
