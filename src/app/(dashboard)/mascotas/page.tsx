import { EmptyState } from "@/components/shared/empty-state"
import { PawPrint } from "lucide-react"

export default function MascotasPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mascotas</h1>
      <EmptyState
        icon={<PawPrint className="size-12" />}
        titulo="No hay mascotas registradas"
        descripcion="Aún no has registrado ninguna mascota."
      />
    </div>
  )
}
