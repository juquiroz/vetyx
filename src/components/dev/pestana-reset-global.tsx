"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { limpiarTodo } from "@/actions/dev/limpiar-todo"

export function PestanaResetGlobal() {
  const router = useRouter()
  const [confirmacion, setConfirmacion] = useState("")
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
    return confirmacion === "ELIMINAR TODO"
  }

  async function handleReset() {
    if (segundos > 0) return

    setCargando(true)
    const res = await limpiarTodo()
    setCargando(false)

    if (res?.error) {
      toast.error(res.error)
      setConfirmando(false)
      setSegundos(5)
    } else {
      toast.success(res.mensaje ?? "Base de datos limpiada")
      router.push("/registro")
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Reset Global</CardTitle>
        <CardDescription>
          Elimina TODOS los datos de TODAS las clínicas: citas, historial, vacunas,
          mascotas, dueños, usuarios, clínicas y cuentas de autenticación.
          No requiere sesión activa. Esta acción no se puede deshacer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Escribe <span className="font-bold">ELIMINAR TODO</span> para confirmar
          </p>
          <Input
            placeholder="ELIMINAR TODO"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            disabled={confirmando}
          />
        </div>
        {!confirmando ? (
          <Button
            variant="destructive"
            className="w-full"
            disabled={!puedeConfirmar()}
            onClick={iniciarCountdown}
          >
            Eliminar toda la base de datos
          </Button>
        ) : segundos > 0 ? (
          <Button variant="destructive" className="w-full" disabled>
            Espera {segundos}s para confirmar...
          </Button>
        ) : (
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleReset}
            disabled={cargando}
          >
            {cargando ? "Eliminando..." : "Confirmar eliminación global"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
