"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Clock, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { obtenerTimeline } from "@/actions/historial/obtener-timeline"
import { TimelineCard } from "@/components/historial/timeline-card"
import { RegistrarEventoModal } from "@/components/historial/registrar-evento-modal"
import { EmptyState } from "@/components/shared/empty-state"
import type { EventoTimeline } from "@/types/timeline"

interface Props {
  mascotaId: string
  puedeCrear: boolean
}

export function Timeline({ mascotaId, puedeCrear }: Props) {
  const [eventos, setEventos] = useState<EventoTimeline[]>([])
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [tieneMas, setTieneMas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [crearAbierto, setCrearAbierto] = useState(false)

  const [busqueda, setBusqueda] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  const centinelaRef = useRef<HTMLDivElement | null>(null)
  const cargandoRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const filtrosRef = useRef({ busqueda: "", fechaDesde: "", fechaHasta: "" })

  const cargarPagina = useCallback(async (pag: number, filtros?: typeof filtrosRef.current) => {
    if (cargandoRef.current) return
    cargandoRef.current = true
    setCargando(true)

    const f = filtros ?? filtrosRef.current
    const res = await obtenerTimeline(mascotaId, pag, 20, f.busqueda, f.fechaDesde, f.fechaHasta)
    if (!res.success) {
      setError(res.error)
      setCargando(false)
      cargandoRef.current = false
      return
    }

    setEventos((prev) => (pag === 1 ? res.data.eventos : [...prev, ...res.data.eventos]))
    setTieneMas(res.data.tieneMas)
    setPagina(pag)
    setCargando(false)
    cargandoRef.current = false
  }, [mascotaId])

  const recargarConFiltros = useCallback(() => {
    const f = { busqueda, fechaDesde, fechaHasta }
    filtrosRef.current = f
    setEventos([])
    setPagina(1)
    setTieneMas(false)
    setError(null)
    cargarPagina(1, f)
  }, [busqueda, fechaDesde, fechaHasta, cargarPagina])

  useEffect(() => {
    setEventos([])
    setPagina(1)
    setTieneMas(false)
    setError(null)
    filtrosRef.current = { busqueda: "", fechaDesde: "", fechaHasta: "" }
    cargarPagina(1)
  }, [cargarPagina])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(recargarConFiltros, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [busqueda, fechaDesde, fechaHasta, recargarConFiltros])

  useEffect(() => {
    const centinela = centinelaRef.current
    if (!centinela) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && tieneMas && !cargandoRef.current) {
          cargarPagina(pagina + 1)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(centinela)
    return () => observer.disconnect()
  }, [tieneMas, pagina, cargarPagina])

  const hayFiltrosActivos = busqueda || fechaDesde || fechaHasta

  function limpiarFiltros() {
    setBusqueda("")
    setFechaDesde("")
    setFechaHasta("")
  }

  function handleCreado(evento: EventoTimeline) {
    setEventos((prev) => [evento, ...prev])
  }

  if (error) {
    return (
      <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Línea de tiempo</h2>
        {puedeCrear && (
          <Button size="sm" onClick={() => setCrearAbierto(true)}>
            <Plus className="mr-1 size-4" />
            Nuevo evento
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por palabra clave..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Desde</label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-40"
            />
          </div>
          <span className="text-muted-foreground text-sm pt-5">—</span>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Hasta</label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
        {hayFiltrosActivos && (
          <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="pt-5">
            <X className="mr-1 size-3" />
            Limpiar
          </Button>
        )}
      </div>

      {!cargando && eventos.length === 0 ? (
        hayFiltrosActivos ? (
          <EmptyState
            icon={<Search className="size-12" />}
            titulo="Sin resultados"
            descripcion="No se encontraron eventos con los filtros aplicados. Intenta con otros términos o fechas."
          />
        ) : (
          <EmptyState
            icon={<Clock className="size-12" />}
            titulo="Este paciente no tiene eventos registrados"
            descripcion="Aún no hay consultas, cirugías o vacunas registradas para esta mascota."
          />
        )
      ) : (
        <div className="space-y-3">
          {eventos.map((evento) => (
            <TimelineCard key={`${evento.tipo}-${evento.id}`} evento={evento} />
          ))}

          {cargando && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted" />
              ))}
            </div>
          )}

          <div ref={centinelaRef} className="h-4" />

          {!tieneMas && eventos.length > 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No hay más eventos que mostrar
            </p>
          )}
        </div>
      )}

      <RegistrarEventoModal
        abierto={crearAbierto}
        onOpenChange={setCrearAbierto}
        mascotaId={mascotaId}
        onCreado={handleCreado}
      />
    </div>
  )
}
