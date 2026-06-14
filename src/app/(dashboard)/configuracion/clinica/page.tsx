import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConfigClinicaPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración de la clínica</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos de la clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Formulario de edición próximamente.</p>
        </CardContent>
      </Card>
    </div>
  )
}
