"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface DuenoConMascotas {
  id: string
  cedula: string | null
  nombre: string
  telefono: string
  email: string | null
  direccion: string | null
  activo: boolean
  mascotas: Array<{
    id: string
    nombre: string
    especie: string
    raza: string | null
    color: string | null
    activo: boolean
  }>
}

export async function obtenerDueno(id: string): Promise<DuenoConMascotas | null> {
  const session = await obtenerSesion()
  if (!session) return null

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return null

  const supabase = await crearClienteAccion()

  const { data: dueno } = await supabase
    .from("duenos")
    .select("id, cedula, nombre, telefono, email, direccion, activo")
    .eq("id", id)
    .single()

  if (!dueno) return null

  const { data: mascotas } = await supabase
    .from("mascotas")
    .select("id, nombre, especie_id, raza, color, activo")
    .eq("owner_id", id)
    .order("nombre")

  const { data: especies } = await supabase.from("especies").select("id, nombre")

  const mapaEspecies = new Map(especies?.map((e) => [e.id, e.nombre]) ?? [])

  return {
    ...dueno,
    mascotas:
      mascotas?.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        especie: mapaEspecies.get(m.especie_id) ?? m.especie_id,
        raza: m.raza,
        color: m.color,
        activo: m.activo,
      })) ?? [],
  }
}
