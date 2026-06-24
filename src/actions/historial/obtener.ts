"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface EventoHistorial {
  id: string
  tipo: string
  fecha: string
  diagnostico: string
  created_by_name: string
}

export async function obtenerHistorial(mascotaId: string): Promise<EventoHistorial[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  const supabase = await crearClienteAccion()

  const { data } = await supabase
    .from("historial_medico")
    .select("id, tipo, fecha, diagnostico, created_by")
    .eq("mascota_id", mascotaId)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .order("fecha", { ascending: false })

  if (!data) return []

  const userIds = [...new Set(data.map((h) => h.created_by))]
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre")
    .in("id", userIds)

  const mapaUsuarios = new Map(usuarios?.map((u) => [u.id, u.nombre]) ?? [])

  return data.map((h) => ({
    id: h.id,
    tipo: h.tipo,
    fecha: h.fecha,
    diagnostico: h.diagnostico,
    created_by_name: mapaUsuarios.get(h.created_by) ?? "",
  }))
}
