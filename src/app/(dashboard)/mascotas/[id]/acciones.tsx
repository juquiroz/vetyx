"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { editarMascota } from "@/actions/mascotas/editar"
import { desactivarMascota } from "@/actions/mascotas/desactivar"
import { obtenerEspecies } from "@/actions/mascotas/obtener-especies"
import type { MascotaCompleta } from "@/actions/mascotas/obtener"
import type { EspecieOpcion } from "@/actions/mascotas/obtener-especies"

interface Props {
  mascota: MascotaCompleta
}

export function AccionesMascota({ mascota }: Props) {
  const router = useRouter()
  const [editAbierto, setEditAbierto] = useState(false)
  const [desactivarAbierto, setDesactivarAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [especies, setEspecies] = useState<EspecieOpcion[]>([])

  const [form, setForm] = useState({
    nombre: mascota.nombre,
    especie_id: mascota.especie_id,
    raza: mascota.raza ?? "",
    color: mascota.color ?? "",
    sexo: mascota.sexo,
    peso: mascota.peso?.toString() ?? "",
    fecha_nacimiento: mascota.fecha_nacimiento ?? "",
    esterilizado: mascota.esterilizado ? "true" : "false",
  })

  async function abrirEditar() {
    setForm({
      nombre: mascota.nombre,
      especie_id: mascota.especie_id,
      raza: mascota.raza ?? "",
      color: mascota.color ?? "",
      sexo: mascota.sexo,
      peso: mascota.peso?.toString() ?? "",
      fecha_nacimiento: mascota.fecha_nacimiento ?? "",
      esterilizado: mascota.esterilizado ? "true" : "false",
    })
    const data = await obtenerEspecies()
    setEspecies(data)
    setEditAbierto(true)
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)

    const fd = new FormData()
    fd.set("id", mascota.id)
    fd.set("nombre", form.nombre)
    fd.set("especie_id", form.especie_id)
    if (form.raza) fd.set("raza", form.raza)
    if (form.color) fd.set("color", form.color)
    if (form.sexo) fd.set("sexo", form.sexo)
    if (form.peso) fd.set("peso", form.peso)
    if (form.fecha_nacimiento) fd.set("fecha_nacimiento", form.fecha_nacimiento)
    fd.set("esterilizado", form.esterilizado)

    const res = await editarMascota(fd)
    if (res.error) {
      toast.error(res.error)
      setCargando(false)
      return
    }

    toast.success("Mascota actualizada")
    setEditAbierto(false)
    setCargando(false)
    router.refresh()
  }

  async function handleDesactivar() {
    setCargando(true)
    const fd = new FormData()
    fd.set("id", mascota.id)
    const res = await desactivarMascota(fd)
    if (res.error) {
      toast.error(res.error)
      setCargando(false)
      return
    }
    toast.success("Mascota desactivada")
    setDesactivarAbierto(false)
    setCargando(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={abrirEditar}>
          <Pencil className="mr-2 size-4" />
          Editar
        </Button>
        {mascota.activo && (
          <Button variant="destructive" size="sm" onClick={() => setDesactivarAbierto(true)}>
            <Trash2 className="mr-2 size-4" />
            Desactivar
          </Button>
        )}
      </div>

      <Dialog open={editAbierto} onOpenChange={setEditAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar mascota</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ed-nombre">Nombre *</Label>
              <Input
                id="ed-nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ed-especie">Especie *</Label>
                <Select
                  value={form.especie_id}
                  onValueChange={(v) => setForm({ ...form, especie_id: v })}
                >
                  <SelectTrigger id="ed-especie">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {especies.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-raza">Raza</Label>
                <Input
                  id="ed-raza"
                  value={form.raza}
                  onChange={(e) => setForm({ ...form, raza: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ed-color">Color</Label>
                <Input
                  id="ed-color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-sexo">Sexo</Label>
                <Select
                  value={form.sexo}
                  onValueChange={(v) => setForm({ ...form, sexo: v })}
                >
                  <SelectTrigger id="ed-sexo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                    <SelectItem value="no_especificado">No especificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ed-peso">Peso (kg)</Label>
                <Input
                  id="ed-peso"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.peso}
                  onChange={(e) => setForm({ ...form, peso: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-fecha">Fecha nac.</Label>
                <Input
                  id="ed-fecha"
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ed-esterilizado">Esterilizado</Label>
              <Select
                value={form.esterilizado}
                onValueChange={(v) => setForm({ ...form, esterilizado: v })}
              >
                <SelectTrigger id="ed-esterilizado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditAbierto(false)}
                disabled={cargando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={cargando}>
                {cargando ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        abierto={desactivarAbierto}
        titulo="Desactivar mascota"
        descripcion={`¿Estás seguro de desactivar a ${mascota.nombre}? Esta acción no elimina los datos.`}
        etiquetaConfirmar="Desactivar"
        onConfirmar={handleDesactivar}
        onCancelar={() => setDesactivarAbierto(false)}
        cargando={cargando}
      />
    </>
  )
}
