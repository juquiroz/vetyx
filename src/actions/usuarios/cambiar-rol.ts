"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

const esquema = z.object({
  usuarioId: z.string().uuid(),
  nuevoRol: z.enum(["admin", "vet", "recepcionista"]),
})

export async function cambiarRolUsuario(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "usuarios", "cambiar-rol")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { usuarioId, nuevoRol } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: objetivo } = await supabase
    .from("usuarios")
    .select("id, rol, clinic_id")
    .eq("id", usuarioId)
    .single()

  if (!objetivo) return { error: "Usuario no encontrado" }
  if (objetivo.clinic_id !== usuario.clinic_id) return { error: "El usuario no pertenece a tu clínica" }
  if (objetivo.id === usuario.id) return { error: "No puedes cambiar tu propio rol" }

  const { data: adminsActivos } = await supabase
    .from("usuarios")
    .select("id", { count: "exact" })
    .eq("clinic_id", usuario.clinic_id)
    .eq("rol", "admin")
    .eq("activo", true)

  const countAdmins = adminsActivos?.length ?? 0
  const esElUnicoAdmin = countAdmins <= 1 && objetivo.rol === "admin" && nuevoRol !== "admin"

  if (esElUnicoAdmin) return { error: "Debe haber al menos un admin activo en la clínica" }

  const { error } = await supabase
    .from("usuarios")
    .update({ rol: nuevoRol })
    .eq("id", usuarioId)

  if (error) return { error: error.message }

  limpiarCacheSesion()
  return { success: true }
}
