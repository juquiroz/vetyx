import { cookies } from "next/headers"
import { crearClienteAccion } from "@/lib/supabase/action"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"

export type ContextoLeido = {
  tipo: "personal" | "cliente" | "staff"
  clinicId?: string
  clinicNombre?: string
}

const COOKIE_NAME = "vetyx_contexto"

export async function getActiveContext(): Promise<ContextoLeido> {
  const supabase = await crearClienteAccion()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { tipo: "personal" }

  const usuario = await obtenerUsuarioActual(user.id)
  if (!usuario) return { tipo: "personal" }

  const membresias = usuario.membresias ?? []

  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value

  let parsed: { tipo: string; clinicId?: string } | null = null
  try {
    parsed = JSON.parse(raw ?? "")
  } catch {
    if (raw === "personal") parsed = { tipo: "personal" }
  }

  if (parsed) {
    if (parsed.tipo === "personal")
      return { tipo: "personal" }

    if (parsed.tipo === "cliente" && parsed.clinicId) {
      const m = membresias.find(
        (x) => x.tipo === "cliente" && x.clinic_id === parsed.clinicId && x.activo,
      )
      if (m) return { tipo: "cliente", clinicId: m.clinic_id, clinicNombre: m.clinica_nombre }
    }

    if (parsed.tipo === "staff" && parsed.clinicId) {
      const m = membresias.find(
        (x) => x.tipo === "staff" && x.clinic_id === parsed.clinicId && x.activo,
      )
      if (m) return { tipo: "staff", clinicId: m.clinic_id, clinicNombre: m.clinica_nombre }
    }
  }

  const staff = membresias.find((x) => x.tipo === "staff" && x.activo)
  if (staff) return { tipo: "staff", clinicId: staff.clinic_id, clinicNombre: staff.clinica_nombre }

  const cliente = membresias.find((x) => x.tipo === "cliente" && x.activo)
  if (cliente) return { tipo: "cliente", clinicId: cliente.clinic_id, clinicNombre: cliente.clinica_nombre }

  return { tipo: "personal" }
}

export function serializarContexto(tipo: string, clinicId?: string): string {
  return JSON.stringify({ tipo, clinicId })
}
