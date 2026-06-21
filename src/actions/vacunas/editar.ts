"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import { esquemaEditarVacuna } from "@/lib/validations/vacunas"
import type { Database } from "@/types/database"

type VacunaUpdate = Database["public"]["Tables"]["vacunas"]["Update"]

export async function editarVacuna(
  fd: FormData,
): Promise<{ success: true; data: { id: string; lote: string | null; fecha_proxima_dosis: string | null; observaciones: string | null } } | { success: false; error: string }> {
  const sesion = await obtenerSesion()
  if (!sesion) return { success: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { success: false, error: "Usuario no encontrado" }

  const permisoEditar = verificarPermiso(usuario.rol, "vacunas", "editar")
  if (!permisoEditar) return { success: false, error: "Permiso denegado" }

  const raw = Object.fromEntries(fd)
  const parsed = esquemaEditarVacuna.safeParse(raw)
  if (!parsed.success) return { success: false, error: "Datos inválidos" }

  const supabase = await crearClienteAccion()

  const { data: existente } = await supabase
    .from("vacunas")
    .select("id, clinic_id")
    .eq("id", parsed.data.id)
    .single()

  if (!existente) return { success: false, error: "Vacuna no encontrada" }
  if (existente.clinic_id !== usuario.clinic_id) return { success: false, error: "Permiso denegado" }

  const updates: VacunaUpdate = {}

  if (parsed.data.lote !== undefined) updates.lote = parsed.data.lote || null
  if (parsed.data.fecha_proxima_dosis !== undefined) {
    updates.fecha_proxima_dosis = parsed.data.fecha_proxima_dosis || null
  }
  if (parsed.data.observaciones !== undefined) updates.observaciones = parsed.data.observaciones || null

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "No hay campos para actualizar" }
  }

  const { data: actualizada, error } = await supabase
    .from("vacunas")
    .update(updates)
    .eq("id", parsed.data.id)
    .select("id, lote, fecha_proxima_dosis, observaciones")
    .single()

  if (error || !actualizada) return { success: false, error: "Error al actualizar la vacuna" }

  return {
    success: true,
    data: actualizada,
  }
}
