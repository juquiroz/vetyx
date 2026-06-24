"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import { esquemaEditarCita, validarHorarioLaboral } from "@/lib/validations/citas"
import { ZONA_HORARIA_DEFAULT } from "@/config/constants"
import { verificarDisponibilidadInterna } from "./verificar-disponibilidad"
import type { Cita, CitaConRelaciones } from "@/types/models"

const ESTADOS_EDITABLES = ["scheduled", "confirmed"]

type EditarCitaOutput =
  | { ok: true; cita: Cita; mensaje: string; error?: undefined }
  | { ok: false; error: string }
  | { ok: false; error?: undefined; conflictos: import("./verificar-disponibilidad").ConflictoCita[]; sugerencias: import("./verificar-disponibilidad").SugerenciaSlot[]; mensaje: string }

export async function editarCita(input: FormData): Promise<EditarCitaOutput> {
  const sesion = await obtenerSesion()
  if (!sesion) return { ok: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { ok: false, error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "citas", "editar")
  if (!permiso) return { ok: false, error: "Permiso denegado" }

  const parsed = esquemaEditarCita.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { ok: false, error: "Datos inválidos" }

  const { id, mascota_id, veterinario_id, fecha_hora, duracion_minutos, motivo, notas_internas, observaciones } = parsed.data

  const supabase = await crearClienteAccion()

  const { data: citaActual } = await supabase
    .from("citas")
    .select("*")
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .single()

  if (!citaActual) return { ok: false, error: "Cita no encontrada" }

  if (!ESTADOS_EDITABLES.includes(citaActual.estado)) {
    return { ok: false, error: "No se puede editar una cita en este estado" }
  }

  const vetFinal = veterinario_id ?? citaActual.veterinario_id
  const fechaFinal = fecha_hora ?? citaActual.fecha_hora
  const duracionFinal = duracion_minutos ?? citaActual.duracion_minutos

  if (!validarHorarioLaboral(fechaFinal, duracionFinal, ZONA_HORARIA_DEFAULT)) {
    return { ok: false, error: "Fuera del horario laboral" }
  }

  if (vetFinal !== citaActual.veterinario_id || fechaFinal !== citaActual.fecha_hora) {
    const disponibilidad = await verificarDisponibilidadInterna({
      supabase,
      clinic_id: usuario.clinic_id!,
      veterinario_id: vetFinal,
      fecha_hora: fechaFinal,
      duracion_minutos: duracionFinal,
      excluir_cita_id: id,
    })

    if (!disponibilidad.disponible) {
      return {
        ok: false,
        conflictos: disponibilidad.conflictos,
        sugerencias: disponibilidad.sugerencias,
        mensaje: "Conflicto de horario con otra cita",
      }
    }
  }

  const updates: Partial<{
    mascota_id: string
    veterinario_id: string
    fecha_hora: string
    motivo: string
    notas_internas: string | null
    observaciones: string | null
  }> = {}
  if (mascota_id !== undefined) updates.mascota_id = mascota_id
  if (veterinario_id !== undefined) updates.veterinario_id = veterinario_id
  if (fecha_hora !== undefined) updates.fecha_hora = fecha_hora
  if (motivo !== undefined) updates.motivo = motivo
  if (notas_internas !== undefined) updates.notas_internas = notas_internas || null
  if (observaciones !== undefined) updates.observaciones = observaciones || null

  const { data: citaActualizada, error } = await supabase
    .from("citas")
    .update(updates)
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  return { ok: true, cita: citaActualizada as Cita, mensaje: "Cita actualizada exitosamente" }
}
