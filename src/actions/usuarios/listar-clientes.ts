"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface ClienteInfo {
  id: string
  email: string
  nombre: string
  telefono: string | null
  desde: string
}

export async function listarClientes(): Promise<ClienteInfo[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  const permiso = verificarPermiso(usuario.rol, "clientes", "ver")
  if (!permiso) return []

  const supabase = await crearClienteAccion()

  if (!usuario.clinic_id) return []

  type MembershipRow = {
    created_at: string
    usuario: { id: string; email: string; nombre: string; telefono: string | null }
  }

  const { data } = await supabase
    .from("clinic_memberships")
    .select("created_at, usuario:usuarios(id, email, nombre, telefono)")
    .eq("clinic_id", usuario.clinic_id)
    .eq("tipo", "cliente")
    .eq("activo", true)
    .order("created_at", { ascending: false })

  if (!data) return []

  return (data as unknown as MembershipRow[]).map((m) => ({
    id: m.usuario.id,
    email: m.usuario.email,
    nombre: m.usuario.nombre,
    telefono: m.usuario.telefono,
    desde: m.created_at,
  }))
}
