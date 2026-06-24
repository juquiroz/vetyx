"use server"

import { z } from "zod"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import type { Cita } from "@/types/models"

const TRANSICIONES: Record<string, string[]> = {
  scheduled: ["confirmed"],
  confirmed: ["in_progress"],
}

const esquema = z.object({
  id: z.string().uuid("Cita requerida"),
  estado: z.enum(["confirmed", "in_progress"]),
})

type TransicionarEstadoOutput =
  | { ok: true; cita: Cita; mensaje: string }
  | { ok: false; error: string }

export async function transicionarEstado(input: FormData): Promise<TransicionarEstadoOutput> {
  const sesion = await obtenerSesion()
  if (!sesion) return { ok: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { ok: false, error: "Usuario no encontrado" }

  const permisoTransicion = verificarPermiso(usuario.rol, "citas", "editar")
  if (!permisoTransicion) return { ok: false, error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { ok: false, error: "Datos inválidos" }

  const { id, estado } = parsed.data

  const supabase = await crearClienteAccion()

  const { data: citaActual } = await supabase
    .from("citas")
    .select("*")
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .single()

  if (!citaActual) return { ok: false, error: "Cita no encontrada" }

  const destinos = TRANSICIONES[citaActual.estado]
  if (!destinos || !destinos.includes(estado)) {
    return { ok: false, error: `No se puede cambiar de ${citaActual.estado} a ${estado}` }
  }

  const { data: citaActualizada, error } = await supabase
    .from("citas")
    .update({ estado })
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .select()
    .single()

  if (error) return { ok: false, error: error.message }

  const mensajes: Record<string, string> = {
    confirmed: "Cita confirmada exitosamente",
    in_progress: "Consulta iniciada",
  }

  return { ok: true, cita: citaActualizada as Cita, mensaje: mensajes[estado] ?? "Estado actualizado" }
}
