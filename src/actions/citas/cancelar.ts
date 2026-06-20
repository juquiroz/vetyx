"use server"

import { z } from "zod"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import type { Cita } from "@/types/models"

const ESTADOS_CANCELABLES = ["scheduled", "confirmed"]

const esquema = z.object({
  id: z.string().uuid("Cita requerida"),
  motivo_cancelacion: z.string().max(200).optional().or(z.literal("")),
})

type CancelarCitaOutput =
  | { ok: true; cita: Cita; mensaje: string }
  | { ok: false; error: string }

export async function cancelarCita(input: FormData): Promise<CancelarCitaOutput> {
  const sesion = await obtenerSesion()
  if (!sesion) return { ok: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { ok: false, error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "citas", "cancelar")
  if (!permiso) return { ok: false, error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { ok: false, error: "Datos inválidos" }

  const { id, motivo_cancelacion } = parsed.data

  const supabase = await crearClienteAccion()

  const { data: citaActual } = await supabase
    .from("citas")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", usuario.clinic_id)
    .single()

  if (!citaActual) return { ok: false, error: "Cita no encontrada" }

  if (!ESTADOS_CANCELABLES.includes(citaActual.estado)) {
    return { ok: false, error: "No se puede cancelar una cita en estado " + citaActual.estado }
  }

  const updates: Partial<{ estado: string; motivo_cancelacion: string }> = { estado: "cancelled" }
  if (motivo_cancelacion) updates.motivo_cancelacion = motivo_cancelacion

  const { data: citaActualizada, error } = await supabase
    .from("citas")
    .update(updates)
    .eq("id", id)
    .eq("clinic_id", usuario.clinic_id)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  return { ok: true, cita: citaActualizada as Cita, mensaje: "Cita cancelada exitosamente" }
}
