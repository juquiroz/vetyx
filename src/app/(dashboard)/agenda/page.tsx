"use client"

import { useState, useCallback } from "react"
import { AgendaGrid } from "@/components/agenda/agenda-grid"
import { CrearCitaModal } from "./components/crear-cita-modal"
import { DetalleCitaModal } from "./components/detalle-cita-modal"
import { EmptyState } from "@/components/shared/empty-state"
import { useContexto } from "@/providers/contexto-provider"
import { Calendar } from "lucide-react"

export default function AgendaPage() {
  const { contextoActivo } = useContexto()

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [fechaSlot, setFechaSlot] = useState<string | undefined>()
  const [horaSlot, setHoraSlot] = useState<string | undefined>()

  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false)
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState<string | null>(null)

  const abrirModalCrear = useCallback((fechaHora?: string) => {
    if (fechaHora) {
      const d = new Date(fechaHora)
      const fecha = d.toISOString().split("T")[0]
      const hora = d.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      setFechaSlot(fecha)
      setHoraSlot(hora)
    } else {
      setFechaSlot(undefined)
      setHoraSlot(undefined)
    }
    setModalCrearAbierto(true)
  }, [])

  const abrirModalDetalle = useCallback((citaId: string) => {
    setCitaSeleccionadaId(citaId)
    setModalDetalleAbierto(true)
  }, [])

  function handleCambio() {
    setCitaSeleccionadaId(null)
  }

  if (contextoActivo.tipo === "personal") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <EmptyState
          icon={<Calendar className="size-12" />}
          titulo="Selecciona una clínica"
          descripcion="Cambia a contexto Cliente o Staff para ver la agenda."
        />
      </div>
    )
  }

  const soloLectura = contextoActivo.tipo === "cliente"
  const titulo = soloLectura ? "Mis Citas" : "Agenda"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{titulo}</h1>
      </div>

      <AgendaGrid
        soloLectura={soloLectura}
        onCreateCita={abrirModalCrear}
        onClickEvento={abrirModalDetalle}
      />

      {!soloLectura && (
        <CrearCitaModal
          abierto={modalCrearAbierto}
          onOpenChange={setModalCrearAbierto}
          fecha={fechaSlot}
          hora={horaSlot}
        />
      )}

      <DetalleCitaModal
        citaId={citaSeleccionadaId}
        abierto={modalDetalleAbierto}
        onOpenChange={(open) => {
          setModalDetalleAbierto(open)
          if (!open) setCitaSeleccionadaId(null)
        }}
        onCambio={handleCambio}
      />
    </div>
  )
}
