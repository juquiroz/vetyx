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
  if (email === session.user.email) return { error: "No puedes invitarte a ti mismo" }

  const supabase = crearClienteAdmin()

  // Buscar el email globalmente (sin filtro clinic_id)
  const { data: existente } = await supabase
    .from("usuarios")
    .select("id, clinic_id")
    .eq("email", email)
    .maybeSingle()

  if (existente) {
    // Verificar que no sea ya staff en esta clínica
    const { data: staffMembership } = await supabase
      .from("clinic_memberships")
      .select("id")
      .eq("user_id", existente.id)
      .eq("clinic_id", usuario.clinic_id!)
      .eq("tipo", "staff")
      .maybeSingle()

    if (staffMembership) {
      return { error: "Este email ya pertenece al staff de la clínica" }
    }

    // Si el usuario es dueño (sin clínica), asignarle clinic_id para atrás-compat
    if (!existente.clinic_id) {
      await supabase.from("usuarios").update({ clinic_id: usuario.clinic_id }).eq("id", existente.id)
    }

    const { error: insertError } = await supabase.from("clinic_memberships").insert({
      user_id: existente.id,
      clinic_id: usuario.clinic_id!,
      tipo: "staff",
      rol,
    })

    if (insertError) return { error: insertError.message }

    limpiarCacheSesion()
    return { success: true, mensaje: `${nombre} ha sido agregado al staff` }
  }

  // Usuario nuevo: crear auth user + usuarios + membership
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

  const { error: membershipError } = await supabase.from("clinic_memberships").insert({
    user_id: authUser.user.id,
    clinic_id: usuario.clinic_id!,
    tipo: "staff",
    rol,
  })

  if (membershipError) {
    await supabase.from("usuarios").delete().eq("id", authUser.user.id)
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return { error: membershipError.message }
  }

  limpiarCacheSesion()

  return { success: true, mensaje: `${nombre} ha sido agregado al staff` }
}
