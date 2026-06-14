import { EmptyState } from "@/components/shared/empty-state"
import { Clock, Syringe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PawPrint } from "lucide-react"

export default async function FichaMascotaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ficha del paciente</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PawPrint className="size-5" />
            Mascota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Línea de tiempo</h2>
          <Button size="sm">Nuevo evento</Button>
        </div>
        <EmptyState
          icon={<Clock className="size-8" />}
          titulo="Este paciente no tiene eventos registrados"
          descripcion="Este paciente no tiene eventos registrados."
          accion={{ label: "Registrar primera consulta", href: "#" }}
        />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Vacunas</h2>
          <Button size="sm">Registrar vacuna</Button>
        </div>
        <EmptyState
          icon={<Syringe className="size-8" />}
          titulo="Este paciente no tiene vacunas registradas"
          descripcion="Este paciente no tiene vacunas registradas."
          accion={{ label: "Registrar primera vacuna", href: "#" }}
        />
      </div>
    </div>
  )
}
