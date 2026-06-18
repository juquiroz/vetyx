"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface VacunaRegistrada {
  id: string
  nombre_vacuna: string
  fecha_aplicacion: string
  lote: string | null
  aplicado_por: string
}

export async function obtenerVacunas(mascotaId: string): Promise<VacunaRegistrada[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  const supabase = await crearClienteAccion()

  const { data: vacunas } = await supabase
    .from("vacunas")
    .select("id, tipo_vacuna_id, fecha_aplicacion, lote, aplicado_por")
    .eq("mascota_id", mascotaId)
    .eq("clinic_id", usuario.clinic_id)
    .order("fecha_aplicacion", { ascending: false })

  if (!vacunas) return []

  const catalogoIds = [...new Set(vacunas.map((v) => v.tipo_vacuna_id))]
  const { data: catalogo } = await supabase
    .from("catalogo_vacunas")
    .select("id, nombre")
    .in("id", catalogoIds)

  const mapaCatalogo = new Map(catalogo?.map((c) => [c.id, c.nombre]) ?? [])

  return vacunas.map((v) => ({
    id: v.id,
    nombre_vacuna: mapaCatalogo.get(v.tipo_vacuna_id) ?? "",
    fecha_aplicacion: v.fecha_aplicacion,
    lote: v.lote,
    aplicado_por: v.aplicado_por,
  }))
}
