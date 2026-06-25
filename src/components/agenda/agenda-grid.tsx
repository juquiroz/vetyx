"use client"

import { useState, useEffect, useCallback } from "react"
import { obtenerCitasRango } from "@/actions/citas/obtener-citas-rango"
import { mapearDia, mapearSemana } from "@/lib/agenda"
import type { FilaAgenda, EventoAgenda, ColumnaAgenda } from "@/lib/agenda"
import type { CitaConRelaciones } from "@/types/models"
import type { VeterinarioOpcion } from "@/actions/citas/obtener-veterinarios"
import { obtenerVeterinarios } from "@/actions/citas/obtener-veterinarios"
import { AgendaToolbar } from "./agenda-toolbar"
import { AgendaColumn } from "./agenda-column"
import { AgendaSlot } from "./agenda-slot"
import { AgendaEventCard } from "./agenda-event-card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { Calendar } from "lucide-react"
import { ZONA_HORARIA_DEFAULT } from "@/config/constants"

function obtenerInicioSemana(fechaStr: string): Date {
  const d = new Date(fechaStr + "T12:00:00")
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function sumarDias(fecha: Date, dias: number): string {
  const d = new Date(fecha)
  d.setDate(d.getDate() + dias)
  return d.toISOString().split("T")[0]
}

function esHoy(fechaStr: string): boolean {
  const hoy = new Date()
  return fechaStr === hoy.toISOString().split("T")[0]
}

function formatearTituloDia(fechaStr: string): string {
  const d = new Date(fechaStr + "T12:00:00")
  const hoy = new Date()
  const esHoyBool = fechaStr === hoy.toISOString().split("T")[0]
  const fechaLocal = d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return esHoyBool ? `Hoy — ${fechaLocal}` : fechaLocal
}

function formatearTituloSemana(fechaStr: string): string {
  const inicio = obtenerInicioSemana(fechaStr)
  const fin = new Date(inicio)
  fin.setDate(fin.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }
  return `${inicio.toLocaleDateString("es-MX", opts)} – ${fin.toLocaleDateString("es-MX", opts)}`
}

interface AgendaGridProps {
  onCreateCita: (fechaHora?: string) => void
  onClickEvento?: (citaId: string) => void
  soloLectura?: boolean
}

export function AgendaGrid({ onCreateCita, onClickEvento, soloLectura = false }: AgendaGridProps) {
  const [vista, setVista] = useState<"dia" | "semana">("dia")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [veterinarioId, setVeterinarioId] = useState("")
  const [veterinarios, setVeterinarios] = useState<VeterinarioOpcion[]>([])
  const [columnas, setColumnas] = useState<ColumnaAgenda[]>([])
  const [filas, setFilas] = useState<FilaAgenda[]>([])
  const [eventos, setEventos] = useState<EventoAgenda[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    obtenerVeterinarios().then((vets) => {
      setVeterinarios(vets)
      setCargando(false)
    })
  }, [])

  const cargarGrid = useCallback(async () => {
    setCargando(true)

    let fechaInicio: string
    let fechaFin: string

    if (vista === "dia") {
      fechaInicio = `${fecha}T00:00:00.000Z`
      fechaFin = `${fecha}T23:59:59.999Z`
    } else {
      const inicioSemana = obtenerInicioSemana(fecha)
      const finSemana = new Date(inicioSemana)
      finSemana.setDate(finSemana.getDate() + 6)
      fechaInicio = inicioSemana.toISOString().split("T")[0] + "T00:00:00.000Z"
      fechaFin = finSemana.toISOString().split("T")[0] + "T23:59:59.999Z"
    }

    try {
      const citas = await obtenerCitasRango({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        veterinario_id: veterinarioId || undefined,
      })

      if (vista === "dia") {
        const resultado = mapearDia({
          fecha,
          citas,
          veterinarios,
        })
        setColumnas(resultado.columnas)
        setFilas(resultado.filas)
        setEventos(resultado.eventos)
      } else {
        const resultado = mapearSemana({
          fecha,
          citas,
          veterinarios,
          timezone: ZONA_HORARIA_DEFAULT,
        })
        setColumnas(resultado.columnas)
        setFilas(resultado.filas)
        setEventos(resultado.eventos)
      }
    } catch {
      setColumnas([])
      setFilas([])
      setEventos([])
    } finally {
      setCargando(false)
    }
  }, [fecha, vista, veterinarioId, veterinarios])

  useEffect(() => {
    cargarGrid()
  }, [cargarGrid])

  function manejarNavegar(delta: number) {
    if (vista === "dia") {
      setFecha(sumarDias(new Date(fecha + "T12:00:00"), delta))
    } else {
      setFecha(sumarDias(new Date(fecha + "T12:00:00"), delta * 7))
    }
  }

  function manejarClickSlot(fila?: FilaAgenda) {
    if (soloLectura) return
    onCreateCita(fila?.fecha_hora_utc)
  }

  const titulo = vista === "dia"
    ? formatearTituloDia(fecha)
    : formatearTituloSemana(fecha)

  const numColumnas = columnas.length
  const templateCols = `60px repeat(${numColumnas}, minmax(180px, 1fr))`

  return (
    <div className="space-y-4">
      {!soloLectura && (
        <AgendaToolbar
          vista={vista}
          onChangeVista={setVista}
          fecha={fecha}
          titulo={titulo}
          onNavegar={manejarNavegar}
          veterinarioId={veterinarioId}
          onChangeVeterinario={setVeterinarioId}
          veterinarios={veterinarios}
          onCreateCita={() => manejarClickSlot()}
        />
      )}

      {cargando ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] w-full" />
          ))}
        </div>
      ) : numColumnas === 0 ? (
        <EmptyState
          icon={<Calendar className="size-12" />}
          titulo={vista === "dia" ? "No hay citas para este día" : "No hay citas esta semana"}
          descripcion={
            vista === "dia"
              ? "No hay citas programadas para este día."
              : "No hay citas programadas esta semana."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{ gridTemplateColumns: templateCols }}
          >
            <div className="sticky left-0 z-10 bg-background" />

            {columnas.map((col) => (
              <AgendaColumn
                key={col.id}
                nombre={col.nombre}
                fecha={col.fecha}
                esHoy={col.fecha ? esHoy(col.fecha) : false}
              />
            ))}

            {filas.map((fila) => (
              <SlotRow
                key={fila.indice}
                fila={fila}
                numColumnas={numColumnas}
                eventos={eventos.filter((e) => e.fila === fila.indice)}
                vista={vista}
                soloLectura={soloLectura}
                onClickSlot={manejarClickSlot}
                onClickEvento={onClickEvento}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SlotRow({
  fila,
  numColumnas,
  eventos,
  vista,
  soloLectura,
  onClickSlot,
  onClickEvento,
}: {
  fila: FilaAgenda
  numColumnas: number
  eventos: EventoAgenda[]
  vista: string
  soloLectura: boolean
  onClickSlot: (fila?: FilaAgenda) => void
  onClickEvento?: (citaId: string) => void
}) {
  const celdasOcupadas = new Set(eventos.map((e) => e.columna))

  return (
    <>
      <div className="sticky left-0 z-10 flex items-start border-b border-r border-border/50 bg-background px-1 pt-1">
        <span className="text-[11px] text-muted-foreground">
          {fila.hora}
        </span>
      </div>

      {Array.from({ length: numColumnas }).map((_, colIdx) => {
        const evento = eventos.find((e) => e.columna === colIdx)

        if (evento) {
          return (
            <AgendaSlot key={colIdx} className="p-0">
              <AgendaEventCard
                mascotaNombre={evento.mascota_nombre}
                horaInicio={evento.hora_inicio}
                estado={evento.estado}
                motivo={evento.motivo}
                span={evento.span}
                onClick={onClickEvento ? () => onClickEvento(evento.cita_id) : undefined}
              />
            </AgendaSlot>
          )
        }

        if (celdasOcupadas.has(colIdx) || soloLectura) {
          return <AgendaSlot key={colIdx} />
        }

        return (
          <AgendaSlot
            key={colIdx}
            onClick={() => onClickSlot(fila)}
          />
        )
      })}
    </>
  )
}
