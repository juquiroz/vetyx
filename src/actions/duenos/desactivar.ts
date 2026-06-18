"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

const esquema = z.object({
  id: z.string().uuid(),
})

export async function desactivarDueno(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "duenos", "desactivar")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { id } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: dueno } = await supabase
    .from("duenos")
    .select("clinic_id")
    .eq("id", id)
    .single()

  if (!dueno) return { error: "Dueño no encontrado" }
  if (dueno.clinic_id !== usuario.clinic_id) return { error: "No autorizado" }

  const { count } = await supabase
    .from("mascotas")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", id)
    .eq("activo", true)

  if (count && count > 0) {
    return {
      error: `No se puede desactivar el dueño porque tiene ${count} mascota(s) activa(s). Desactiva las mascotas primero.`,
    }
  }

  const { error } = await supabase.from("duenos").update({ activo: false }).eq("id", id)

  if (error) return { error: error.message }

  limpiarCacheSesion()
  return { success: true }
}
