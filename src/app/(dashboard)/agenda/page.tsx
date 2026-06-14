import { EmptyState } from "@/components/shared/empty-state"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AgendaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button>Nueva cita</Button>
      </div>
      <EmptyState
        icon={<Calendar className="size-12" />}
        titulo="No hay citas programadas"
        descripcion="No hay citas programadas para este día."
        accion={{ label: "Agendar cita", href: "/agenda" }}
      />
    </div>
  )
}
