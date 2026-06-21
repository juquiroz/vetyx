"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

export interface VacunaRegistrada {
  id: string
  nombre_vacuna: string
  fecha_aplicacion: string
  fecha_proxima_dosis: string | null
  lote: string | null
  observaciones: string | null
  nombre_personalizado: string | null
  aplicado_por: string
}

export async function obtenerVacunas(mascotaId: string): Promise<VacunaRegistrada[]> {
  const session = await obtenerSesion()
  if (!session) return []

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return []

  const permisoVer = verificarPermiso(usuario.rol, "vacunas", "ver")
  if (!permisoVer) return []

  const supabase = await crearClienteAccion()

  const { data: vacunas } = await supabase
    .from("vacunas")
    .select("id, tipo_vacuna_id, nombre_personalizado, lote, fecha_aplicacion, fecha_proxima_dosis, observaciones, aplicado_por")
    .eq("mascota_id", mascotaId)
    .eq("clinic_id", usuario.clinic_id)
    .order("fecha_aplicacion", { ascending: false })

  if (!vacunas) return []

  const catalogoIds = [...new Set(vacunas.map((v) => v.tipo_vacuna_id))]
  const { data: catalogo } = await supabase
    .from("catalogo_vacunas")
    .select("id, nombre")
    .in("id", catalogoIds.length > 0 ? catalogoIds : ["none"])

  const mapaCatalogo = new Map(catalogo?.map((c) => [c.id, c.nombre]) ?? [])

  return vacunas.map((v) => ({
    id: v.id,
    nombre_vacuna: v.nombre_personalizado ?? mapaCatalogo.get(v.tipo_vacuna_id) ?? "",
    fecha_aplicacion: v.fecha_aplicacion,
    fecha_proxima_dosis: v.fecha_proxima_dosis,
    lote: v.lote,
    observaciones: v.observaciones,
    nombre_personalizado: v.nombre_personalizado,
    aplicado_por: v.aplicado_por,
  }))
}
