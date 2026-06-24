"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import type { CitaConRelaciones } from "@/types/models"

export async function obtenerCitasRango(params: {
  fecha_inicio: string
  fecha_fin: string
  veterinario_id?: string
}): Promise<CitaConRelaciones[]> {
  const sesion = await obtenerSesion()
  if (!sesion) return []

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return []

  const permiso = verificarPermiso(usuario.rol, "citas", "ver")
  if (!permiso) return []

  const supabase = await crearClienteAccion()

  let query = supabase
    .from("citas")
    .select("*, mascota:mascotas(id, nombre, especie:especies(id, nombre), dueno:duenos(id, nombre, telefono)), veterinario:usuarios(id, nombre, email, rol)")
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .neq("estado", "cancelled")
    .gte("fecha_hora", params.fecha_inicio)
    .lte("fecha_hora", params.fecha_fin)
    .order("fecha_hora", { ascending: true })

  if (params.veterinario_id) {
    query = query.eq("veterinario_id", params.veterinario_id)
  }

  const { data } = await query

  return (data ?? []) as unknown as CitaConRelaciones[]
}
