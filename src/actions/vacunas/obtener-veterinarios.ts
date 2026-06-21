"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface VeterinarioOpcion {
  id: string
  nombre: string
}

export async function obtenerVeterinariosParaVacuna(): Promise<VeterinarioOpcion[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  const supabase = await crearClienteAccion()
  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre")
    .eq("clinic_id", usuario.clinic_id)
    .eq("activo", true)
    .in("rol", ["vet", "admin"])
    .order("nombre")

  return data ?? []
}
