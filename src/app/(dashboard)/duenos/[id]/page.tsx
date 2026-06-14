import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { PawPrint, Users } from "lucide-react"

export default async function PerfilDuenoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Perfil del dueño</h1>
        <Button variant="outline">Editar</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Dueño
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mascotas</h2>
          <Button size="sm">Agregar mascota</Button>
        </div>
        <EmptyState
          icon={<PawPrint className="size-8" />}
          titulo="Este dueño aún no tiene mascotas registradas"
          descripcion="Este dueño aún no tiene mascotas registradas."
          accion={{ label: "Agregar primera mascota", href: "#" }}
        />
      </div>
    </div>
  )
}
