import { crearClienteAccion } from "@/lib/supabase/action"
import type { Session } from "@supabase/supabase-js"

let cacheSession: Session | null | undefined

export async function obtenerSesion(): Promise<Session | null> {
  if (cacheSession !== undefined) return cacheSession

  const supabase = await crearClienteAccion()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  cacheSession = session
  return session
}

export function limpiarCacheSesion() {
  cacheSession = undefined
}
