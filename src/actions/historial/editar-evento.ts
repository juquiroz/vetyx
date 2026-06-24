"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import { esquemaEditarEvento } from "@/lib/validations/historial"
import { VENTANA_EDICION_HISTORIAL_HORAS } from "@/config/constants"
import type { Database } from "@/types/database"

export async function editarEvento(
  input: FormData,
): Promise<{ success: true; data: { id: string; tratamiento: string | null; notas: string | null } } | { success: false; error: string }> {
  const sesion = await obtenerSesion()
  if (!sesion) return { success: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { success: false, error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "historial", "editar")
  if (!permiso) return { success: false, error: "Permiso denegado" }

  const parsed = esquemaEditarEvento.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { success: false, error: "Datos inválidos" }

  const { id, tratamiento, notas } = parsed.data

  const supabase = await crearClienteAccion()

  const { data: existente } = await supabase
    .from("historial_medico")
    .select("id, created_at")
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .single()

  if (!existente) return { success: false, error: "Evento no encontrado" }

  const ahora = Date.now()
  const createdAtMs = new Date(existente.created_at).getTime()
  const diffHoras = (ahora - createdAtMs) / (1000 * 60 * 60)

  if (diffHoras >= VENTANA_EDICION_HISTORIAL_HORAS) {
    return { success: false, error: "Ya pasó la ventana de edición de 24 horas" }
  }

  if (tratamiento === undefined && notas === undefined) {
    return { success: false, error: "No hay campos para actualizar" }
  }

  const { data: actualizado, error } = await supabase
    .from("historial_medico")
    .update({
      tratamiento: tratamiento !== undefined ? (tratamiento || null) : undefined,
      notas: notas !== undefined ? (notas || null) : undefined,
    } as Database["public"]["Tables"]["historial_medico"]["Update"])
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .select("id, tratamiento, notas")
    .single()

  if (error || !actualizado) return { success: false, error: "Error al actualizar el evento" }

  return {
    success: true,
    data: {
      id: actualizado.id,
      tratamiento: actualizado.tratamiento,
      notas: actualizado.notas,
    },
  }
}
