"use client"

import { useState, type FormEvent, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Stethoscope, Scissors, Bed, ClipboardCheck, Syringe, FileQuestion } from "lucide-react"
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
import { crearEvento } from "@/actions/historial/crear-evento"
import type { EventoTimeline } from "@/types/timeline"

interface Props {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  mascotaId: string
  onCreado?: (evento: EventoTimeline) => void
}

const TIPOS = [
  { value: "consulta", label: "Consulta", icon: Stethoscope },
  { value: "cirugia", label: "Cirugía", icon: Scissors },
  { value: "hospitalizacion", label: "Hospitalización", icon: Bed },
  { value: "control", label: "Control", icon: ClipboardCheck },
  { value: "procedimiento", label: "Procedimiento", icon: Syringe },
  { value: "otro", label: "Otro", icon: FileQuestion },
] as const

export function RegistrarEventoModal({ abierto, onOpenChange, mascotaId, onCreado }: Props) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [tipo, setTipo] = useState("consulta")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [diagnostico, setDiagnostico] = useState("")
  const [tratamiento, setTratamiento] = useState("")
  const [notas, setNotas] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError(null)

    const fd = new FormData()
    fd.set("mascota_id", mascotaId)
    fd.set("tipo", tipo)
    fd.set("fecha", fecha)
    fd.set("diagnostico", diagnostico)
    if (tratamiento) fd.set("tratamiento", tratamiento)
    if (notas) fd.set("notas", notas)

    const res = await crearEvento(fd)
    if (!res.success) {
      setError(res.error)
      setCargando(false)
      return
    }

    toast.success("Evento registrado")
    onCreado?.(res.data)
    onOpenChange(false)
    setCargando(false)
    router.refresh()
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar evento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="re-tipo">Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="re-tipo">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <t.icon className="size-4" />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="re-fecha">Fecha *</Label>
            <Input
              id="re-fecha"
              type="date"
              value={fecha}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFecha(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="re-diagnostico">Diagnóstico *</Label>
            <textarea
              id="re-diagnostico"
              value={diagnostico}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDiagnostico(e.target.value)}
              placeholder="Describe el diagnóstico (mín. 10 caracteres)"
              rows={3}
              required
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            {diagnostico.length > 0 && diagnostico.length < 10 && (
              <p className="text-xs text-destructive">Mínimo 10 caracteres</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="re-tratamiento">Tratamiento</Label>
            <textarea
              id="re-tratamiento"
              value={tratamiento}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTratamiento(e.target.value)}
              placeholder="Tratamiento recetado (opcional)"
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="re-notas">Notas</Label>
            <textarea
              id="re-notas"
              value={notas}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotas(e.target.value)}
              placeholder="Notas internas (opcional)"
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={cargando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando || diagnostico.length < 10}>
              {cargando ? "Guardando..." : "Guardar evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
