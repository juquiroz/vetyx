"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

const esquema = z.object({
  cedula: z.string().max(50).optional().or(z.literal("")),
  nombre: z.string().min(1, "El nombre es requerido").max(120),
  telefono: z.string().min(1, "El teléfono es requerido").max(20),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().max(250).optional().or(z.literal("")),
})

export async function crearDueno(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "duenos", "crear")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { cedula, nombre, telefono, email, direccion } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: existente } = await supabase
    .from("duenos")
    .select("id")
    .eq("telefono", telefono)
    .maybeSingle()

  if (existente) return { error: "Ya existe un dueño con ese teléfono en la clínica" }

  if (cedula) {
    const { data: cedulaExistente } = await supabase
      .from("duenos")
      .select("id")
      .eq("cedula", cedula)
      .maybeSingle()

    if (cedulaExistente) return { error: "Ya existe un dueño con esa cédula en la clínica" }
  }

  const { data: nuevo, error } = await supabase
    .from("duenos")
    .insert({
      clinic_id: usuario.clinic_id,
      cedula: cedula || null,
      nombre,
      telefono,
      email: email || null,
      direccion: direccion || null,
      created_by: usuario.id,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  if (usuario.clinic_id && nuevo) {
    await supabase
      .from("clinic_clients")
      .upsert({
        clinic_id: usuario.clinic_id,
        dueno_id: nuevo.id,
        activo: true,
        created_by: usuario.id,
      }, { onConflict: "clinic_id, dueno_id" })
  }

  limpiarCacheSesion()
  return { success: true }
}
