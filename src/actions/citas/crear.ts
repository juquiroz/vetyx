"use server"

import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import { validarHorarioLaboral, esquemaCrearCita } from "@/lib/validations/citas"
import { ZONA_HORARIA_DEFAULT } from "@/config/constants"
import { verificarDisponibilidadInterna } from "./verificar-disponibilidad"
import type { ConflictoCita, SugerenciaSlot } from "./verificar-disponibilidad"
import type { Cita } from "@/types/models"

type CrearCitaOutput =
  | { ok: true; cita: Cita; mensaje: string }
  | { ok: false; conflictos: ConflictoCita[]; sugerencias: SugerenciaSlot[]; mensaje: string }
  | { ok: false; error: string }

export async function crearCita(input: FormData): Promise<CrearCitaOutput> {
  const session = await obtenerSesion()
  if (!session) return { ok: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { ok: false, error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "citas", "crear")
  if (!permiso) return { ok: false, error: "Permiso denegado" }

  const parsed = esquemaCrearCita.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { ok: false, error: "Datos inválidos" }

  const { mascota_id, veterinario_id, fecha_hora, duracion_minutos, motivo, notas_internas, observaciones } = parsed.data

  if (!validarHorarioLaboral(fecha_hora, duracion_minutos, ZONA_HORARIA_DEFAULT)) {
    return { ok: false, error: "Fuera del horario laboral" }
  }

  const supabase = await crearClienteAccion()

  const disponibilidad = await verificarDisponibilidadInterna({
    supabase,
    clinic_id: usuario.clinic_id!,
    veterinario_id,
    fecha_hora,
    duracion_minutos,
  })

  if (!disponibilidad.disponible) {
    return {
      ok: false,
      conflictos: disponibilidad.conflictos,
      sugerencias: disponibilidad.sugerencias,
      mensaje: "Conflicto de horario con otra cita",
    }
  }

  const { data: cita, error } = await supabase
    .from("citas")
    .insert({
      clinic_id: usuario.clinic_id,
      mascota_id,
      veterinario_id,
      fecha_hora,
      duracion_minutos,
      motivo,
      notas_internas: notas_internas || null,
      observaciones: observaciones || null,
      estado: "scheduled",
      created_by: usuario.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23P01" || error.message?.includes("excl_citas_solapamiento")) {
      const disponibilidadActualizada = await verificarDisponibilidadInterna({
        supabase,
        clinic_id: usuario.clinic_id!,
        veterinario_id,
        fecha_hora,
        duracion_minutos,
      })
      return {
        ok: false,
        conflictos: disponibilidadActualizada.conflictos,
        sugerencias: disponibilidadActualizada.sugerencias,
        mensaje: "Conflicto de horario detectado al guardar. Intenta con otro horario.",
      }
    }
    return { ok: false, error: error.message }
  }

  limpiarCacheSesion()
  return { ok: true, cita: cita as Cita, mensaje: "Cita creada exitosamente" }
}
