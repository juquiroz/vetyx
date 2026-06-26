import { crearClienteAccion } from "@/lib/supabase/action"
import type { Session } from "@supabase/supabase-js"

export async function obtenerSesion(): Promise<Session | null> {
  const supabase = await crearClienteAccion()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return { user } as Session
}

export function limpiarCacheSesion() {}
