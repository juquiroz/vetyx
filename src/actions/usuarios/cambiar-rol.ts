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

  if (!usuario.clinic_id) return { error: "No perteneces a una clínica" }

  const { data: objetivo } = await supabase
    .from("clinic_memberships")
    .select("rol, user_id")
    .eq("user_id", usuarioId)
    .eq("clinic_id", usuario.clinic_id)
    .eq("tipo", "staff")
    .single()

  if (!objetivo) return { error: "Usuario no encontrado en esta clínica" }
  if (objetivo.user_id === usuario.id) return { error: "No puedes cambiar tu propio rol" }

  const { data: adminsActivos } = await supabase
    .from("clinic_memberships")
    .select("id", { count: "exact" })
    .eq("clinic_id", usuario.clinic_id)
    .eq("tipo", "staff")
    .eq("rol", "admin")
    .eq("activo", true)

  const countAdmins = adminsActivos?.length ?? 0
  const esElUnicoAdmin = countAdmins <= 1 && objetivo.rol === "admin" && nuevoRol !== "admin"

  if (esElUnicoAdmin) return { error: "Debe haber al menos un admin activo en la clínica" }

  const { error: membershipError } = await supabase
    .from("clinic_memberships")
    .update({ rol: nuevoRol })
    .eq("user_id", usuarioId)
    .eq("clinic_id", usuario.clinic_id)

  if (membershipError) return { error: membershipError.message }

  // Atrás-compat: mantener rol en usuarios sincronizado
  await supabase.from("usuarios").update({ rol: nuevoRol }).eq("id", usuarioId)

  limpiarCacheSesion()
  return { success: true }
}
