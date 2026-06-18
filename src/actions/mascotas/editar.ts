"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

const esquema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1, "El nombre es requerido").max(80),
  especie_id: z.string().uuid("Especie inválida"),
  raza: z.string().max(80).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  color: z.string().max(80).optional().or(z.literal("")),
  peso: z.string().optional().or(z.literal("")),
  sexo: z.enum(["macho", "hembra", "no_especificado"]).optional(),
  esterilizado: z.string().optional(),
})

export async function editarMascota(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "mascotas", "editar")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { id, nombre, especie_id, raza, fecha_nacimiento, color, peso, sexo, esterilizado } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: mascota } = await supabase
    .from("mascotas")
    .select("id, clinic_id")
    .eq("id", id)
    .single()

  if (!mascota) return { error: "Mascota no encontrada" }
  if (mascota.clinic_id !== usuario.clinic_id) return { error: "No autorizado" }

  const updateFields: Record<string, unknown> = {
    nombre,
    especie_id,
    raza: raza || null,
    fecha_nacimiento: fecha_nacimiento || null,
    color: color || null,
    sexo: sexo ?? "no_especificado",
    esterilizado: esterilizado === "true",
  }

  if (peso) {
    updateFields.peso = parseFloat(peso)
  }

  if (usuario.rol === "recepcionista") {
    delete updateFields.peso
    delete updateFields.esterilizado
  }

  const { error } = await supabase.from("mascotas").update(updateFields as never).eq("id", id)

  if (error) return { error: error.message }

  limpiarCacheSesion()
  return { success: true }
}
