"use client"

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Syringe, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { registrarVacuna } from "@/actions/vacunas/registrar"
import { obtenerCatalogoVacunas } from "@/actions/vacunas/obtener-catalogo"
import { obtenerVeterinariosParaVacuna } from "@/actions/vacunas/obtener-veterinarios"
import { NOMBRE_VACUNA_OTRA } from "@/config/constants"
import type { CatalogoVacuna } from "@/types/models"

interface Props {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  mascotaId: string
  especieId: string
  onCreado?: () => void
}

interface VeterinarioOpcion {
  id: string
  nombre: string
}

export function RegistrarVacunaModal({ abierto, onOpenChange, mascotaId, especieId, onCreado }: Props) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [catalogo, setCatalogo] = useState<CatalogoVacuna[]>([])
  const [veterinarios, setVeterinarios] = useState<VeterinarioOpcion[]>([])
  const [catalogoId, setCatalogoId] = useState("")
  const [nombrePersonalizado, setNombrePersonalizado] = useState("")
  const [fechaAplicacion, setFechaAplicacion] = useState(new Date().toISOString().split("T")[0])
  const [fechaProximaDosis, setFechaProximaDosis] = useState("")
  const [lote, setLote] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [veterinarioId, setVeterinarioId] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!abierto) return

    async function cargarDatos() {
      const [catRes, vets] = await Promise.all([
        obtenerCatalogoVacunas(especieId),
        obtenerVeterinariosParaVacuna(),
      ])

      if (catRes.success) setCatalogo(catRes.data)
      setVeterinarios(vets)
    }

    cargarDatos()
  }, [abierto, especieId])

  const catalogoSeleccionado = catalogo.find((c) => c.id === catalogoId)
  const esOtra = catalogoSeleccionado?.nombre === NOMBRE_VACUNA_OTRA

  function resetForm() {
    setCatalogoId("")
    setNombrePersonalizado("")
    setFechaAplicacion(new Date().toISOString().split("T")[0])
    setFechaProximaDosis("")
    setLote("")
    setObservaciones("")
    setVeterinarioId("")
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError(null)

    const fd = new FormData()
    fd.set("mascota_id", mascotaId)
    fd.set("catalogo_vacuna_id", catalogoId)
    if (esOtra && nombrePersonalizado) fd.set("nombre_personalizado", nombrePersonalizado)
    fd.set("fecha_aplicacion", fechaAplicacion)
    if (fechaProximaDosis) fd.set("fecha_proxima_dosis", fechaProximaDosis)
    if (lote) fd.set("lote", lote)
    if (observaciones) fd.set("observaciones", observaciones)
    fd.set("veterinario_id", veterinarioId)

    const res = await registrarVacuna(fd)
    if (!res.success) {
      setError(res.error)
      setCargando(false)
      return
    }

    toast.success("Vacuna registrada")
    resetForm()
    onCreado?.()
    onOpenChange(false)
    setCargando(false)
    router.refresh()
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="size-5" />
            Registrar vacuna
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rv-catalogo">Vacuna *</Label>
            <Select value={catalogoId} onValueChange={setCatalogoId} required>
              <SelectTrigger id="rv-catalogo">
                <SelectValue placeholder="Seleccionar vacuna..." />
              </SelectTrigger>
              <SelectContent>
                {catalogo.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                    {c.dosis_tipica && (
                      <span className="ml-2 text-xs text-muted-foreground">({c.dosis_tipica})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {esOtra && (
            <div className="space-y-2">
              <Label htmlFor="rv-nombre">Nombre de la vacuna *</Label>
              <Input
                id="rv-nombre"
                value={nombrePersonalizado}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNombrePersonalizado(e.target.value)}
                placeholder="Ej: Vacuna experimental"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rv-fecha">Fecha aplicación *</Label>
              <Input
                id="rv-fecha"
                type="date"
                value={fechaAplicacion}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFechaAplicacion(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rv-proxima">Próxima dosis</Label>
              <Input
                id="rv-proxima"
                type="date"
                value={fechaProximaDosis}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFechaProximaDosis(e.target.value)}
                min={fechaAplicacion}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rv-lote">Lote</Label>
            <Input
              id="rv-lote"
              value={lote}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLote(e.target.value)}
              placeholder="Número de lote (opcional)"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rv-observaciones">Observaciones</Label>
            <textarea
              id="rv-observaciones"
              value={observaciones}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales (opcional)"
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rv-vet">Aplicado por *</Label>
            <Select value={veterinarioId} onValueChange={setVeterinarioId} required>
              <SelectTrigger id="rv-vet">
                <SelectValue placeholder="Seleccionar veterinario..." />
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

          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false) }} disabled={cargando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando || !catalogoId || !veterinarioId || (esOtra && !nombrePersonalizado)}>
              {cargando ? "Guardando..." : "Guardar vacuna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
