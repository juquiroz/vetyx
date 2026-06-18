"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

const esquema = z.object({
  id: z.string().uuid(),
})

export async function desactivarMascota(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "mascotas", "desactivar")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { id } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: mascota } = await supabase
    .from("mascotas")
    .select("clinic_id")
    .eq("id", id)
    .single()

  if (!mascota) return { error: "Mascota no encontrada" }
  if (mascota.clinic_id !== usuario.clinic_id) return { error: "No autorizado" }

  const { error } = await supabase.from("mascotas").update({ activo: false }).eq("id", id)

  if (error) return { error: error.message }

  limpiarCacheSesion()
  return { success: true }
}
