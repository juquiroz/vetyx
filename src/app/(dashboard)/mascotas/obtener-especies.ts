"use server"

import { crearClienteAccion } from "@/lib/supabase/action"

export interface EspecieOpcion {
  id: string
  nombre: string
}

export async function obtenerEspecies(): Promise<EspecieOpcion[]> {
  const supabase = await crearClienteAccion()
  const { data } = await supabase.from("especies").select("id, nombre").order("nombre")
  return data ?? []
}
