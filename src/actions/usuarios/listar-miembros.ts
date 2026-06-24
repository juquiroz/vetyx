"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface MiembroStaff {
  id: string
  email: string
  nombre: string
  rol: string
  activo: boolean
  ultimo_acceso: string | null
  created_at: string
}

export async function listarMiembros(): Promise<MiembroStaff[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  const permiso = verificarPermiso(usuario.rol, "usuarios", "ver")
  if (!permiso) return []

  const supabase = await crearClienteAccion()

  if (!usuario.clinic_id) return []

  type MembershipRow = {
    rol: string | null
    activo: boolean
    created_at: string
    usuario: { id: string; email: string; nombre: string; ultimo_acceso: string | null }
  }

  const { data } = await supabase
    .from("clinic_memberships")
    .select("rol, activo, created_at, usuario:usuarios(id, email, nombre, ultimo_acceso)")
    .eq("clinic_id", usuario.clinic_id)
    .eq("tipo", "staff")
    .order("created_at", { ascending: false })

  if (!data) return []

  return (data as unknown as MembershipRow[]).map((m) => ({
    id: m.usuario.id,
    email: m.usuario.email,
    nombre: m.usuario.nombre,
    rol: m.rol ?? "",
    activo: m.activo,
    ultimo_acceso: m.usuario.ultimo_acceso,
    created_at: m.created_at,
  }))
}
