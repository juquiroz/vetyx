"use server"

import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"
import type { CatalogoVacuna } from "@/types/models"

export async function obtenerCatalogoVacunas(
  especieId: string,
): Promise<{ success: true; data: CatalogoVacuna[] } | { success: false; error: string }> {
  const sesion = await obtenerSesion()
  if (!sesion) return { success: false, error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(sesion.user.id)
  if (!usuario) return { success: false, error: "Usuario no encontrado" }

  const supabase = await crearClienteAccion()

  const { data } = await supabase
    .from("catalogo_vacunas")
    .select("id, nombre, especie_id, dosis_tipica, created_at")
    .or(`especie_id.eq.${especieId},especie_id.is.null`)
    .order("nombre")

  return { success: true, data: data ?? [] }
}
