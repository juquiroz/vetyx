"use server"

import { crearClienteAccion } from "@/lib/supabase/action"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"

export interface ResultadoDueno {
  id: string
  cedula: string | null
  nombre: string
  telefono: string
  email: string | null
  activo: boolean
}

export async function buscarDuenos(query: string): Promise<ResultadoDueno[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  if (query.length < 2) return []

  const supabase = await crearClienteAccion()
  const termino = `%${query}%`

  const { data } = await supabase
    .from("duenos")
    .select("id, cedula, nombre, telefono, email, activo")
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .or(`nombre.ilike.${termino},telefono.ilike.${termino},cedula.ilike.${termino}`)
    .order("nombre")
    .limit(10)

  return data ?? []
}
