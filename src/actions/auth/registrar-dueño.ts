"use server"

import { z } from "zod"
import { crearClienteAdmin } from "@/lib/supabase/admin"
import { limpiarCacheSesion } from "@/lib/auth/get-session"
import { limpiarCacheUsuario } from "@/lib/auth/get-current-user"

const esquemaRegistroDueno = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(1, "El nombre es requerido").max(120),
  telefono: z.string().min(1, "El teléfono es requerido").max(20),
})

export async function registrarDueno(input: FormData) {
  const supabase = crearClienteAdmin()

  const parsed = esquemaRegistroDueno.safeParse(Object.fromEntries(input))
  if (!parsed.success) {
    return { error: "Datos inválidos", detalles: parsed.error.flatten() }
  }

  const { email, nombre, telefono } = parsed.data

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (authError) return { error: authError.message }
  if (!authUser.user) return { error: "No se pudo crear el usuario" }

  const userId = authUser.user.id

  const { error: usuarioError } = await supabase.from("usuarios").insert({
    id: userId,
    clinic_id: null,
    email,
    nombre,
    rol: "dueño",
    telefono,
  })

  if (usuarioError) {
    await supabase.auth.admin.deleteUser(userId)
    return { error: usuarioError.message }
  }

  const { error: duenoError } = await supabase.from("duenos").insert({
    clinic_id: null,
    nombre,
    telefono,
    email,
    user_id: userId,
    created_by: userId,
  })

  if (duenoError) {
    await supabase.from("usuarios").delete().eq("id", userId)
    await supabase.auth.admin.deleteUser(userId)
    return { error: duenoError.message }
  }

  const { error: linkError, data: linkData } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  })

  if (linkError) return { error: linkError.message }

  const otp = linkData?.properties?.email_otp
  if (!otp) return { error: "No se pudo generar el enlace" }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: "POST",
    headers: {
      "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "magiclink",
      token: otp,
      email,
    }),
  })

  if (!verifyRes.ok) {
    const text = await verifyRes.text()
    return { error: `Error al verificar: ${text}` }
  }

  const session = await verifyRes.json()

  limpiarCacheSesion()
  limpiarCacheUsuario(userId)

  return {
    success: true,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  }
}
