"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import { esquemaCrearEvento } from "@/lib/validations/historial"
import { ZONA_HORARIA_DEFAULT } from "@/config/constants"
import type { EventoTimeline } from "@/types/timeline"

export async function crearEvento(
  input: FormData,
): Promise<{ success: true; data: EventoTimeline } | { success: false; error: string }> {
  const sesion = await obtenerSesion()
  if (!sesion) return { success: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { success: false, error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "historial", "crear")
  if (!permiso) return { success: false, error: "Permiso denegado" }

  const parsed = esquemaCrearEvento.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { success: false, error: "Datos inválidos" }

  const { mascota_id, tipo, fecha, diagnostico, tratamiento, notas } = parsed.data

  const hoy = new Date().toISOString().split("T")[0]
  if (fecha > hoy) return { success: false, error: "La fecha no puede ser futura" }

  const supabase = await crearClienteAccion()

  const { data: mascota } = await supabase
    .from("mascotas")
    .select("id")
    .eq("id", mascota_id)
    .eq("clinic_id", usuario.clinic_id)
    .single()

  if (!mascota) return { success: false, error: "Mascota no encontrada" }

  const { data: nuevo, error } = await supabase
    .from("historial_medico")
    .insert({
      clinic_id: usuario.clinic_id,
      mascota_id,
      tipo,
      fecha,
      diagnostico,
      tratamiento: tratamiento || null,
      notas: notas || null,
      created_by: usuario.id,
    })
    .select("id, tipo, fecha, diagnostico, tratamiento, notas, created_by, created_at")
    .single()

  if (error || !nuevo) return { success: false, error: "Error al crear el evento" }

  const evento: EventoTimeline = {
    id: nuevo.id,
    fecha: nuevo.fecha,
    tipo: nuevo.tipo as EventoTimeline["tipo"],
    titulo: tipo === "consulta" ? "Consulta" : tipo === "cirugia" ? "Cirugía" : tipo === "hospitalizacion" ? "Hospitalización" : tipo === "control" ? "Control" : tipo === "procedimiento" ? "Procedimiento" : "Otro",
    resumen: nuevo.diagnostico,
    metadata: {
      diagnostico: nuevo.diagnostico,
      tratamiento: nuevo.tratamiento,
      notas: nuevo.notas,
      created_by_name: usuario.nombre,
    },
    editable: true,
    created_at: nuevo.created_at,
    created_by: usuario.id,
  }

  return { success: true, data: evento }
}
