import { EmptyState } from "@/components/shared/empty-state"
import { LayoutDashboard } from "lucide-react"

export default function InicioPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inicio</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Ingresos</p>
          <EmptyState
            icon={<LayoutDashboard className="size-8" />}
            titulo="No hay ingresos registrados"
            descripcion="No hay ingresos registrados este período."
            accion={{ label: "Registrar primera cita", href: "/agenda" }}
          />
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Ocupación</p>
          <EmptyState
            icon={<LayoutDashboard className="size-8" />}
            titulo="No hay citas programadas"
            descripcion="No hay citas programadas."
            accion={{ label: "Agendar primera cita", href: "/agenda" }}
          />
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Pacientes activos</p>
          <EmptyState
            icon={<LayoutDashboard className="size-8" />}
            titulo="No hay pacientes registrados"
            descripcion="No hay pacientes registrados."
            accion={{ label: "Registrar primera mascota", href: "/duenos" }}
          />
        </div>
      </div>
    </div>
  )
}
