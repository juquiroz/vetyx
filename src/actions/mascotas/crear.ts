"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import { obtenerOCrearDuenoPersonal } from "@/actions/duenos/obtener-o-crear-dueno-personal"

const esquema = z.object({
  owner_id: z.string().uuid("Dueño inválido").optional(),
  nombre: z.string().min(1, "El nombre es requerido").max(80),
  especie_id: z.string().uuid("Especie inválida"),
  raza: z.string().max(80).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  color: z.string().max(80).optional().or(z.literal("")),
  peso: z.string().optional().or(z.literal("")),
  sexo: z.enum(["macho", "hembra", "no_especificado"]).optional(),
  esterilizado: z.string().optional(),
})

async function obtenerClinicIdContexto(membresias: Array<{ clinic_id: string; activo: boolean; tipo: string }>): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get("vetyx_contexto")?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.clinicId) {
      const m = membresias.find((x) => x.clinic_id === parsed.clinicId && x.activo)
      return m?.clinic_id ?? null
    }
  } catch { /* ignore invalid cookie */ }
  return null
}

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

  let resolvedOwnerId: string

  if (owner_id) {
    const { data: dueno } = await supabase
      .from("duenos")
      .select("id, activo")
      .eq("id", owner_id)
      .single()

    if (!dueno) return { error: "Dueño no encontrado" }
    if (!dueno.activo) return { error: "No se puede registrar una mascota a un dueño inactivo" }
    resolvedOwnerId = owner_id
  } else {
    const res = await obtenerOCrearDuenoPersonal()
    if (!res.success) return { error: res.error }
    resolvedOwnerId = res.data.id
  }

  const clinicId = usuario.clinic_id ?? await obtenerClinicIdContexto(usuario.membresias ?? [])

  const { data: nuevo, error } = await supabase
    .from("mascotas")
    .insert({
      clinic_id: usuario.clinic_id,
      owner_id: resolvedOwnerId,
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
    .select("id")
    .single()

  if (error) return { error: error.message }

  if (clinicId && nuevo) {
    await supabase
      .from("clinic_patients")
      .upsert({
        clinic_id: clinicId,
        mascota_id: nuevo.id,
        activo: true,
        created_by: usuario.id,
      }, { onConflict: "clinic_id, mascota_id" })
  }

  limpiarCacheSesion()
  return { success: true }
}
