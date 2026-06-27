"use server"

import { crearClienteAccion } from "@/lib/supabase/action"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"

export interface ResultadoGlobal {
  duenos: Array<{ id: string; nombre: string; telefono: string }>
  mascotas: Array<{ id: string; nombre: string; especie: string; dueno_nombre: string }>
}

export async function buscarGlobal(query: string): Promise<ResultadoGlobal> {
  const session = await obtenerSesion()
  if (!session) return { duenos: [], mascotas: [] }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { duenos: [], mascotas: [] }

  if (query.length < 2) return { duenos: [], mascotas: [] }

  const supabase = await crearClienteAccion()
  const termino = `%${query}%`

  const [resDuenos, resEspecies, resMascotas] = await Promise.all([
    supabase
      .from("duenos")
      .select("id, nombre, telefono")
      .eq("activo", true)
      .or(`nombre.ilike.${termino},telefono.ilike.${termino},cedula.ilike.${termino}`)
      .order("nombre")
      .limit(10),
    supabase.from("especies").select("id, nombre"),
    supabase
      .from("mascotas")
      .select("id, nombre, especie_id, owner_id")
      .eq("activo", true)
      .ilike("nombre", termino)
      .order("nombre")
      .limit(10),
  ])

  const mapaEspecies = new Map(resEspecies.data?.map((e) => [e.id, e.nombre]) ?? [])

  const ownerIds = [...new Set(resMascotas.data?.map((m) => m.owner_id) ?? [])]
  const { data: duenos } = ownerIds.length > 0
    ? await supabase.from("duenos").select("id, nombre").in("id", ownerIds)
    : { data: null }

  const mapaDuenos = new Map(duenos?.map((d) => [d.id, d.nombre]) ?? [])

  return {
    duenos: resDuenos.data?.map((d) => ({ id: d.id, nombre: d.nombre, telefono: d.telefono })) ?? [],
    mascotas:
      resMascotas.data?.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        especie: mapaEspecies.get(m.especie_id) ?? "",
        dueno_nombre: mapaDuenos.get(m.owner_id) ?? "",
      })) ?? [],
  }
}
