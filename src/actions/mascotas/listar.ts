"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface MascotaResumen {
  id: string
  nombre: string
  especie_id: string
  especie: string
  raza: string | null
  sexo: string
  activo: boolean
  dueno_id: string
  dueno_nombre: string
}

export async function listarMascotas(): Promise<MascotaResumen[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  const supabase = await crearClienteAccion()

  const { data: mascotas } = await supabase
    .from("mascotas")
    .select("id, nombre, especie_id, raza, sexo, activo, owner_id")
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .order("created_at", { ascending: false })

  if (!mascotas || mascotas.length === 0) return []

  const ownerIds = [...new Set(mascotas.map((m) => m.owner_id))]
  const { data: duenos } = await supabase
    .from("duenos")
    .select("id, nombre")
    .in("id", ownerIds)

  const mapaDuenos = new Map(duenos?.map((d) => [d.id, d.nombre]) ?? [])

  const { data: especies } = await supabase.from("especies").select("id, nombre")
  const mapaEspecies = new Map(especies?.map((e) => [e.id, e.nombre]) ?? [])

  return mascotas.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    especie_id: m.especie_id,
    especie: mapaEspecies.get(m.especie_id) ?? "",
    raza: m.raza,
    sexo: m.sexo,
    activo: m.activo,
    dueno_id: m.owner_id,
    dueno_nombre: mapaDuenos.get(m.owner_id) ?? "",
  }))
}
