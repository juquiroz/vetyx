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
  const { data } = await supabase
    .from("usuarios")
    .select("id, email, nombre, rol, activo, ultimo_acceso, created_at")
    .eq("clinic_id", usuario.clinic_id)
    .order("created_at", { ascending: false })

  return data ?? []
}
