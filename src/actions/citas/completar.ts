"use server"

import { z } from "zod"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import type { Cita } from "@/types/models"

const esquema = z.object({
  id: z.string().uuid("Cita requerida"),
  monto: z.coerce.number().min(0).optional().nullable(),
})

type CompletarCitaOutput =
  | { ok: true; cita: Cita; mensaje: string }
  | { ok: false; error: string }

export async function completarCita(input: FormData): Promise<CompletarCitaOutput> {
  const sesion = await obtenerSesion()
  if (!sesion) return { ok: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { ok: false, error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "citas", "completar")
  if (!permiso) return { ok: false, error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { ok: false, error: "Datos inválidos" }

  const { id, monto } = parsed.data

  const supabase = await crearClienteAccion()

  const { data: citaActual } = await supabase
    .from("citas")
    .select("*")
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .single()

  if (!citaActual) return { ok: false, error: "Cita no encontrada" }

  if (citaActual.estado !== "in_progress") {
    return { ok: false, error: "Solo se pueden completar citas en curso" }
  }

  const updates: Partial<{ estado: string; completed_by: string; monto: number }> = {
    estado: "completed",
    completed_by: usuario.id,
  }
  if (monto !== undefined && monto !== null) updates.monto = monto

  const { data: citaActualizada, error } = await supabase
    .from("citas")
    .update(updates)
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  return { ok: true, cita: citaActualizada as Cita, mensaje: "Cita completada exitosamente" }
}
