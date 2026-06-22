"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { crearClienteAdmin } from "@/lib/supabase/admin"

export function PestanaExportImport() {
  const [exportando, setExportando] = useState(false)
  const [importando, setImportando] = useState(false)

  async function handleExport() {
    setExportando(true)

    try {
      const admin = crearClienteAdmin()
      const tablas = ["duenos", "mascotas", "citas", "historial_medico", "vacunas"] as const
      const datos: Record<string, unknown> = {}

      for (const tabla of tablas) {
        const { data } = await admin.from(tabla).select("*")
        datos[tabla] = data ?? []
      }

      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `vetyx-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Datos exportados correctamente")
    } catch {
      toast.error("Error al exportar datos")
    } finally {
      setExportando(false)
    }
  }

  async function handleImport() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setImportando(true)
      try {
        const texto = await file.text()
        const datos = JSON.parse(texto)

        const admin = crearClienteAdmin()
        const orden = ["duenos", "mascotas", "citas", "historial_medico", "vacunas"] as const

        for (const tabla of orden) {
          const filas = datos[tabla]
          if (Array.isArray(filas) && filas.length > 0) {
            const { error } = await admin.from(tabla).insert(filas)
            if (error) throw new Error(`Error en ${tabla}: ${error.message}`)
          }
        }

        toast.success("Datos importados correctamente")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al importar datos")
      } finally {
        setImportando(false)
      }
    }

    input.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export / Import JSON</CardTitle>
        <CardDescription>
          Exporta los datos de la clínica a un archivo JSON o impórtalos desde uno existente.
          Útil para migrar datos entre ambientes de desarrollo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button variant="outline" onClick={handleExport} disabled={exportando}>
          {exportando ? "Exportando..." : "Exportar JSON"}
        </Button>
        <Button variant="outline" onClick={handleImport} disabled={importando}>
          {importando ? "Importando..." : "Importar JSON"}
        </Button>
      </CardContent>
    </Card>
  )
}
