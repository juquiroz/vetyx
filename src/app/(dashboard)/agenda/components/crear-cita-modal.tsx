"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Search, Check, AlertCircle, Loader2, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { crearCita } from "@/actions/citas/crear"
import { verificarDisponibilidad } from "@/actions/citas/verificar-disponibilidad"
import { buscarMascotas, type ResultadoMascota } from "@/actions/mascotas/buscar"
import { buscarDuenos, type ResultadoDueno } from "@/actions/duenos/buscar"
import { obtenerVeterinarios, type VeterinarioOpcion } from "@/actions/citas/obtener-veterinarios"
import { SLOT_DURACION_MINUTOS } from "@/config/constants"
import type { ConflictoCita, SugerenciaSlot } from "@/actions/citas/verificar-disponibilidad"

type EstadoModal = "idle" | "validando" | "conflicto" | "creando" | "error" | "success"

interface Props {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  fecha?: string
  hora?: string
  veterinarioId?: string
  mascotaId?: string
}

export function CrearCitaModal({ abierto, onOpenChange, fecha, hora, veterinarioId, mascotaId }: Props) {
  const router = useRouter()

  const [estado, setEstado] = useState<EstadoModal>("idle")
  const [errorMsj, setErrorMsj] = useState<string | null>(null)

  const [veterinarios, setVeterinarios] = useState<VeterinarioOpcion[]>([])
  const [veterinarioIdEstado, setVeterinarioIdEstado] = useState(veterinarioId ?? "")
  const [fechaEstado, setFechaEstado] = useState(fecha ?? "")
  const [horaEstado, setHoraEstado] = useState(hora ?? "")
  const [duracion, setDuracion] = useState(SLOT_DURACION_MINUTOS)
  const [motivo, setMotivo] = useState("")
  const [notasInternas, setNotasInternas] = useState("")
  const [observaciones, setObservaciones] = useState("")

  const [busquedaDueno, setBusquedaDueno] = useState("")
  const [resultadosDuenos, setResultadosDuenos] = useState<ResultadoDueno[]>([])
  const [duenoSeleccionado, setDuenoSeleccionado] = useState<ResultadoDueno | null>(null)
  const [buscandoDueno, setBuscandoDueno] = useState(false)

  const [busquedaMascota, setBusquedaMascota] = useState("")
  const [resultadosMascota, setResultadosMascota] = useState<ResultadoMascota[]>([])
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<ResultadoMascota | null>(null)
  const [buscandoMascota, setBuscandoMascota] = useState(false)

  const [conflictos, setConflictos] = useState<ConflictoCita[]>([])
  const [sugerencias, setSugerencias] = useState<SugerenciaSlot[]>([])
  const [disponible, setDisponible] = useState<boolean | null>(null)

  const timeoutDisponibilidad = useRef<ReturnType<typeof setTimeout>>(undefined)
  const timeoutDueno = useRef<ReturnType<typeof setTimeout>>(undefined)
  const timeoutMascota = useRef<ReturnType<typeof setTimeout>>(undefined)

  const veterinarioListo = veterinarioIdEstado.length > 0
  const fechaLista = fechaEstado.length > 0 && horaEstado.length > 0
  const mascotaLista = mascotaSeleccionada !== null
  const puedeEnviar = mascotaLista && veterinarioListo && fechaLista && estado !== "creando" && disponible !== false

  useEffect(() => {
    if (!abierto) return
    obtenerVeterinarios().then((vets) => {
      setVeterinarios(vets)
      if (!veterinarioIdEstado && vets.length > 0) {
        setVeterinarioIdEstado(vets[0].id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  useEffect(() => {
    if (mascotaId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBusquedaMascota("")
      setResultadosMascota([])
    }
  }, [mascotaId])

  const verificarDisponibilidadDebounced = useCallback(() => {
    if (timeoutDisponibilidad.current) clearTimeout(timeoutDisponibilidad.current)

    if (!veterinarioListo || !fechaLista) {
      setDisponible(null)
      setConflictos([])
      setSugerencias([])
      setEstado("idle")
      return
    }

    setEstado("validando")

    timeoutDisponibilidad.current = setTimeout(async () => {
      const form = new FormData()
      form.set("veterinario_id", veterinarioIdEstado)
      form.set("fecha_hora", new Date(`${fechaEstado}T${horaEstado}:00`).toISOString())
      form.set("duracion_minutos", String(duracion))

      const res = await verificarDisponibilidad(form)
      if ("error" in res) {
        setEstado("idle")
        setDisponible(null)
        return
      }

      if (res.disponible) {
        setDisponible(true)
        setConflictos([])
        setSugerencias([])
        setEstado("idle")
      } else {
        setDisponible(false)
        setConflictos(res.conflictos)
        setSugerencias(res.sugerencias)
        setEstado("conflicto")
      }
    }, 500)
  }, [veterinarioIdEstado, fechaEstado, horaEstado, duracion, veterinarioListo, fechaLista])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verificarDisponibilidadDebounced()
    return () => {
      if (timeoutDisponibilidad.current) clearTimeout(timeoutDisponibilidad.current)
    }
  }, [verificarDisponibilidadDebounced])

  function buscarDuenosDebounced(query: string) {
    if (timeoutDueno.current) clearTimeout(timeoutDueno.current)
    setBusquedaDueno(query)

    if (query.length < 2) {
      setResultadosDuenos([])
      setBuscandoDueno(false)
      return
    }

    setBuscandoDueno(true)
    timeoutDueno.current = setTimeout(async () => {
      const res = await buscarDuenos(query)
      setResultadosDuenos(res.filter((d) => d.activo))
      setBuscandoDueno(false)
    }, 300)
  }

  function seleccionarDueno(d: ResultadoDueno) {
    setDuenoSeleccionado(d)
    setBusquedaDueno("")
    setResultadosDuenos([])
    setMascotaSeleccionada(null)
    setDisponible(null)
    setBuscandoMascota(true)
    buscarMascotas("", d.id).then((res) => {
      setResultadosMascota(res.filter((m) => m.activo))
      setBuscandoMascota(false)
    })
  }

  function buscarMascotasDebounced(query: string) {
    if (timeoutMascota.current) clearTimeout(timeoutMascota.current)
    setBusquedaMascota(query)

    if (query.length < 2 && !duenoSeleccionado) {
      setResultadosMascota([])
      setBuscandoMascota(false)
      return
    }

    setBuscandoMascota(true)
    timeoutMascota.current = setTimeout(async () => {
      const res = await buscarMascotas(query, duenoSeleccionado?.id)
      setResultadosMascota(res.filter((m) => m.activo))
      setBuscandoMascota(false)
    }, 300)
  }

  function seleccionarMascota(m: ResultadoMascota) {
    setMascotaSeleccionada(m)
    setBusquedaMascota("")
    setResultadosMascota([])
  }

  function aplicarSugerencia(s: SugerenciaSlot) {
    const fechaSugerida = new Date(s.fecha_hora)
    const anio = fechaSugerida.getFullYear()
    const mes = String(fechaSugerida.getMonth() + 1).padStart(2, "0")
    const dia = String(fechaSugerida.getDate()).padStart(2, "0")
    const hh = String(fechaSugerida.getHours()).padStart(2, "0")
    const mm = String(fechaSugerida.getMinutes()).padStart(2, "0")

    setFechaEstado(`${anio}-${mes}-${dia}`)
    setHoraEstado(`${hh}:${mm}`)
  }

  function limpiarCampos() {
    setEstado("idle")
    setErrorMsj(null)
    setVeterinarioIdEstado(veterinarioId ?? "")
    setFechaEstado(fecha ?? "")
    setHoraEstado(hora ?? "")
    setDuracion(SLOT_DURACION_MINUTOS)
    setMotivo("")
    setNotasInternas("")
    setObservaciones("")
    setBusquedaDueno("")
    setResultadosDuenos([])
    setDuenoSeleccionado(null)
    setBuscandoDueno(false)
    setBusquedaMascota("")
    setResultadosMascota([])
    setMascotaSeleccionada(null)
    setBuscandoMascota(false)
    setConflictos([])
    setSugerencias([])
    setDisponible(null)
  }

  function handleCancelar() {
    limpiarCampos()
    onOpenChange(false)
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!mascotaSeleccionada) return
    setErrorMsj(null)
    setEstado("creando")

    const form = new FormData()
    form.set("mascota_id", mascotaSeleccionada.id)
    form.set("veterinario_id", veterinarioIdEstado)
    form.set("fecha_hora", new Date(`${fechaEstado}T${horaEstado}:00`).toISOString())
    form.set("duracion_minutos", String(duracion))
    form.set("motivo", motivo || "Consulta veterinaria")
    if (notasInternas) form.set("notas_internas", notasInternas)
    if (observaciones) form.set("observaciones", observaciones)

    const res = await crearCita(form)

    if (res.ok) {
      setEstado("success")
      toast.success("Cita creada exitosamente")
      onOpenChange(false)
      router.refresh()
      limpiarCampos()
      return
    }

    if ("conflictos" in res) {
      setConflictos(res.conflictos)
      setSugerencias(res.sugerencias)
      setDisponible(false)
      setEstado("conflicto")
      return
    }

    setEstado("error")
    setErrorMsj(res.error)
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open) handleCancelar() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva cita</DialogTitle>
          <DialogDescription>
            Agenda una consulta para una mascota
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCrear} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dueno">Dueño *</Label>
            {duenoSeleccionado ? (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{duenoSeleccionado.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {duenoSeleccionado.telefono}
                      {duenoSeleccionado.cedula && ` · Cédula: ${duenoSeleccionado.cedula}`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDuenoSeleccionado(null); setMascotaSeleccionada(null); setDisponible(null) }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="dueno"
                  placeholder="Buscar dueño por nombre o teléfono..."
                  className="pl-8"
                  value={busquedaDueno}
                  onChange={(e) => buscarDuenosDebounced(e.target.value)}
                  autoComplete="off"
                />
                {buscandoDueno && (
                  <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground" />
                )}
                {resultadosDuenos.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
                    {resultadosDuenos.map((d) => (
                       <button
                        key={d.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => seleccionarDueno(d)}
                      >
                        <User className="size-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{d.nombre}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{d.telefono}</span>
                      </button>
                    ))}
                  </div>
                )}
                {busquedaDueno.length >= 2 && resultadosDuenos.length === 0 && !buscandoDueno && (
                  <p className="mt-1 text-xs text-muted-foreground">Sin resultados</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mascota">Mascota *</Label>
            {!duenoSeleccionado && !mascotaSeleccionada ? (
              <p className="text-sm text-muted-foreground">Selecciona un dueño primero</p>
            ) : mascotaSeleccionada ? (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{mascotaSeleccionada.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {mascotaSeleccionada.especie} &middot; Dueño: {mascotaSeleccionada.dueno_nombre}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setMascotaSeleccionada(null); setDisponible(null) }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="mascota"
                  placeholder="Buscar mascota por nombre..."
                  className="pl-8"
                  value={busquedaMascota}
                  onChange={(e) => buscarMascotasDebounced(e.target.value)}
                  autoComplete="off"
                />
                {buscandoMascota && (
                  <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground" />
                )}
                {resultadosMascota.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
                    {resultadosMascota.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => seleccionarMascota(m)}
                      >
                        <span className="font-medium">{m.nombre}</span>
                        <span className="text-muted-foreground">{m.especie}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{m.dueno_nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
                {busquedaMascota.length >= 2 && resultadosMascota.length === 0 && !buscandoMascota && (
                  <p className="mt-1 text-xs text-muted-foreground">Sin resultados</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="veterinario">Veterinario *</Label>
            <Select
              value={veterinarioIdEstado}
              onValueChange={(v) => { setVeterinarioIdEstado(v); setDisponible(null) }}
            >
              <SelectTrigger id="veterinario">
                <SelectValue placeholder="Seleccionar veterinario" />
              </SelectTrigger>
              <SelectContent>
                {veterinarios.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaEstado}
                onChange={(e) => { setFechaEstado(e.target.value); setDisponible(null) }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={horaEstado}
                onChange={(e) => { setHoraEstado(e.target.value); setDisponible(null) }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracion">Duración (minutos)</Label>
            <Input
              id="duracion"
              type="number"
              min={10}
              max={120}
              step={5}
              value={duracion}
              onChange={(e) => { setDuracion(Number(e.target.value)); setDisponible(null) }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de la consulta</Label>
            <Input
              id="motivo"
              placeholder="Ej: Vacunación, revisión general..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas internas</Label>
            <Input
              id="notas"
              placeholder="Opcional"
              value={notasInternas}
              onChange={(e) => setNotasInternas(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input
              id="observaciones"
              placeholder="Opcional"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          {estado === "validando" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Verificando disponibilidad...
            </div>
          )}

          {estado === "conflicto" && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Conflicto de horario</p>
                  {conflictos.length > 0 && (
                    <p className="mt-1 text-muted-foreground">
                      {conflictos.length} cita{conflictos.length !== 1 ? "s" : ""} existente{conflictos.length !== 1 ? "s" : ""} en este horario
                    </p>
                  )}
                </div>
              </div>
              {sugerencias.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Horarios sugeridos:</p>
                  {sugerencias.map((s, i) => {
                    const d = new Date(s.fecha_hora)
                    const hh = String(d.getHours()).padStart(2, "0")
                    const mm = String(d.getMinutes()).padStart(2, "0")
                    return (
                      <Button
                        key={i}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-xs"
                        onClick={() => aplicarSugerencia(s)}
                      >
                        <Clock className="size-3" />
                        {hh}:{mm} hs
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {disponible === true && estado !== "conflicto" && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <Check className="size-4" />
              Horario disponible
            </div>
          )}

          {estado === "error" && errorMsj && (
            <p className="text-sm text-destructive">{errorMsj}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancelar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!puedeEnviar}>
              {estado === "creando" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear cita"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
