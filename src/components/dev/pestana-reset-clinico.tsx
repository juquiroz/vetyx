"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { limpiarDatosClinicos } from "@/actions/dev/limpiar-datos-clinicos"

export function PestanaResetClinico() {
  const [confirmarAbierto, setConfirmarAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleReset() {
    setCargando(true)
    const res = await limpiarDatosClinicos()
    setCargando(false)
    setConfirmarAbierto(false)

    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("Datos clínicos eliminados correctamente")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Datos Clínicos</CardTitle>
        <CardDescription>
          Elimina todas las citas, historial médico, vacunas, mascotas y dueños.
          La clínica, los usuarios y la sesión se mantienen intactos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setConfirmarAbierto(true)}>
          Eliminar datos clínicos
        </Button>
        <ConfirmDialog
          abierto={confirmarAbierto}
          titulo="¿Eliminar todos los datos clínicos?"
          descripcion="Se eliminarán citas, historial, vacunas, mascotas y dueños. La clínica y usuarios se conservan. Esta acción no se puede deshacer."
          etiquetaConfirmar="Eliminar datos"
          onConfirmar={handleReset}
          onCancelar={() => setConfirmarAbierto(false)}
          cargando={cargando}
        />
      </CardContent>
    </Card>
  )
}
