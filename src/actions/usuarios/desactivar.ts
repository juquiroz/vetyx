"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

const esquema = z.object({
  usuarioId: z.string().uuid(),
})

export async function desactivarUsuario(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "usuarios", "desactivar")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { usuarioId } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: objetivo } = await supabase
    .from("usuarios")
    .select("id, rol, clinic_id")
    .eq("id", usuarioId)
    .single()

  if (!objetivo) return { error: "Usuario no encontrado" }
  if (objetivo.clinic_id !== usuario.clinic_id) return { error: "El usuario no pertenece a tu clínica" }
  if (objetivo.id === usuario.id) return { error: "No puedes desactivarte a ti mismo" }

  const { data: adminsActivos } = await supabase
    .from("usuarios")
    .select("id", { count: "exact" })
    .eq("clinic_id", usuario.clinic_id)
    .eq("rol", "admin")
    .eq("activo", true)

  const countAdmins = adminsActivos?.length ?? 0
  if (countAdmins <= 1 && objetivo.rol === "admin") {
    return { error: "Debe haber al menos un admin activo en la clínica" }
  }

  const { error } = await supabase
    .from("usuarios")
    .update({ activo: false })
    .eq("id", usuarioId)

  if (error) return { error: error.message }

  limpiarCacheSesion()
  return { success: true }
}
