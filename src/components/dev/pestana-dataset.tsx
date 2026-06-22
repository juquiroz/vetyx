"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { sembrarDatosDemo } from "@/actions/dev/sembrar-datos"

export function PestanaDataset() {
  const [confirmarAbierto, setConfirmarAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [resumen, setResumen] = useState<{ vets: number; duenos: number; mascotas: number } | null>(null)

  async function handleSembrar() {
    setCargando(true)
    const res = await sembrarDatosDemo()
    setCargando(false)
    setConfirmarAbierto(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      setResumen(res.resumen ?? null)
      toast.success("Datos de demostración creados")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Demo</CardTitle>
        <CardDescription>
          Crea datos de prueba: 2 veterinarios, 10 dueños, 15 mascotas, citas y vacunas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => setConfirmarAbierto(true)} disabled={cargando}>
          {cargando ? "Creando datos..." : "Crear dataset demo"}
        </Button>
        <ConfirmDialog
          abierto={confirmarAbierto}
          titulo="¿Crear dataset de demo?"
          descripcion="Se crearán 2 veterinarios, 10 dueños, 15 mascotas, citas de ejemplo y vacunas. Los datos existentes se conservan."
          etiquetaConfirmar="Crear datos"
          variante="default"
          onConfirmar={handleSembrar}
          onCancelar={() => setConfirmarAbierto(false)}
          cargando={cargando}
        />
        {resumen && (
          <div className="rounded-md border bg-muted/50 p-3 text-sm">
            <p className="font-medium">Datos creados:</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              <li>{resumen.vets} veterinarios</li>
              <li>{resumen.duenos} dueños</li>
              <li>{resumen.mascotas} mascotas</li>
              <li>Citas y vacunas de ejemplo</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
