"use server"

import { z } from "zod"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

const esquema = z.object({
  owner_id: z.string().uuid("Dueño inválido"),
  nombre: z.string().min(1, "El nombre es requerido").max(80),
  especie_id: z.string().uuid("Especie inválida"),
  raza: z.string().max(80).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  color: z.string().max(80).optional().or(z.literal("")),
  peso: z.string().optional().or(z.literal("")),
  sexo: z.enum(["macho", "hembra", "no_especificado"]).optional(),
  esterilizado: z.string().optional(),
})

export async function crearMascota(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "mascotas", "crear")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { owner_id, nombre, especie_id, raza, fecha_nacimiento, color, peso, sexo, esterilizado } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: dueno } = await supabase
    .from("duenos")
    .select("id, activo")
    .eq("id", owner_id)
    .single()

  if (!dueno) return { error: "Dueño no encontrado" }
  if (!dueno.activo) return { error: "No se puede registrar una mascota a un dueño inactivo" }

  const { error } = await supabase.from("mascotas").insert({
    clinic_id: usuario.clinic_id,
    owner_id,
    especie_id,
    nombre,
    raza: raza || null,
    fecha_nacimiento: fecha_nacimiento || null,
    color: color || null,
    peso: peso ? parseFloat(peso) : null,
    sexo: sexo ?? "no_especificado",
    esterilizado: esterilizado === "true",
    created_by: usuario.id,
  })

  if (error) return { error: error.message }

  limpiarCacheSesion()
  return { success: true }
}
