"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { obtenerSesion, limpiarCacheSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"

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

const esquema = z.object({
  dueno_nombre: z.string().min(1, "El nombre del dueño es requerido").max(120),
  dueno_telefono: z.string().min(1, "El teléfono del dueño es requerido").max(20),
  dueno_email: z.string().email("Email inválido").optional().or(z.literal("")),
  dueno_cedula: z.string().max(50).optional().or(z.literal("")),
  mascota_nombre: z.string().min(1, "El nombre de la mascota es requerido").max(80),
  especie_id: z.string().uuid("Especie inválida"),
  raza: z.string().max(80).optional().or(z.literal("")),
  color: z.string().max(80).optional().or(z.literal("")),
  sexo: z.enum(["macho", "hembra", "no_especificado"]).optional(),
})

export async function crearMascotaConDueno(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "mascotas", "crear")
  if (!permiso) return { error: "Permiso denegado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { dueno_nombre, dueno_telefono, dueno_email, dueno_cedula, mascota_nombre, especie_id, raza, color, sexo } = parsed.data
  const supabase = await crearClienteAccion()

  const { data: existente } = await supabase
    .from("duenos")
    .select("id")
    .eq("telefono", dueno_telefono)
    .maybeSingle()

  let owner_id: string

  if (existente) {
    owner_id = existente.id
  } else {
    const { data: nuevoDueno, error: duenoError } = await supabase
      .from("duenos")
      .insert({
        clinic_id: usuario.clinic_id,
        user_id: usuario.id,
        cedula: dueno_cedula || null,
        nombre: dueno_nombre,
        telefono: dueno_telefono,
        email: dueno_email || null,
        created_by: usuario.id,
      })
      .select("id")
      .single()

    if (duenoError) return { error: duenoError.message }
    owner_id = nuevoDueno.id
  }

  const { error: mascotaError } = await supabase.from("mascotas").insert({
    clinic_id: usuario.clinic_id,
    owner_id,
    especie_id,
    nombre: mascota_nombre,
    raza: raza || null,
    color: color || null,
    sexo: sexo ?? "no_especificado",
    created_by: usuario.id,
  })

  if (mascotaError) return { error: mascotaError.message }

  const clinicId = usuario.clinic_id ?? await obtenerClinicIdContexto(usuario.membresias ?? [])

  if (clinicId) {
    const { error: ccError } = await supabase
      .from("clinic_clients")
      .upsert({
        clinic_id: clinicId,
        dueno_id: owner_id,
        activo: true,
        created_by: usuario.id,
      }, { onConflict: "clinic_id, dueno_id" })
    if (ccError) return { error: ccError.message }

    const { data: nuevaMascota } = await supabase
      .from("mascotas")
      .select("id")
      .eq("owner_id", owner_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (nuevaMascota) {
      const { error: cpError } = await supabase
        .from("clinic_patients")
        .upsert({
          clinic_id: clinicId,
          mascota_id: nuevaMascota.id,
          activo: true,
          created_by: usuario.id,
        }, { onConflict: "clinic_id, mascota_id" })
      if (cpError) return { error: cpError.message }
    }
  }

  limpiarCacheSesion()
  return { success: true }
}
