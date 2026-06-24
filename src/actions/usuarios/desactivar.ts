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

  if (!usuario.clinic_id) return { error: "No perteneces a una clínica" }

  const { data: objetivo } = await supabase
    .from("clinic_memberships")
    .select("rol, user_id")
    .eq("user_id", usuarioId)
    .eq("clinic_id", usuario.clinic_id)
    .eq("tipo", "staff")
    .single()

  if (!objetivo) return { error: "Usuario no encontrado en esta clínica" }
  if (objetivo.user_id === usuario.id) return { error: "No puedes desactivarte a ti mismo" }

  const { data: adminsActivos } = await supabase
    .from("clinic_memberships")
    .select("id", { count: "exact" })
    .eq("clinic_id", usuario.clinic_id)
    .eq("tipo", "staff")
    .eq("rol", "admin")
    .eq("activo", true)

  const countAdmins = adminsActivos?.length ?? 0
  if (countAdmins <= 1 && objetivo.rol === "admin") {
    return { error: "Debe haber al menos un admin activo en la clínica" }
  }

  const { error: membershipError } = await supabase
    .from("clinic_memberships")
    .update({ activo: false })
    .eq("user_id", usuarioId)
    .eq("clinic_id", usuario.clinic_id)

  if (membershipError) return { error: membershipError.message }

  // Atrás-compat: desactivar también en usuarios si es su única clínica staff
  const { data: otrasMemberships } = await supabase
    .from("clinic_memberships")
    .select("id")
    .eq("user_id", usuarioId)
    .eq("tipo", "staff")
    .eq("activo", true)

  if (!otrasMemberships || otrasMemberships.length === 0) {
    await supabase.from("usuarios").update({ activo: false }).eq("id", usuarioId)
  }

  limpiarCacheSesion()
  return { success: true }
}
