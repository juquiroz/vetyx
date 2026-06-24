"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAccion } from "@/lib/supabase/action"
import type { CitaConRelaciones } from "@/types/models"

export async function obtenerCita(id: string): Promise<CitaConRelaciones | null> {
  const sesion = await obtenerSesion()
  if (!sesion) return null

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return null

  const permiso = verificarPermiso(usuario.rol, "citas", "ver")
  if (!permiso) return null

  const supabase = await crearClienteAccion()

  const { data } = await supabase
    .from("citas")
    .select("*, mascota:mascotas(id, nombre, especie:especies(id, nombre), dueno:duenos(id, nombre, telefono)), veterinario:usuarios(id, nombre, email, rol)")
    .eq("id", id)
    .filter("clinic_id", usuario.clinic_id !== null ? "eq" : "is", usuario.clinic_id)
    .single()

  return (data ?? null) as unknown as CitaConRelaciones | null
}
