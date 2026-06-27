"use server"

import { z } from "zod"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { crearClienteAdmin } from "@/lib/supabase/admin"

const esquema = z.object({
  email: z.string().email("Email inválido"),
})

export async function agregarCliente(input: FormData) {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const permiso = verificarPermiso(usuario.rol, "clientes", "agregar")
  if (!permiso) return { error: "Permiso denegado" }

  if (!usuario.clinic_id) return { error: "Debes pertenecer a una clínica para agregar clientes" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos", detalles: parsed.error.flatten() }

  const { email } = parsed.data
  if (email === session.user.email) return { error: "No puedes agregarte a ti mismo" }

  const supabase = crearClienteAdmin()

  const { data: existente } = await supabase
    .from("usuarios")
    .select("id, nombre, email")
    .eq("email", email)
    .maybeSingle()

  if (!existente) {
    return { error: "El usuario no está registrado en Vetyx. Pídele que cree una cuenta primero y vuelve a intentar." }
  }

  const { data: membresiaExistente } = await supabase
    .from("clinic_memberships")
    .select("id")
    .eq("user_id", existente.id)
    .eq("clinic_id", usuario.clinic_id)
    .maybeSingle()

  if (membresiaExistente) {
    return { error: "Este usuario ya está vinculado a la clínica" }
  }

  const { error: insertError } = await supabase.from("clinic_memberships").insert({
    user_id: existente.id,
    clinic_id: usuario.clinic_id,
    tipo: "cliente",
    rol: null,
  })

  if (insertError) return { error: insertError.message }

  // Buscar todos los duenos del usuario (personal global + legacy con clinic_id)
  const { data: duenos } = await supabase
    .from("duenos")
    .select("id")
    .eq("user_id", existente.id)
    .limit(1)

  if (!duenos || duenos.length === 0) {
    return { error: "El usuario no tiene un perfil de dueño registrado. Pídele que complete su registro primero." }
  }

  const duenoPrincipal = duenos[0]

  // Crear clinic_clients (relación comercial: clínica ↔ dueño)
  const { data: ccExistente } = await supabase
    .from("clinic_clients")
    .select("id")
    .eq("dueno_id", duenoPrincipal.id)
    .eq("clinic_id", usuario.clinic_id)
    .maybeSingle()

  if (!ccExistente) {
    const { error: ccError } = await supabase.from("clinic_clients").insert({
      clinic_id: usuario.clinic_id,
      dueno_id: duenoPrincipal.id,
      created_by: usuario.id,
    })
    if (ccError) return { error: ccError.message }
  }

  // Migrar mascotas existentes del dueño a clinic_patients
  const duenoIds = duenos.map((d) => d.id)
  const { data: mascotas } = await supabase
    .from("mascotas")
    .select("id")
    .in("owner_id", duenoIds)
    .eq("activo", true)

  if (mascotas && mascotas.length > 0) {
    const { error: cpError } = await supabase.from("clinic_patients").upsert(
      mascotas.map((m) => ({
        clinic_id: usuario.clinic_id!,
        mascota_id: m.id,
        created_by: usuario.id,
      })),
      { onConflict: "clinic_id, mascota_id", ignoreDuplicates: true }
    )
    if (cpError) return { error: cpError.message }
  }

  return { success: true, mensaje: `${existente.nombre} ha sido agregado como cliente` }
}
