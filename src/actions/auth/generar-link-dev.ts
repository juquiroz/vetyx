"use server"

import { crearClienteAdmin } from "@/lib/supabase/admin"

export async function generarLinkDev(email: string) {
  const supabase = crearClienteAdmin()

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  })

  if (error) return { error: error.message }
  if (!data?.properties?.email_otp) return { error: "No se pudo generar el enlace" }

  const otp = data.properties.email_otp
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

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  }
}
