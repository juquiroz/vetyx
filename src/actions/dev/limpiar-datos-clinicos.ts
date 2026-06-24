"use server"

import { crearClienteAdmin } from "@/lib/supabase/admin"
import { crearClienteAccion } from "@/lib/supabase/action"
import { obtenerSesion } from "@/lib/auth/get-session"

export async function limpiarDatosClinicos() {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Solo disponible en desarrollo" }
  }

  const sesion = await obtenerSesion()
  if (!sesion) return { error: "No hay sesión activa" }

  const supabase = await crearClienteAccion()
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("clinic_id")
    .eq("id", sesion.user.id)
    .single()

  if (!usuario) return { error: "Usuario no encontrado" }

  const admin = crearClienteAdmin()
  const cid = usuario.clinic_id!

  await admin.from("citas").delete().eq("clinic_id", cid)
  await admin.from("historial_medico").delete().eq("clinic_id", cid)
  await admin.from("vacunas").delete().eq("clinic_id", cid)
  await admin.from("mascotas").delete().eq("clinic_id", cid)
  await admin.from("duenos").delete().eq("clinic_id", cid)

  return { success: true }
}
