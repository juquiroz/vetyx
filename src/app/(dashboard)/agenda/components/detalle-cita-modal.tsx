"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, AlertCircle, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { obtenerCita } from "@/actions/citas/obtener"
import { editarCita } from "@/actions/citas/editar"
import { cancelarCita } from "@/actions/citas/cancelar"
import { completarCita } from "@/actions/citas/completar"
import { marcarNoShow } from "@/actions/citas/marcar-no-show"
import { transicionarEstado } from "@/actions/citas/transicionar-estado"
import { obtenerVeterinarios, type VeterinarioOpcion } from "@/actions/citas/obtener-veterinarios"
import { SLOT_DURACION_MINUTOS } from "@/config/constants"
import type { CitaConRelaciones } from "@/types/models"

const ETIQUETA_ESTADO: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  scheduled: { label: "Programada", variant: "outline" },
  confirmed: { label: "Confirmada", variant: "default" },
  in_progress: { label: "En curso", variant: "secondary" },
  completed: { label: "Completada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  no_show: { label: "No asistió", variant: "destructive" },
}

const ESTADOS_LECTURA = ["completed", "cancelled", "no_show"]
const ESTADOS_EDITABLES = ["scheduled", "confirmed"]

interface Props {
  citaId: string | null
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  onCambio?: () => void
}

export function DetalleCitaModal({ citaId, abierto, onOpenChange, onCambio }: Props) {
  const [cargando, setCargando] = useState(true)
  const [cita, setCita] = useState<CitaConRelaciones | null>(null)
  const [editando, setEditando] = useState(false)
  const [veterinarios, setVeterinarios] = useState<VeterinarioOpcion[]>([])

  const [veterinarioId, setVeterinarioId] = useState("")
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")
  const [motivo, setMotivo] = useState("")
  const [notasInternas, setNotasInternas] = useState("")
  const [observaciones, setObservaciones] = useState("")

  const [accionCargando, setAccionCargando] = useState<string | null>(null)

  const [modalCancelar, setModalCancelar] = useState(false)
  const [motivoCancelacion, setMotivoCancelacion] = useState("")

  const [modalCompletar, setModalCompletar] = useState(false)
  const [monto, setMonto] = useState("")

  const cargarCita = useCallback(async () => {
    if (!citaId || !abierto) return
    setCargando(true)
    const data = await obtenerCita(citaId)
    setCita(data)
    if (data) {
      const d = new Date(data.fecha_hora)
      setVeterinarioId(data.veterinario_id)
      setFecha(d.toISOString().split("T")[0])
      setHora(d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }))
      setMotivo(data.motivo)
      setNotasInternas(data.notas_internas ?? "")
      setObservaciones(data.observaciones ?? "")
    }
    setCargando(false)
    setEditando(false)
    setModalCancelar(false)
    setModalCompletar(false)
    setMotivoCancelacion("")
    setMonto("")
  }, [citaId, abierto])

  useEffect(() => {
    if (abierto) {
      cargarCita()
      obtenerVeterinarios().then(setVeterinarios)
    }
  }, [abierto, cargarCita])

  function formatearHora(iso: string) {
    return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  }

  function formatearFecha(iso: string) {
    return new Date(iso).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const esLectura = cita ? ESTADOS_LECTURA.includes(cita.estado) : false
  const esEditable = cita ? ESTADOS_EDITABLES.includes(cita.estado) : false

  async function ejecutarAccion(tipo: string, formData?: FormData) {
    if (!cita) return
    setAccionCargando(tipo)

    try {
      let resultado: { ok: boolean; mensaje?: string; error?: string } | null = null

      if (tipo === "confirmar") {
        const fd = new FormData()
        fd.set("id", cita.id)
        fd.set("estado", "confirmed")
        resultado = await transicionarEstado(fd)
      } else if (tipo === "iniciar") {
        const fd = new FormData()
        fd.set("id", cita.id)
        fd.set("estado", "in_progress")
        resultado = await transicionarEstado(fd)
      } else if (tipo === "cancelar") {
        resultado = await cancelarCita(formData ?? new FormData())
      } else if (tipo === "completar") {
        resultado = await completarCita(formData ?? new FormData())
      } else if (tipo === "no_show") {
        const fd = new FormData()
        fd.set("id", cita.id)
        resultado = await marcarNoShow(fd)
      } else if (tipo === "editar") {
        resultado = await editarCita(formData ?? new FormData())
      }

      if (resultado?.ok) {
        toast.success(resultado.mensaje ?? "Acción completada")
        onOpenChange(false)
        onCambio?.()
      } else if (resultado && "error" in resultado && resultado.error) {
        toast.error(resultado.error)
      }
    } catch {
      toast.error("Error al ejecutar la acción")
    } finally {
      setAccionCargando(null)
    }
  }

  function manejarGuardarEdicion() {
    if (!cita) return
    const fd = new FormData()
    fd.set("id", cita.id)
    if (veterinarioId !== cita.veterinario_id) fd.set("veterinario_id", veterinarioId)
    if (fecha || hora) {
      const fechaHora = hora ? `${fecha}T${hora}:00` : `${fecha}T00:00:00`
      const iso = new Date(fechaHora).toISOString()
      if (iso !== cita.fecha_hora) fd.set("fecha_hora", iso)
    }
    fd.set("motivo", motivo)
    fd.set("notas_internas", notasInternas)
    fd.set("observaciones", observaciones)
    ejecutarAccion("editar", fd)
  }

  function manejarCancelar() {
    if (!cita) return
    const fd = new FormData()
    fd.set("id", cita.id)
    if (motivoCancelacion) fd.set("motivo_cancelacion", motivoCancelacion)
    ejecutarAccion("cancelar", fd)
  }

  function manejarCompletar() {
    if (!cita) return
    const fd = new FormData()
    fd.set("id", cita.id)
    if (monto) fd.set("monto", monto)
    ejecutarAccion("completar", fd)
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalle de cita
            {cita && (
              <Badge variant={ETIQUETA_ESTADO[cita.estado]?.variant ?? "outline"}>
                {ETIQUETA_ESTADO[cita.estado]?.label ?? cita.estado}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {cita ? `${formatearFecha(cita.fecha_hora)} — ${cita.mascota?.nombre ?? "—"}` : "Cargando..."}
          </DialogDescription>
        </DialogHeader>

        {cargando ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !cita ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <AlertCircle className="size-8" />
            <p className="text-sm">Cita no encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {editando ? (
              <>
                <div className="space-y-3">
                  <div>
                    <Label>Veterinario</Label>
                    <Select value={veterinarioId} onValueChange={setVeterinarioId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {veterinarios.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Fecha</Label>
                      <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                    </div>
                    <div>
                      <Label>Hora</Label>
                      <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Motivo</Label>
                    <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                  </div>
                  <div>
                    <Label>Notas internas</Label>
                    <Input value={notasInternas} onChange={(e) => setNotasInternas(e.target.value)} />
                  </div>
                  <div>
                    <Label>Observaciones</Label>
                    <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mascota</span>
                    <p className="font-medium">{cita.mascota?.nombre ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Especie</span>
                    <p className="font-medium">{cita.mascota?.especie?.nombre ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dueño</span>
                    <p className="font-medium">{cita.mascota?.dueno?.nombre ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Teléfono</span>
                    <p className="font-medium">{cita.mascota?.dueno?.telefono ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Veterinario</span>
                    <p className="font-medium">{cita.veterinario?.nombre ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duración</span>
                    <p className="font-medium">{cita.duracion_minutos} min</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hora</span>
                    <p className="font-medium">{formatearHora(cita.fecha_hora)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado</span>
                    <Badge variant={ETIQUETA_ESTADO[cita.estado]?.variant ?? "outline"}>
                      {ETIQUETA_ESTADO[cita.estado]?.label ?? cita.estado}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Motivo</span>
                  <p>{cita.motivo}</p>
                </div>

                {cita.notas_internas && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notas internas</span>
                    <p>{cita.notas_internas}</p>
                  </div>
                )}

                {cita.observaciones && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Observaciones</span>
                    <p>{cita.observaciones}</p>
                  </div>
                )}

                {cita.monto !== null && cita.monto !== undefined && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Monto</span>
                    <p className="font-medium">${Number(cita.monto).toFixed(2)}</p>
                  </div>
                )}

                {cita.motivo_cancelacion && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Motivo de cancelación</span>
                    <p>{cita.motivo_cancelacion}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {editando ? (
            <>
              <Button variant="outline" onClick={() => setEditando(false)} disabled={!!accionCargando}>
                <X className="mr-1 size-4" /> Cancelar edición
              </Button>
              <Button onClick={manejarGuardarEdicion} disabled={!!accionCargando}>
                {accionCargando === "editar" ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Check className="mr-1 size-4" />}
                Guardar cambios
              </Button>
            </>
          ) : modalCancelar ? (
            <>
              <div className="flex w-full flex-col gap-2">
                <Label>Motivo de cancelación (opcional)</Label>
                <Input value={motivoCancelacion} onChange={(e) => setMotivoCancelacion(e.target.value)} placeholder="Ej: El dueño canceló" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setModalCancelar(false)} disabled={!!accionCargando}>
                    Volver
                  </Button>
                  <Button variant="destructive" onClick={manejarCancelar} disabled={!!accionCargando}>
                    {accionCargando === "cancelar" ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
                    Confirmar cancelación
                  </Button>
                </div>
              </div>
            </>
          ) : modalCompletar ? (
            <>
              <div className="flex w-full flex-col gap-2">
                <Label>Monto de la consulta (opcional)</Label>
                <Input type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej: 500" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setModalCompletar(false)} disabled={!!accionCargando}>
                    Volver
                  </Button>
                  <Button onClick={manejarCompletar} disabled={!!accionCargando}>
                    {accionCargando === "completar" ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
                    Completar consulta
                  </Button>
                </div>
              </div>
            </>
          ) : !cargando && cita ? (
            esLectura ? (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            ) : (
              <div className="flex w-full flex-wrap gap-2">
                {cita.estado === "scheduled" && (
                  <>
                    <Button onClick={() => ejecutarAccion("confirmar")} disabled={!!accionCargando}>
                      {accionCargando === "confirmar" ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Check className="mr-1 size-4" />}
                      Confirmar
                    </Button>
                    {esEditable && (
                      <Button variant="outline" onClick={() => setEditando(true)} disabled={!!accionCargando}>
                        Editar
                      </Button>
                    )}
                    <Button variant="destructive" onClick={() => setModalCancelar(true)} disabled={!!accionCargando}>
                      Cancelar
                    </Button>
                  </>
                )}
                {cita.estado === "confirmed" && (
                  <>
                    <Button onClick={() => ejecutarAccion("iniciar")} disabled={!!accionCargando}>
                      {accionCargando === "iniciar" ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
                      Iniciar consulta
                    </Button>
                    {esEditable && (
                      <Button variant="outline" onClick={() => setEditando(true)} disabled={!!accionCargando}>
                        Editar
                      </Button>
                    )}
                    <Button variant="destructive" onClick={() => setModalCancelar(true)} disabled={!!accionCargando}>
                      Cancelar
                    </Button>
                    <Button variant="secondary" onClick={() => ejecutarAccion("no_show")} disabled={!!accionCargando}>
                      {accionCargando === "no_show" ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
                      No show
                    </Button>
                  </>
                )}
                {cita.estado === "in_progress" && (
                  <Button onClick={() => setModalCompletar(true)} disabled={!!accionCargando}>
                    Completar consulta
                  </Button>
                )}
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
              </div>
            )
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
