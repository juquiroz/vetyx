import { crearClienteAccion } from "@/lib/supabase/action"

export interface UsuarioActual {
  id: string
  clinic_id: string
  rol: "admin" | "vet" | "recepcionista"
  nombre: string
}

const cacheUsuario = new Map<string, UsuarioActual>()

export async function obtenerUsuarioActual(
  userId: string
): Promise<UsuarioActual | null> {
  if (cacheUsuario.has(userId)) return cacheUsuario.get(userId)!

  const supabase = await crearClienteAccion()
  const { data } = await supabase
    .from("usuarios")
    .select("id, clinic_id, rol, nombre")
    .eq("id", userId)
    .single()

  if (!data) return null

  const usuario: UsuarioActual = {
    id: data.id,
    clinic_id: data.clinic_id,
    rol: data.rol as UsuarioActual["rol"],
    nombre: data.nombre,
  }

  cacheUsuario.set(userId, usuario)
  return usuario
}

export function limpiarCacheUsuario(userId?: string) {
  if (userId) cacheUsuario.delete(userId)
  else cacheUsuario.clear()
}
