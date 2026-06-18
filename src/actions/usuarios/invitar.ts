"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAdmin } from "@/lib/supabase/admin"

const esquema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  rol: z.enum(["admin", "vet", "recepcionista"]),
})

export async function invitarUsuario(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "usuarios", "invitar")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { email, nombre, rol } = parsed.data
  const supabase = crearClienteAdmin()

  if (email === session.user.email) return { error: "No puedes invitarte a ti mismo" }

  const { data: existente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .eq("clinic_id", usuario.clinic_id)
    .maybeSingle()

  if (existente) return { error: "Este email ya pertenece a un miembro de la clínica" }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (authError) return { error: authError.message }
  if (!authUser.user) return { error: "No se pudo crear el usuario" }

  const { error: usuarioError } = await supabase.from("usuarios").insert({
    id: authUser.user.id,
    clinic_id: usuario.clinic_id,
    email,
    nombre,
    rol,
  })

  if (usuarioError) {
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return { error: usuarioError.message }
  }

  limpiarCacheSesion()

  return { success: true, mensaje: `${nombre} ha sido agregado al staff` }
}
