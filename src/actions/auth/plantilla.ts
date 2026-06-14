"use server"

import { z } from "zod"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import { limpiarCacheSesion } from "@/lib/auth/get-session"

// 1. Schema de validación
const esquema = z.object({
  // campos
})

export async function plantillaServerAction(input: FormData) {
  // 2. Sesión
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  // 3. Usuario actual (clinic_id + rol)
  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  // 4. Permiso de rol
  const permiso = verificarPermiso(usuario.rol, "modulo", "accion")
  if (!permiso) return { error: "Permiso denegado" }

  // 5. Validación de datos
  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) {
    return { error: "Datos inválidos", detalles: parsed.error.flatten() }
  }

  // 6. Operación — reemplazar "tabla" con el nombre real
  const supabase = await crearClienteAccion()
  const { error } = await supabase
    .from("tabla" as "duenos")
    .insert({ ...parsed.data, clinic_id: usuario.clinic_id } as never)

  if (error) return { error: error.message }

  limpiarCacheSesion()
  return { success: true }
}
