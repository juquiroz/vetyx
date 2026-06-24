"use server"

import { crearClienteAdmin } from "@/lib/supabase/admin"

export async function limpiarTodo() {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Solo disponible en desarrollo" }
  }

  const admin = crearClienteAdmin()

  const { data: usuarios } = await admin
    .from("usuarios")
    .select("id")

  const { data: authUsers } = await admin.auth.admin.listUsers()
  const authIds = authUsers?.users.map((u) => u.id) ?? []

  if (usuarios?.length === 0 && authIds.length === 0) {
    return { success: true, mensaje: "No hay datos que limpiar" }
  }

  await admin.from("citas").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await admin.from("historial_medico").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await admin.from("vacunas").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await admin.from("mascotas").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await admin.from("duenos").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await admin.from("usuarios").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await admin.from("clinicas").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  if (authIds.length > 0) {
    for (const id of authIds) {
      await admin.auth.admin.deleteUser(id)
    }
  }

  return {
    success: true,
    mensaje: `Se eliminaron ${usuarios?.length ?? 0} usuarios de negocio y ${authIds.length} cuentas de auth. Redirigiendo a registro...`,
  }
}
