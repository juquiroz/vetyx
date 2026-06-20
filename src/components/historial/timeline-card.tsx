"use client"

import { useState, useCallback, type ChangeEvent, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Clock, Stethoscope, Scissors, Syringe, Lock, Pencil, Bed,
  ClipboardCheck, FileQuestion, Save, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { editarEvento } from "@/actions/historial/editar-evento"
import { VENTANA_EDICION_HISTORIAL_HORAS } from "@/config/constants"
import type { EventoTimeline } from "@/types/timeline"

interface Props {
  evento: EventoTimeline
}

const CONFIG_TIPO: Record<string, { icono: React.ComponentType<{ className?: string }>; color: string }> = {
  consulta: { icono: Stethoscope, color: "border-l-blue-500" },
  cirugia: { icono: Scissors, color: "border-l-red-500" },
  hospitalizacion: { icono: Bed, color: "border-l-purple-500" },
  control: { icono: ClipboardCheck, color: "border-l-amber-500" },
  procedimiento: { icono: Syringe, color: "border-l-orange-500" },
  otro: { icono: FileQuestion, color: "border-l-slate-400" },
  vacuna: { icono: Syringe, color: "border-l-green-500" },
}

const COLORES_TIPO: Record<string, string> = {
  consulta: "text-blue-600",
  cirugia: "text-red-600",
  hospitalizacion: "text-purple-600",
  control: "text-amber-600",
  procedimiento: "text-orange-600",
  otro: "text-gray-600",
  vacuna: "text-green-600",
}

function formatoRelativo(fecha: string): string {
  const ahora = Date.now()
  const fechaMs = new Date(fecha).getTime()
  const diffMs = ahora - fechaMs
  const segundos = Math.floor(diffMs / 1000)
  const minutos = Math.floor(segundos / 60)
  const horas = Math.floor(minutos / 60)
  const dias = Math.floor(horas / 24)

  if (dias > 30) return `hace ${Math.floor(dias / 30)} meses`
  if (dias > 0) return `hace ${dias} días`
  if (horas > 0) return `hace ${horas} horas`
  if (minutos > 0) return `hace ${minutos} minutos`
  return "hace un momento"
}

function tiempoRestanteEdicion(created_at: string): string {
  const ahora = Date.now()
  const creado = new Date(created_at).getTime()
  const ventanaMs = VENTANA_EDICION_HISTORIAL_HORAS * 60 * 60 * 1000
  const restanteMs = ventanaMs - (ahora - creado)

  if (restanteMs <= 0) return ""

  const horasRestantes = Math.floor(restanteMs / (1000 * 60 * 60))
  const minutosRestantes = Math.floor((restanteMs % (1000 * 60 * 60)) / (1000 * 60))

  if (horasRestantes > 0) return `Quedan ${horasRestantes}h ${minutosRestantes}m de edición`
  return `Quedan ${minutosRestantes}m de edición`
}

export function TimelineCard({ evento }: Props) {
  const router = useRouter()
  const [expandido, setExpandido] = useState(false)
  const [editando, setEditando] = useState(false)
  const [cargandoEdit, setCargandoEdit] = useState(false)
  const [editTratamiento, setEditTratamiento] = useState((evento.metadata.tratamiento as string) ?? "")
  const [editNotas, setEditNotas] = useState((evento.metadata.notas as string) ?? "")

  const config = CONFIG_TIPO[evento.tipo] ?? CONFIG_TIPO.otro
  const Icono = config.icono

  const tiempoRestante = evento.editable ? tiempoRestanteEdicion(evento.created_at) : null

  const handleGuardarEdicion = useCallback(async (e: MouseEvent) => {
    e.stopPropagation()
    setCargandoEdit(true)

    const fd = new FormData()
    fd.set("id", evento.id)
    fd.set("tratamiento", editTratamiento)
    fd.set("notas", editNotas)

    const res = await editarEvento(fd)
    if (!res.success) {
      toast.error(res.error)
      setCargandoEdit(false)
      return
    }

    toast.success("Evento actualizado")
    setEditando(false)
    setCargandoEdit(false)
    router.refresh()
  }, [evento.id, editTratamiento, editNotas, router])

  const handleCancelarEdicion = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    setEditTratamiento((evento.metadata.tratamiento as string) ?? "")
    setEditNotas((evento.metadata.notas as string) ?? "")
    setEditando(false)
  }, [evento.metadata.tratamiento, evento.metadata.notas])

  return (
    <Card
      className={cn("border-l-4 transition-colors hover:bg-accent/50", config.color)}
    >
      <CardContent className="p-4">
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={() => { if (!editando) setExpandido(!expandido) }}
        >
          <div className="mt-0.5 shrink-0">
            <Icono className={cn("size-5", COLORES_TIPO[evento.tipo] ?? "text-gray-600")} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{evento.titulo}</span>
                {evento.tipo !== "vacuna" && (
                  <Badge variant={evento.editable ? "outline" : "secondary"} className="text-xs gap-1">
                    {evento.editable ? (
                      <><Pencil className="size-3" />Editable</>
                    ) : (
                      <><Lock className="size-3" />Solo lectura</>
                    )}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="size-3" />
                {new Date(evento.fecha).toLocaleDateString("es-MX")}
              </div>
            </div>

            <p className="text-sm text-foreground/70 mt-1 line-clamp-1">
              {evento.resumen}
            </p>

            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatoRelativo(evento.created_at)}</span>
              {evento.metadata.created_by_name as string && (
                <span>por {evento.metadata.created_by_name as string}</span>
              )}
              {tiempoRestante && (
                <span className="text-amber-600 font-medium">{tiempoRestante}</span>
              )}
            </div>
          </div>
        </div>

        {expandido && !editando && (
          <div className="mt-3 space-y-2 border-t pt-3 text-sm">
            {evento.tipo === "vacuna" ? (
              <DetalleVacuna metadata={evento.metadata} />
            ) : (
              <DetalleHistorial metadata={evento.metadata} />
            )}

            {evento.editable && (
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); setEditando(true) }}
                >
                  <Pencil className="mr-1 size-3" />
                  Editar
                </Button>
              </div>
            )}
          </div>
        )}

        {expandido && editando && (
          <div className="mt-3 space-y-3 border-t pt-3" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tratamiento</label>
              <textarea
                value={editTratamiento}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditTratamiento(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Notas</label>
              <textarea
                value={editNotas}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditNotas(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={handleCancelarEdicion} disabled={cargandoEdit}>
                <X className="mr-1 size-3" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleGuardarEdicion} disabled={cargandoEdit}>
                <Save className="mr-1 size-3" />
                {cargandoEdit ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DetalleHistorial({ metadata }: { metadata: Record<string, unknown> }) {
  return (
    <>
      <DetalleCampo etiqueta="Diagnóstico" valor={metadata.diagnostico as string} />
      {(metadata.tratamiento as string | null) && (
        <DetalleCampo etiqueta="Tratamiento" valor={metadata.tratamiento as string} />
      )}
      {(metadata.notas as string | null) && (
        <DetalleCampo etiqueta="Notas" valor={metadata.notas as string} />
      )}
      <DetalleCampo etiqueta="Registró" valor={metadata.created_by_name as string} />
    </>
  )
}

function DetalleVacuna({ metadata }: { metadata: Record<string, unknown> }) {
  return (
    <>
      <DetalleCampo etiqueta="Vacuna" valor={metadata.nombre_vacuna as string} />
      {(metadata.lote as string | null) && (
        <DetalleCampo etiqueta="Lote" valor={metadata.lote as string} />
      )}
      {(metadata.fecha_proxima_dosis as string | null) && (
        <DetalleCampo etiqueta="Próxima dosis" valor={new Date(metadata.fecha_proxima_dosis as string).toLocaleDateString("es-MX")} />
      )}
      {(metadata.recordatorio_enviado as number) > 0 && (
        <DetalleCampo etiqueta="Recordatorios" valor={`${metadata.recordatorio_enviado}/3`} />
      )}
      <DetalleCampo etiqueta="Aplicó" valor={metadata.aplicado_por_name as string} />
    </>
  )
}

function DetalleCampo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  if (!valor) return null
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0 w-24">{etiqueta}:</span>
      <span className="break-words">{valor}</span>
    </div>
  )
}
