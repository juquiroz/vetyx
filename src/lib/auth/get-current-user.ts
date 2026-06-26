import { crearClienteAccion } from "@/lib/supabase/action"

import type { ClinicMembershipConClinica } from "@/types/models"

export interface UsuarioActual {
  id: string
  clinic_id: string | null
  rol: "admin" | "vet" | "recepcionista" | "dueño"
  nombre: string
  email?: string
  telefono?: string | null
  membresias?: ClinicMembershipConClinica[]
}

export async function obtenerUsuarioActual(
  userId: string
): Promise<UsuarioActual | null> {
  const supabase = await crearClienteAccion()
  const { data } = await supabase
    .from("usuarios")
    .select("id, clinic_id, rol, nombre, email, telefono")
    .eq("id", userId)
    .single()

  if (!data) return null

  type RawMembership = {
    id: string
    clinic_id: string
    tipo: string
    rol: string | null
    activo: boolean
    created_at: string
    updated_at: string
    clinica: { nombre: string; slug: string }
  }

  const { data: membresiasData } = await supabase
    .from("clinic_memberships")
    .select("id, clinic_id, tipo, rol, activo, created_at, updated_at, clinica:clinicas(nombre, slug)")
    .eq("user_id", userId)
    .eq("activo", true)

  const membresias: ClinicMembershipConClinica[] = ((membresiasData as unknown as RawMembership[]) ?? [])
    .filter((m): m is RawMembership => m.clinica !== null)
    .map((m) => ({
      id: m.id,
      clinic_id: m.clinic_id,
      user_id: userId,
      tipo: m.tipo,
      rol: m.rol,
      activo: m.activo,
      created_at: m.created_at,
      updated_at: m.updated_at,
      clinica_nombre: m.clinica.nombre,
      clinica_slug: m.clinica.slug,
    }))

  const staffMembership = membresias.find(m => m.tipo === "staff")

  const usuario: UsuarioActual = {
    id: data.id,
    clinic_id: staffMembership?.clinic_id ?? data.clinic_id,
    rol: (staffMembership?.rol ?? data.rol) as UsuarioActual["rol"],
    nombre: data.nombre,
    email: data.email ?? undefined,
    telefono: data.telefono,
    membresias,
  }

  return usuario
}

export function limpiarCacheUsuario(_userId?: string) {}
