"use server"

import { z } from "zod"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAdmin } from "@/lib/supabase/admin"

const esquema = z.object({
  email: z.string().email("Email inválido"),
})

export async function agregarCliente(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "clientes", "agregar")
  if (!permiso) return { error: "Permiso denegado" }

  if (!usuario.clinic_id) return { error: "Debes pertenecer a una clínica para agregar clientes" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { email } = parsed.data
  if (email === session.user.email) return { error: "No puedes agregarte a ti mismo" }

  const supabase = crearClienteAdmin()

  const { data: existente } = await supabase
    .from("usuarios")
    .select("id, nombre, email")
    .eq("email", email)
    .maybeSingle()

  if (!existente) {
    return { error: "El usuario no está registrado en Vetyx. Pídele que cree una cuenta primero y vuelve a intentar." }
  }

  const { data: membresiaExistente } = await supabase
    .from("clinic_memberships")
    .select("id")
    .eq("user_id", existente.id)
    .eq("clinic_id", usuario.clinic_id)
    .maybeSingle()

  if (membresiaExistente) {
    return { error: "Este usuario ya está vinculado a la clínica" }
  }

  const { error: insertError } = await supabase.from("clinic_memberships").insert({
    user_id: existente.id,
    clinic_id: usuario.clinic_id,
    tipo: "cliente",
    rol: null,
  })

  if (insertError) return { error: insertError.message }

  return { success: true, mensaje: `${existente.nombre} ha sido agregado como cliente` }
}
