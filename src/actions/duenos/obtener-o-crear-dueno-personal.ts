"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

export async function obtenerOCrearDuenoPersonal() {
  const session = await obtenerSesion()
  if (!session) return { success: false as const, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { success: false as const, error: "Usuario no encontrado" }

  const supabase = await crearClienteAccion()

  const { data: existente } = await supabase
    .from("duenos")
    .select("id")
    .eq("user_id", usuario.id)
    .eq("activo", true)
    .maybeSingle()

  if (existente) {
    return { success: true as const, data: { id: existente.id } }
  }

  const { data: nuevo, error } = await supabase
    .from("duenos")
    .insert({
      clinic_id: usuario.clinic_id,
      nombre: usuario.nombre,
      email: usuario.email ?? null,
      telefono: usuario.telefono ?? "",
      user_id: usuario.id,
      created_by: usuario.id,
    })
    .select("id")
    .single()

  if (error) return { success: false as const, error: error.message }

  return { success: true as const, data: { id: nuevo.id } }
}
