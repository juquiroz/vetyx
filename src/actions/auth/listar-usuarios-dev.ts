"use server"

import { crearClienteAdmin } from "@/lib/supabase/admin"

export async function listarUsuariosDev() {
  if (process.env.NODE_ENV !== "development") return []

  const supabase = crearClienteAdmin()

  const { data } = await supabase
    .from("usuarios")
    .select("id, email, nombre, rol, clinic_id")
    .eq("activo", true)
    .order("nombre")

  return data ?? []
}
