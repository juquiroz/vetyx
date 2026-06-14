import { EmptyState } from "@/components/shared/empty-state"
import { UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MiembrosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Miembros del staff</h1>
        <Button>Invitar miembro</Button>
      </div>
      <EmptyState
        icon={<UserCog className="size-12" />}
        titulo="Aún no has invitado a nadie a tu clínica"
        descripcion="Aún no has invitado a nadie a tu clínica."
        accion={{ label: "Invitar miembro", href: "#" }}
      />
    </div>
  )
}
