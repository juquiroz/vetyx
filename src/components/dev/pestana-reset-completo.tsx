"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useContexto } from "@/providers/contexto-provider"
import { limpiarClinicaCompleta } from "@/actions/dev/limpiar-clinica-completa"

export function PestanaResetCompleto() {
  const router = useRouter()
  const { clinicaNombre } = useContexto()
  const [nombreIngresado, setNombreIngresado] = useState("")
  const [resetIngresado, setResetIngresado] = useState("")
  const [cargando, setCargando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [segundos, setSegundos] = useState(5)
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalo.current) clearInterval(intervalo.current)
    }
  }, [])

  function iniciarCountdown() {
    setConfirmando(true)
    setSegundos(5)
    intervalo.current = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) {
          if (intervalo.current) clearInterval(intervalo.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function puedeConfirmar() {
    return (
      nombreIngresado === clinicaNombre &&
      resetIngresado === "RESET"
    )
  }

  async function handleReset() {
    if (segundos > 0) return

    setCargando(true)
    const res = await limpiarClinicaCompleta()
    setCargando(false)

    if (res?.error) {
      toast.error(res.error)
      setConfirmando(false)
      setSegundos(5)
    } else {
      toast.success("Clínica eliminada. Redirigiendo...")
      router.push("/registro")
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Reset Clínica Completa</CardTitle>
        <CardDescription>
          Elimina permanentemente toda la clínica incluyendo usuarios, datos y
          cuentas de autenticación. Esta acción no se puede deshacer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Escribe el nombre de la clínica: <span className="font-bold">{clinicaNombre}</span>
          </p>
          <Input
            placeholder="Nombre de la clínica"
            value={nombreIngresado}
            onChange={(e) => setNombreIngresado(e.target.value)}
            disabled={confirmando}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Escribe <span className="font-bold">RESET</span> para confirmar
          </p>
          <Input
            placeholder="RESET"
            value={resetIngresado}
            onChange={(e) => setResetIngresado(e.target.value)}
            disabled={confirmando}
          />
        </div>
        {!confirmando ? (
          <Button
            variant="destructive"
            disabled={!puedeConfirmar()}
            onClick={iniciarCountdown}
          >
            Eliminar clínica permanentemente
          </Button>
        ) : segundos > 0 ? (
          <Button variant="destructive" disabled>
            Espera {segundos}s para confirmar...
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={cargando}
          >
            {cargando ? "Eliminando..." : "Confirmar eliminación definitiva"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
