"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import { VENTANA_EDICION_HISTORIAL_HORAS } from "@/config/constants"
import { ETIQUETAS_TIPO } from "@/types/timeline"
import type { EventoTimeline, TimelineResponse } from "@/types/timeline"

export async function obtenerTimeline(
  mascotaId: string,
  pagina: number = 1,
  porPagina: number = 20,
  busqueda?: string,
  fechaDesde?: string,
  fechaHasta?: string,
): Promise<{ success: true; data: TimelineResponse } | { success: false; error: string }> {
  const sesion = await obtenerSesion()
  if (!sesion) return { success: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { success: false, error: "Usuario no encontrado" }

  const permisoVer = verificarPermiso(usuario.rol, "historial", "ver")
  if (!permisoVer) return { success: false, error: "Permiso denegado" }

  const permisoEditar = verificarPermiso(usuario.rol, "historial", "editar")

  if (!mascotaId || mascotaId.length < 10) return { success: false, error: "Mascota inválida" }

  const supabase = await crearClienteAccion()

  const { data: historial } = await supabase
    .from("historial_medico")
    .select("id, tipo, fecha, diagnostico, tratamiento, notas, created_by, created_at")
    .eq("mascota_id", mascotaId)
    .eq("clinic_id", usuario.clinic_id)
    .order("created_at", { ascending: false })

  const { data: vacunas } = await supabase
    .from("vacunas")
    .select("id, tipo_vacuna_id, lote, fecha_aplicacion, fecha_proxima_dosis, recordatorio_enviado, aplicado_por, created_at")
    .eq("mascota_id", mascotaId)
    .eq("clinic_id", usuario.clinic_id)
    .order("created_at", { ascending: false })

  const userIds = [
    ...new Set([
      ...(historial ?? []).map((h) => h.created_by),
      ...(vacunas ?? []).map((v) => v.aplicado_por),
    ]),
  ]

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre")
    .in("id", userIds.length > 0 ? userIds : ["none"])

  const mapaUsuarios = new Map(usuarios?.map((u) => [u.id, u.nombre]) ?? [])

  const catalogoIds = [...new Set((vacunas ?? []).map((v) => v.tipo_vacuna_id))]

  const { data: catalogo } = await supabase
    .from("catalogo_vacunas")
    .select("id, nombre")
    .in("id", catalogoIds.length > 0 ? catalogoIds : ["none"])

  const mapaCatalogo = new Map(catalogo?.map((c) => [c.id, c.nombre]) ?? [])

  const ahora = Date.now()

  const eventosHistorial: EventoTimeline[] = (historial ?? []).map((h) => {
    const createdAtMs = new Date(h.created_at).getTime()
    const diffHoras = (ahora - createdAtMs) / (1000 * 60 * 60)
    const dentroVentana = diffHoras < VENTANA_EDICION_HISTORIAL_HORAS

    return {
      id: h.id,
      fecha: h.fecha,
      tipo: h.tipo as EventoTimeline["tipo"],
      titulo: ETIQUETAS_TIPO[h.tipo as string] ?? h.tipo,
      resumen: h.diagnostico,
      metadata: {
        diagnostico: h.diagnostico,
        tratamiento: h.tratamiento,
        notas: h.notas,
        created_by_name: mapaUsuarios.get(h.created_by) ?? "",
      },
      editable: dentroVentana && permisoEditar,
      created_at: h.created_at,
      created_by: h.created_by,
    }
  })

  const eventosVacunas: EventoTimeline[] = (vacunas ?? []).map((v) => ({
    id: v.id,
    fecha: v.fecha_aplicacion,
    tipo: "vacuna" as const,
    titulo: mapaCatalogo.get(v.tipo_vacuna_id) ?? "Vacuna",
    resumen: mapaCatalogo.get(v.tipo_vacuna_id) ?? "Vacuna",
    metadata: {
      nombre_vacuna: mapaCatalogo.get(v.tipo_vacuna_id) ?? "",
      lote: v.lote,
      fecha_aplicacion: v.fecha_aplicacion,
      fecha_proxima_dosis: v.fecha_proxima_dosis,
      aplicado_por_name: mapaUsuarios.get(v.aplicado_por) ?? "",
      recordatorio_enviado: v.recordatorio_enviado,
    },
    editable: false,
    created_at: v.created_at,
    created_by: v.aplicado_por,
  }))

  const todos = [...eventosHistorial, ...eventosVacunas]
  todos.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.created_at.localeCompare(a.created_at))

  let filtrados = todos

  if (busqueda) {
    const termino = busqueda.toLowerCase()
    filtrados = filtrados.filter((e) => {
      const texto = `${e.titulo} ${e.resumen} ${Object.values(e.metadata).filter(Boolean).join(" ")}`.toLowerCase()
      return texto.includes(termino)
    })
  }

  if (fechaDesde) filtrados = filtrados.filter((e) => e.fecha >= fechaDesde)
  if (fechaHasta) filtrados = filtrados.filter((e) => e.fecha <= fechaHasta)

  const total = filtrados.length
  const inicio = (pagina - 1) * porPagina
  const eventosPagina = filtrados.slice(inicio, inicio + porPagina)
  const tieneMas = inicio + porPagina < total

  return {
    success: true,
    data: { eventos: eventosPagina, total, tieneMas },
  }
}
