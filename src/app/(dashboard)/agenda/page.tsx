"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CrearCitaModal } from "./components/crear-cita-modal"
import { listarCitas } from "@/actions/citas/listar"
import type { CitaConRelaciones } from "@/types/models"

const ETIQUETA_ESTADO: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  scheduled: { label: "Programada", variant: "outline" },
  confirmed: { label: "Confirmada", variant: "default" },
  in_progress: { label: "En curso", variant: "secondary" },
  completed: { label: "Completada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  no_show: { label: "No asistió", variant: "destructive" },
}

function formatearHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}

function esHoy(fecha: string) {
  const hoy = new Date()
  const f = new Date(fecha)
  return f.toDateString() === hoy.toDateString()
}

function fechaLegible(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function AgendaPage() {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [citas, setCitas] = useState<CitaConRelaciones[]>([])
  const [cargando, setCargando] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    setCargando(true)
    listarCitas(fecha).then((data) => {
      setCitas(data)
      setCargando(false)
    })
  }, [fecha])

  function cambiarDia(delta: number) {
    const d = new Date(fecha)
    d.setDate(d.getDate() + delta)
    setFecha(d.toISOString().split("T")[0])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={() => setModalAbierto(true)}>Nueva cita</Button>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => cambiarDia(-1)}>
          ← Día anterior
        </Button>
        <span className="text-sm font-medium">
          {esHoy(fecha) ? "Hoy — " : ""}{fechaLegible(fecha)}
        </span>
        <Button variant="outline" size="sm" onClick={() => cambiarDia(1)}>
          Día siguiente →
        </Button>
      </div>

      {cargando ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-60" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : citas.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-12" />}
          titulo="No hay citas programadas"
          descripcion="No hay citas programadas para este día."
          accion={{ label: "Agendar cita", onClick: () => setModalAbierto(true) }}
        />
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => (
            <Card key={cita.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">
                    {formatearHora(cita.fecha_hora)} — {cita.mascota?.nombre}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="size-3.5" />
                    <span>{cita.duracion_minutos} min</span>
                    <MapPin className="size-3.5 ml-1" />
                    <span>{cita.veterinario?.nombre}</span>
                  </div>
                </div>
                <Badge variant={ETIQUETA_ESTADO[cita.estado]?.variant ?? "outline"}>
                  {ETIQUETA_ESTADO[cita.estado]?.label ?? cita.estado}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dueño: {cita.mascota?.dueno?.nombre} {cita.mascota?.dueno?.telefono ? `— ${cita.mascota.dueno.telefono}` : ""}
                </p>
                {cita.motivo && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Motivo: {cita.motivo}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CrearCitaModal
        abierto={modalAbierto}
        onOpenChange={setModalAbierto}
      />
    </div>
  )
}
