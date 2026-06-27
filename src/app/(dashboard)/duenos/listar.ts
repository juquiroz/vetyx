"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface DuenoResumen {
  id: string
  cedula: string | null
  nombre: string
  telefono: string
  email: string | null
  activo: boolean
  mascotas_count: number
  created_at: string
}

export async function listarDuenos(): Promise<DuenoResumen[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  const supabase = await crearClienteAccion()

  const { data: duenos } = await supabase
    .from("duenos")
    .select("id, cedula, nombre, telefono, email, activo, created_at")
    .order("created_at", { ascending: false })

  if (!duenos || duenos.length === 0) return []

  const { data: conteos } = await supabase
    .from("mascotas")
    .select("owner_id")
    .in("owner_id", duenos.map((d) => d.id))
    .eq("activo", true)

  const mapaConteos = new Map<string, number>()
  for (const m of conteos ?? []) {
    mapaConteos.set(m.owner_id, (mapaConteos.get(m.owner_id) ?? 0) + 1)
  }

  return duenos.map((d) => ({
    ...d,
    mascotas_count: mapaConteos.get(d.id) ?? 0,
  }))
}
