"use server"

import { z } from "zod"
import { crearClienteAdmin } from "@/lib/supabase/admin"
import { limpiarCacheSesion } from "@/lib/auth/get-session"

const esquemaRegistro = z.object({
  email: z.string().email("Email inválido"),
  nombreClinica: z.string().min(1, "El nombre de la clínica es requerido").max(120),
})

export async function registrarClinica(input: FormData) {
  const supabase = crearClienteAdmin()

  const parsed = esquemaRegistro.safeParse(Object.fromEntries(input))
  if (!parsed.success) {
    return { error: "Datos inválidos", detalles: parsed.error.flatten() }
  }

  const { email, nombreClinica } = parsed.data
  const slug = nombreClinica
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (authError) return { error: authError.message }
  if (!authUser.user) return { error: "No se pudo crear el usuario" }

  const userId = authUser.user.id

  const { data: clinica, error: clinicaError } = await supabase
    .from("clinicas")
    .insert({ nombre: nombreClinica, slug, email })
    .select("id")
    .single()

  if (clinicaError) {
    await supabase.auth.admin.deleteUser(userId)
    return { error: clinicaError.message }
  }

  const { error: usuarioError } = await supabase.from("usuarios").insert({
    id: userId,
    clinic_id: clinica.id,
    email,
    nombre: email.split("@")[0],
    rol: "admin",
  })

  if (usuarioError) {
    await supabase.from("clinicas").delete().eq("id", clinica.id)
    await supabase.auth.admin.deleteUser(userId)
    return { error: usuarioError.message }
  }

  const { error: linkError, data: linkData } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  })

  if (linkError) return { error: linkError.message }

  limpiarCacheSesion()

  return {
    success: true,
    mensaje: "Revisa tu email para activar tu cuenta",
    magicLink: linkData?.properties?.action_link,
  }
}
