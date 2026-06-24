import { Timeline } from "@/components/historial/timeline"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { verificarPermiso } from "@/lib/auth/check-permission"

export default async function HistorialPage({
  params,
}: {
  params: Promise<{ mascotaId: string }>
}) {
  const { mascotaId } = await params

  const sesion = await obtenerSesion()
  const usuario = sesion ? await obtenerUsuarioActual(sesion.user.id) : null
  const puedeCrear = usuario ? verificarPermiso(usuario.rol, "historial", "crear") : false

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historial médico</h1>
      <Timeline mascotaId={mascotaId} puedeCrear={puedeCrear} />
    </div>
  )
}
