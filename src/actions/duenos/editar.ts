"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

const esquema = z.object({
  id: z.string().uuid(),
  cedula: z.string().max(50).optional().or(z.literal("")),
  nombre: z.string().min(1, "El nombre es requerido").max(120),
  telefono: z.string().min(1, "El teléfono es requerido").max(20),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().max(250).optional().or(z.literal("")),
})

export async function editarDueno(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "duenos", "editar")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { id, cedula, nombre, telefono, email, direccion } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: dueno } = await supabase
    .from("duenos")
    .select("clinic_id")
    .eq("id", id)
    .single()

  if (!dueno) return { error: "Dueño no encontrado" }
  if (dueno.clinic_id !== usuario.clinic_id) return { error: "No autorizado" }

  const { data: telefonoExistente } = await supabase
    .from("duenos")
    .select("id")
    .eq("telefono", telefono)
    .eq("clinic_id", usuario.clinic_id)
    .neq("id", id)
    .maybeSingle()

  if (telefonoExistente) return { error: "Ya existe otro dueño con ese teléfono en la clínica" }

  if (cedula) {
    const { data: cedulaExistente } = await supabase
      .from("duenos")
      .select("id")
      .eq("cedula", cedula)
      .eq("clinic_id", usuario.clinic_id)
      .neq("id", id)
      .maybeSingle()

    if (cedulaExistente) return { error: "Ya existe otro dueño con esa cédula en la clínica" }
  }

  const { error } = await supabase
    .from("duenos")
    .update({ cedula: cedula || null, nombre, telefono, email: email || null, direccion: direccion || null })
    .eq("id", id)

  if (error) return { error: error.message }

  limpiarCacheSesion()
  return { success: true }
}
