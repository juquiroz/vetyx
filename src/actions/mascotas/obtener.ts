"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface MascotaCompleta {
  id: string
  nombre: string
  especie_id: string
  especie: string
  raza: string | null
  fecha_nacimiento: string | null
  color: string | null
  peso: number | null
  sexo: string
  esterilizado: boolean
  activo: boolean
  dueno: {
    id: string
    nombre: string
    telefono: string
  }
}

export async function obtenerMascota(id: string): Promise<MascotaCompleta | null> {
  const session = await obtenerSesion()
  if (!session) return null

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return null

  const supabase = await crearClienteAccion()

  const { data: mascota } = await supabase
    .from("mascotas")
    .select("id, nombre, especie_id, raza, fecha_nacimiento, color, peso, sexo, esterilizado, activo, owner_id")
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .single()

  if (!mascota) return null

  const { data: dueno } = await supabase
    .from("duenos")
    .select("id, nombre, telefono")
    .eq("id", mascota.owner_id)
    .single()

  const { data: especies } = await supabase
    .from("especies")
    .select("id, nombre")

  const mapaEspecies = new Map(especies?.map((e) => [e.id, e.nombre]) ?? [])

  return {
    id: mascota.id,
    nombre: mascota.nombre,
    especie_id: mascota.especie_id,
    especie: mapaEspecies.get(mascota.especie_id) ?? "",
    raza: mascota.raza,
    fecha_nacimiento: mascota.fecha_nacimiento,
    color: mascota.color,
    peso: mascota.peso,
    sexo: mascota.sexo,
    esterilizado: mascota.esterilizado,
    activo: mascota.activo,
    dueno: {
      id: dueno?.id ?? "",
      nombre: dueno?.nombre ?? "",
      telefono: dueno?.telefono ?? "",
    },
  }
}
