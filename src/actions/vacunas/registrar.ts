"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import { esquemaRegistrarVacuna } from "@/lib/validations/vacunas"
import { NOMBRE_VACUNA_OTRA } from "@/config/constants"
import type { Database } from "@/types/database"

type VacunaInsert = Database["public"]["Tables"]["vacunas"]["Insert"]

export async function registrarVacuna(
  fd: FormData,
): Promise<{ success: true; data: { id: string; nombre_vacuna: string; fecha_aplicacion: string } } | { success: false; error: string }> {
  const sesion = await obtenerSesion()
  if (!sesion) return { success: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { success: false, error: "Usuario no encontrado" }

  const permisoCrear = verificarPermiso(usuario.rol, "vacunas", "crear")
  if (!permisoCrear) return { success: false, error: "Permiso denegado" }

  const raw = Object.fromEntries(fd)
  const parsed = esquemaRegistrarVacuna.safeParse(raw)
  if (!parsed.success) return { success: false, error: "Datos inválidos" }

  const { catalogo_vacuna_id, nombre_personalizado, fecha_aplicacion, fecha_proxima_dosis, lote, observaciones, veterinario_id } = parsed.data

  const hoy = new Date().toISOString().slice(0, 10)
  if (fecha_aplicacion > hoy) return { success: false, error: "La fecha de aplicación no puede ser futura" }

  if (fecha_proxima_dosis && fecha_proxima_dosis <= fecha_aplicacion) {
    return { success: false, error: "La próxima dosis debe ser posterior a la fecha de aplicación" }
  }

  const supabase = await crearClienteAccion()

  const { data: mascota } = await supabase
    .from("mascotas")
    .select("id, activo, especie_id, clinic_id")
    .eq("id", parsed.data.mascota_id)
    .single()

  if (!mascota) return { success: false, error: "Mascota no encontrada" }
  if (!mascota.activo) return { success: false, error: "La mascota no está activa" }
  if (mascota.clinic_id !== usuario.clinic_id) return { success: false, error: "Permiso denegado" }

  const { data: catalogo } = await supabase
    .from("catalogo_vacunas")
    .select("id, nombre, especie_id")
    .eq("id", catalogo_vacuna_id)
    .single()

  if (!catalogo) return { success: false, error: "Tipo de vacuna no encontrado" }

  const esOtra = catalogo.nombre === NOMBRE_VACUNA_OTRA

  if (!esOtra && catalogo.especie_id && catalogo.especie_id !== mascota.especie_id) {
    return { success: false, error: "Esta vacuna no es compatible con la especie de la mascota" }
  }

  if (esOtra && !nombre_personalizado) {
    return { success: false, error: "Debes especificar el nombre de la vacuna" }
  }

  const { data: veterinario } = await supabase
    .from("usuarios")
    .select("id, clinic_id")
    .eq("id", veterinario_id)
    .single()

  if (!veterinario) return { success: false, error: "Veterinario no encontrado" }
  if (veterinario.clinic_id !== usuario.clinic_id) return { success: false, error: "Permiso denegado" }

  const insertData: VacunaInsert = {
    clinic_id: usuario.clinic_id,
    mascota_id: parsed.data.mascota_id,
    tipo_vacuna_id: catalogo_vacuna_id,
    nombre_personalizado: esOtra ? (nombre_personalizado ?? null) : null,
    fecha_aplicacion,
    fecha_proxima_dosis: fecha_proxima_dosis || null,
    lote: lote || null,
    observaciones: observaciones || null,
    aplicado_por: veterinario_id,
    recordatorio_enviado: 0,
  }

  const { data: nueva, error } = await supabase
    .from("vacunas")
    .insert(insertData)
    .select("id, fecha_aplicacion")
    .single()

  if (error) return { success: false, error: "Error al registrar la vacuna" }

  return {
    success: true,
    data: {
      id: nueva.id,
      nombre_vacuna: esOtra ? (nombre_personalizado ?? catalogo.nombre) : catalogo.nombre,
      fecha_aplicacion: nueva.fecha_aplicacion,
    },
  }
}
