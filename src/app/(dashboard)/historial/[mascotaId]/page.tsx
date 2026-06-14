import { EmptyState } from "@/components/shared/empty-state"
import { Clock } from "lucide-react"

export default async function HistorialPage({
  params,
}: {
  params: Promise<{ mascotaId: string }>
}) {
  const { mascotaId } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historial médico</h1>
      <p className="text-sm text-muted-foreground">Mascota ID: {mascotaId}</p>
      <EmptyState
        icon={<Clock className="size-12" />}
        titulo="Este paciente no tiene eventos registrados"
        descripcion="Este paciente no tiene eventos registrados."
        accion={{ label: "Registrar primera consulta", href: "#" }}
      />
    </div>
  )
}
