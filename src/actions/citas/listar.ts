"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import type { CitaConRelaciones } from "@/types/models"

export async function listarCitas(fecha: string): Promise<CitaConRelaciones[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  const permiso = verificarPermiso(usuario.rol, "citas", "ver")
  if (!permiso) return []

  const supabase = await crearClienteAccion()
  const inicio = new Date(fecha)
  inicio.setHours(0, 0, 0, 0)
  const fin = new Date(fecha)
  fin.setHours(23, 59, 59, 999)

  const { data } = await supabase
    .from("citas")
    .select("*, mascota:mascotas(id, nombre, especie:especies(id, nombre), dueno:duenos(id, nombre, telefono)), veterinario:usuarios(id, nombre, email, rol)")
    .eq("clinic_id", usuario.clinic_id)
    .gte("fecha_hora", inicio.toISOString())
    .lte("fecha_hora", fin.toISOString())
    .order("fecha_hora", { ascending: true })

  return (data ?? []) as unknown as CitaConRelaciones[]
}
