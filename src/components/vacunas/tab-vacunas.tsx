"use client"

import { useState, useEffect, useCallback, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Syringe, Plus, Pencil, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { obtenerVacunas, type VacunaRegistrada } from "@/actions/vacunas/obtener"
import { editarVacuna } from "@/actions/vacunas/editar"
import { RegistrarVacunaModal } from "@/components/vacunas/registrar-vacuna-modal"
import { DIAS_VACUNA_PROXIMA } from "@/config/constants"
import type { EstadoVacuna } from "@/types/models"

interface Props {
  mascotaId: string
  especieId: string
}

function calcularEstadoVacuna(fechaProximaDosis: string | null): { estado: EstadoVacuna; color: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" } {
  if (!fechaProximaDosis) return { estado: "sin_refuerzo", color: "outline" }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const proxima = new Date(fechaProximaDosis + "T00:00:00")

  const diffDias = Math.floor((proxima.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDias < 0) return { estado: "vencida", color: "destructive" }
  if (diffDias <= DIAS_VACUNA_PROXIMA) return { estado: "proxima", color: "warning" }
  return { estado: "vigente", color: "success" }
}

const ETIQUETA_ESTADO: Record<EstadoVacuna, string> = {
  sin_refuerzo: "Sin refuerzo",
  vigente: "Vigente",
  proxima: "Próxima",
  vencida: "Vencida",
}

export function TabVacunas({ mascotaId, especieId }: Props) {
  const router = useRouter()
  const [vacunas, setVacunas] = useState<VacunaRegistrada[]>([])
  const [cargando, setCargando] = useState(true)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editLote, setEditLote] = useState("")
  const [editProxima, setEditProxima] = useState("")
  const [editObservaciones, setEditObservaciones] = useState("")
  const [cargandoEdit, setCargandoEdit] = useState(false)

  const cargarVacunas = useCallback(async () => {
    setCargando(true)
    const data = await obtenerVacunas(mascotaId)
    setVacunas(data)
    setCargando(false)
  }, [mascotaId])

  useEffect(() => { cargarVacunas() }, [cargarVacunas])

  function iniciarEdicion(v: VacunaRegistrada) {
    setEditandoId(v.id)
    setEditLote(v.lote ?? "")
    setEditProxima(v.fecha_proxima_dosis ?? "")
    setEditObservaciones(v.observaciones ?? "")
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setEditLote("")
    setEditProxima("")
    setEditObservaciones("")
  }

  async function guardarEdicion(vacunaId: string) {
    setCargandoEdit(true)

    const fd = new FormData()
    fd.set("id", vacunaId)
    fd.set("lote", editLote)
    fd.set("fecha_proxima_dosis", editProxima)
    fd.set("observaciones", editObservaciones)

    const res = await editarVacuna(fd)
    if (!res.success) {
      toast.error(res.error)
      setCargandoEdit(false)
      return
    }

    toast.success("Vacuna actualizada")
    cancelarEdicion()
    setCargandoEdit(false)
    cargarVacunas()
    router.refresh()
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vacunas</h2>
        <Button size="sm" onClick={() => setCrearAbierto(true)}>
          <Plus className="mr-1 size-4" />
          Registrar vacuna
        </Button>
      </div>

      {cargando ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : vacunas.length === 0 ? (
        <EmptyState
          icon={<Syringe className="size-12" />}
          titulo="Este paciente no tiene vacunas registradas"
          descripcion="Registra la primera vacuna para empezar el control de vacunación."
          accion={{ label: "Registrar primera vacuna", onClick: () => setCrearAbierto(true) }}
        />
      ) : (
        <div className="space-y-3">
          {vacunas.map((vacuna) => {
            const { estado, color } = calcularEstadoVacuna(vacuna.fecha_proxima_dosis)
            const editando = editandoId === vacuna.id

            return (
              <Card key={vacuna.id}>
                <CardContent className="p-4">
                  {editando ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <p className="font-medium text-sm">{vacuna.nombre_vacuna}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Lote</label>
                          <Input
                            value={editLote}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditLote(e.target.value)}
                            size={1}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Próxima dosis</label>
                          <Input
                            type="date"
                            value={editProxima}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditProxima(e.target.value)}
                            size={1}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Observaciones</label>
                        <textarea
                          value={editObservaciones}
                          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditObservaciones(e.target.value)}
                          rows={2}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={cancelarEdicion} disabled={cargandoEdit}>
                          <X className="mr-1 size-3" />
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => guardarEdicion(vacuna.id)} disabled={cargandoEdit}>
                          <Save className="mr-1 size-3" />
                          {cargandoEdit ? "Guardando..." : "Guardar"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{vacuna.nombre_vacuna}</p>
                          <Badge variant={color}>{ETIQUETA_ESTADO[estado]}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                          {vacuna.lote && <span>Lote: {vacuna.lote}</span>}
                          <span>Aplicación: {new Date(vacuna.fecha_aplicacion).toLocaleDateString("es-MX")}</span>
                          {vacuna.fecha_proxima_dosis && (
                            <span>Próxima: {new Date(vacuna.fecha_proxima_dosis).toLocaleDateString("es-MX")}</span>
                          )}
                        </div>
                        {vacuna.observaciones && (
                          <p className="mt-1 text-xs text-muted-foreground italic">{vacuna.observaciones}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => iniciarEdicion(vacuna)}
                        className="shrink-0"
                      >
                        <Pencil className="size-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <RegistrarVacunaModal
        abierto={crearAbierto}
        onOpenChange={setCrearAbierto}
        mascotaId={mascotaId}
        especieId={especieId}
        onCreado={cargarVacunas}
      />
    </div>
  )
}
