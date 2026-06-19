"use server"

import { crearClienteAccion } from "@/lib/supabase/action"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"

export interface ResultadoMascota {
  id: string
  nombre: string
  especie: string
  dueno_nombre: string
  dueno_id: string
  activo: boolean
}

export async function buscarMascotas(query: string, dueno_id?: string): Promise<ResultadoMascota[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  if (query.length < 2 && !dueno_id) return []

  const supabase = await crearClienteAccion()

  const { data: especies } = await supabase.from("especies").select("id, nombre")
  const mapaEspecies = new Map(especies?.map((e) => [e.id, e.nombre]) ?? [])

  const termino = `%${query}%`

  let duenoIds: string[] = []

  if (dueno_id) {
    duenoIds = [dueno_id]
    const { data: dueno } = await supabase
      .from("duenos")
      .select("id, nombre")
      .eq("id", dueno_id)
      .single()
    if (dueno) {
      const mapaDuenosTemp = new Map([[dueno.id, dueno.nombre]])
      const { data: mascotas } = await supabase
        .from("mascotas")
        .select("id, nombre, especie_id, owner_id, activo")
        .eq("clinic_id", usuario.clinic_id)
        .eq("owner_id", dueno_id)
        .ilike("nombre", termino)
        .limit(10)

      return (
        mascotas?.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          especie: mapaEspecies.get(m.especie_id) ?? "",
          dueno_nombre: mapaDuenosTemp.get(m.owner_id) ?? "",
          dueno_id: m.owner_id,
          activo: m.activo,
        })) ?? []
      )
    }
    return []
  }

  const { data: duenos } = await supabase
    .from("duenos")
    .select("id, nombre")
    .eq("clinic_id", usuario.clinic_id)
    .or(`nombre.ilike.${termino},telefono.ilike.${termino}`)
    .limit(10)

  const mapaDuenos = new Map(duenos?.map((d) => [d.id, d.nombre]) ?? [])
  duenoIds = [...mapaDuenos.keys()]

  const mascotasQuery = supabase
    .from("mascotas")
    .select("id, nombre, especie_id, owner_id, activo")
    .eq("clinic_id", usuario.clinic_id)
    .ilike("nombre", termino)

  if (duenoIds.length > 0) {
    const { data: mascotasPorDueno } = await supabase
      .from("mascotas")
      .select("id, nombre, especie_id, owner_id, activo")
      .eq("clinic_id", usuario.clinic_id)
      .in("owner_id", duenoIds)
      .limit(10)

    const { data: mascotasPorNombre } = await mascotasQuery.limit(10)

    type MascotaRow = { id: string; nombre: string; especie_id: string; owner_id: string; activo: boolean }
    const vistos = new Set<string>()
    const combinados: MascotaRow[] = []

    for (const m of mascotasPorNombre ?? []) {
      if (!vistos.has(m.id)) { vistos.add(m.id); combinados.push(m) }
    }
    for (const m of mascotasPorDueno ?? []) {
      if (!vistos.has(m.id)) { vistos.add(m.id); combinados.push(m) }
    }

    return combinados.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      especie: mapaEspecies.get(m.especie_id) ?? "",
      dueno_nombre: mapaDuenos.get(m.owner_id) ?? "",
      dueno_id: m.owner_id,
      activo: m.activo,
    }))
  }

  const { data: mascotas } = await mascotasQuery.limit(10)

  return (
    mascotas?.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      especie: mapaEspecies.get(m.especie_id) ?? "",
      dueno_nombre: mapaDuenos.get(m.owner_id) ?? "",
      dueno_id: m.owner_id,
      activo: m.activo,
    })) ?? []
  )
}
