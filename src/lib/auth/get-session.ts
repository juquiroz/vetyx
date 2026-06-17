import { crearClienteAccion } from "@/lib/supabase/action"
import type { Session } from "@supabase/supabase-js"

let cacheSession: Session | null | undefined

export async function obtenerSesion(): Promise<Session | null> {
  if (cacheSession !== undefined) return cacheSession

  const supabase = await crearClienteAccion()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    cacheSession = null
    return null
  }

  cacheSession = { user } as Session
  return cacheSession
}

export function limpiarCacheSesion() {
  cacheSession = undefined
}
