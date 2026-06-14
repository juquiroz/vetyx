"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

export async function buscarGlobal(termino: string) {
  if (termino.length < 2) return { duenos: [], mascotas: [] }

  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const supabase = await crearClienteAccion()

  const { data: duenos } = await supabase
    .from("duenos")
    .select("id, nombre, telefono")
    .eq("clinic_id", usuario.clinic_id)
    .eq("activo", true)
    .or(`nombre.ilike.%${termino}%,telefono.ilike.%${termino}%`)
    .limit(5)

  const { data: mascotas } = await supabase
    .from("mascotas")
    .select("id, nombre, owner_id")
    .eq("clinic_id", usuario.clinic_id)
    .eq("activo", true)
    .ilike("nombre", `%${termino}%`)
    .limit(5)

  return { duenos: duenos ?? [], mascotas: mascotas ?? [] }
}
