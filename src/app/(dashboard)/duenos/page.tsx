import { EmptyState } from "@/components/shared/empty-state"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DuenosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dueños</h1>
        <Button>Nuevo dueño</Button>
      </div>
      <EmptyState
        icon={<Users className="size-12" />}
        titulo="Aún no has registrado ningún dueño"
        descripcion="Aún no has registrado ningún dueño."
        accion={{ label: "Registrar primer dueño", href: "#" }}
      />
    </div>
  )
}
