import { notFound } from "next/navigation"
import { crearClienteAccion } from "@/lib/supabase/action"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"
import { TabVacunas } from "@/components/vacunas/tab-vacunas"

interface Props {
  params: Promise<{ mascotaId: string }>
}

export default async function VacunasPage({ params }: Props) {
  const { mascotaId } = await params

  const sesion = await obtenerSesion()
  const usuario = sesion ? await obtenerUsuarioActual(sesion.user.id) : null
  const puedeCrear = usuario ? verificarPermiso(usuario.rol, "vacunas", "crear") : false

  const supabase = await crearClienteAccion()
  const { data: mascota } = await supabase
    .from("mascotas")
    .select("id, nombre, especie_id")
    .eq("id", mascotaId)
    .single()

  if (!mascota) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vacunas</h1>
        <p className="text-sm text-muted-foreground">{mascota.nombre}</p>
      </div>
      <TabVacunas mascotaId={mascota.id} especieId={mascota.especie_id} puedeCrear={puedeCrear} />
    </div>
  )
}
