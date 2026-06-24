-- ============================================================================
-- Vetyx.io — Dueños sin clínica: clinic_id nullable + rol dueño
-- Versión: 1.0
-- Fecha: 2026-06-22
-- Motivo: Soportar registro de dueños de mascota sin crear clínica real.
--         usuarios.clinic_id = NULL para dueños. RLS en migración 010.
-- ============================================================================

-- 1. Hacer clinic_id nullable en tablas operacionales
ALTER TABLE public.usuarios ALTER COLUMN clinic_id DROP NOT NULL;
ALTER TABLE public.duenos ALTER COLUMN clinic_id DROP NOT NULL;
ALTER TABLE public.mascotas ALTER COLUMN clinic_id DROP NOT NULL;
ALTER TABLE public.citas ALTER COLUMN clinic_id DROP NOT NULL;
ALTER TABLE public.historial_medico ALTER COLUMN clinic_id DROP NOT NULL;
ALTER TABLE public.vacunas ALTER COLUMN clinic_id DROP NOT NULL;

-- 2. Ampliar CHECK de rol para incluir 'dueño'
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('admin', 'vet', 'recepcionista', 'dueño'));
