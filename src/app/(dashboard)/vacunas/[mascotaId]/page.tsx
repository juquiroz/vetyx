import { EmptyState } from "@/components/shared/empty-state"
import { Syringe } from "lucide-react"

export default async function VacunasPage({
  params,
}: {
  params: Promise<{ mascotaId: string }>
}) {
  const { mascotaId } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vacunas</h1>
      <p className="text-sm text-muted-foreground">Mascota ID: {mascotaId}</p>
      <EmptyState
        icon={<Syringe className="size-12" />}
        titulo="Este paciente no tiene vacunas registradas"
        descripcion="Este paciente no tiene vacunas registradas."
        accion={{ label: "Registrar primera vacuna", href: "#" }}
      />
    </div>
  )
}
