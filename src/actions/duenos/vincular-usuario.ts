"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

const esquema = z.object({
  duenoId: z.string().uuid("ID de dueño inválido"),
  userId: z.string().uuid("ID de usuario inválido"),
})

export async function vincularDuenoAUsuario(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { duenoId, userId } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: dueno } = await supabase
    .from("duenos")
    .select("id, clinic_id, user_id")
    .eq("id", duenoId)
    .single()

  if (!dueno) return { error: "Dueño no encontrado" }
  if (dueno.clinic_id !== usuario.clinic_id) return { error: "No autorizado" }
  if (dueno.user_id) return { error: "Este dueño ya está vinculado a un usuario" }

  const { error } = await supabase
    .from("duenos")
    .update({ user_id: userId })
    .eq("id", duenoId)

  if (error) return { error: error.message }

  limpiarCacheSesion()
  return { success: true, mensaje: "Dueño vinculado al usuario exitosamente" }
}
