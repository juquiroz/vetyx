"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PawPrint, Plus, Search, Bolt } from "lucide-react"
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
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import type { MascotaResumen } from "@/actions/mascotas/listar"
import type { EspecieOpcion } from "@/actions/mascotas/obtener-especies"
import { listarMascotas } from "@/actions/mascotas/listar"
import { crearMascota } from "@/actions/mascotas/crear"
import { crearMascotaConDueno } from "@/actions/mascotas/crear-con-dueno"
import { buscarDuenos } from "@/actions/duenos/buscar"

interface Props {
  mascotasIniciales: MascotaResumen[]
  especies: EspecieOpcion[]
}

const ETIQUETAS_SEXO: Record<string, string> = {
  macho: "Macho",
  hembra: "Hembra",
  no_especificado: "No especificado",
}

export function MascotasClient({ mascotasIniciales, especies }: Props) {
  const router = useRouter()
  const [mascotas, setMascotas] = useState(mascotasIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [pendiente] = useTransition()

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [altaRapidaAbierto, setAltaRapidaAbierto] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [busquedaDueno, setBusquedaDueno] = useState("")
  const [resultadosDueno, setResultadosDueno] = useState<Array<{ id: string; nombre: string }>>([])
  const [duenoSeleccionado, setDuenoSeleccionado] = useState<{ id: string; nombre: string } | null>(null)

  const [formMascota, setFormMascota] = useState({
    nombre: "", especie_id: "", raza: "", sexo: "no_especificado",
    fecha_nacimiento: "", color: "", peso: "", esterilizado: "false",
  })

  const [formAltaRapida, setFormAltaRapida] = useState({
    dueno_nombre: "", dueno_telefono: "", dueno_email: "", dueno_cedula: "",
    mascota_nombre: "", especie_id: "", raza: "", color: "", sexo: "no_especificado",
  })

  async function recargar() {
    const data = await listarMascotas()
    setMascotas(data)
    router.refresh()
  }

  function abrirCrear(duenoPredefinido?: { id: string; nombre: string }) {
    if (duenoPredefinido) {
      setDuenoSeleccionado(duenoPredefinido)
    } else {
      setDuenoSeleccionado(null)
    }
    setFormMascota({ nombre: "", especie_id: "", raza: "", sexo: "no_especificado", fecha_nacimiento: "", color: "", peso: "", esterilizado: "false" })
    setErrorForm(null)
    setBusquedaDueno("")
    setResultadosDueno([])
    setCrearAbierto(true)
  }

  async function buscarDuenosHandler(query: string) {
    setBusquedaDueno(query)
    if (query.length < 2) { setResultadosDueno([]); return }
    const res = await buscarDuenos(query)
    setResultadosDueno(res.filter((d) => d.activo).map((d) => ({ id: d.id, nombre: d.nombre })))
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!duenoSeleccionado) { setErrorForm("Selecciona un dueño"); return }
    setErrorForm(null)

    const form = new FormData()
    form.set("owner_id", duenoSeleccionado.id)
    form.set("nombre", formMascota.nombre)
    form.set("especie_id", formMascota.especie_id)
    if (formMascota.raza) form.set("raza", formMascota.raza)
    if (formMascota.sexo) form.set("sexo", formMascota.sexo)
    if (formMascota.fecha_nacimiento) form.set("fecha_nacimiento", formMascota.fecha_nacimiento)
    if (formMascota.color) form.set("color", formMascota.color)
    if (formMascota.peso) form.set("peso", formMascota.peso)
    form.set("esterilizado", formMascota.esterilizado)

    const res = await crearMascota(form)
    if (res.error) {
      if (res.detalles) {
        const msgs = Object.values(res.detalles.fieldErrors).flat()
        setErrorForm(msgs.join(", ") || res.error)
      } else { setErrorForm(res.error) }
      return
    }

    toast.success("Mascota registrada")
    setCrearAbierto(false)
    recargar()
  }

  async function handleAltaRapida(e: React.FormEvent) {
    e.preventDefault()
    setErrorForm(null)

    const form = new FormData()
    form.set("dueno_nombre", formAltaRapida.dueno_nombre)
    form.set("dueno_telefono", formAltaRapida.dueno_telefono)
    if (formAltaRapida.dueno_email) form.set("dueno_email", formAltaRapida.dueno_email)
    if (formAltaRapida.dueno_cedula) form.set("dueno_cedula", formAltaRapida.dueno_cedula)
    form.set("mascota_nombre", formAltaRapida.mascota_nombre)
    form.set("especie_id", formAltaRapida.especie_id)
    if (formAltaRapida.raza) form.set("raza", formAltaRapida.raza)
    if (formAltaRapida.color) form.set("color", formAltaRapida.color)
    if (formAltaRapida.sexo) form.set("sexo", formAltaRapida.sexo)

    const res = await crearMascotaConDueno(form)
    if (res.error) {
      if (res.detalles) {
        const msgs = Object.values(res.detalles.fieldErrors).flat()
        setErrorForm(msgs.join(", ") || res.error)
      } else { setErrorForm(res.error) }
      return
    }

    toast.success("Dueño y mascota registrados")
    setAltaRapidaAbierto(false)
    recargar()
  }

  const filtradas = busqueda.length >= 2
    ? mascotas.filter(
        (m) =>
          m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          m.dueno_nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : mascotas

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mascotas</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAltaRapidaAbierto(true)}>
            <Bolt className="mr-2 size-4" />
            Alta rápida
          </Button>
          <Button onClick={() => abrirCrear()}>
            <Plus className="mr-2 size-4" />
            Nueva mascota
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre de mascota o dueño..."
          className="pl-9"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {mascotas.length === 0 ? (
        <EmptyState
          icon={<PawPrint className="size-12" />}
          titulo="No hay mascotas registradas"
          descripcion="Registra una mascota para comenzar su historial médico."
          accion={{ label: "Alta rápida", onClick: () => setAltaRapidaAbierto(true) }}
        />
      ) : (
        <DataTable
          columns={[
            { key: "nombre", header: "Nombre" },
            { key: "especie", header: "Especie" },
            {
              key: "raza",
              header: "Raza",
              render: (m) => m.raza || <span className="text-muted-foreground">—</span>,
            },
            {
              key: "dueno_nombre",
              header: "Dueño",
              render: (m) => (
                <button
                  className="text-primary hover:underline"
                  onClick={(e) => { e.stopPropagation(); router.push(`/duenos/${m.dueno_id}`) }}
                >
                  {m.dueno_nombre}
                </button>
              ),
            },
            {
              key: "sexo",
              header: "Sexo",
              render: (m) => ETIQUETAS_SEXO[m.sexo] ?? m.sexo,
            },
            {
              key: "activo",
              header: "Estado",
              render: (m) =>
                m.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>,
            },
          ]}
          data={filtradas}
          onRowClick={(m) => router.push(`/mascotas/${m.id}`)}
        />
      )}

      <Dialog open={crearAbierto} onOpenChange={setCrearAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva mascota</DialogTitle>
            <DialogDescription>Registra una mascota vinculada a un dueño existente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCrear} className="space-y-4">
            <div className="space-y-2">
              <Label>Dueño *</Label>
              {duenoSeleccionado ? (
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-sm">{duenoSeleccionado.nombre}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDuenoSeleccionado(null)}>
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar dueño por nombre o teléfono..."
                    value={busquedaDueno}
                    onChange={(e) => buscarDuenosHandler(e.target.value)}
                  />
                  {resultadosDueno.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-md border">
                      {resultadosDueno.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => { setDuenoSeleccionado(d); setResultadosDueno([]); setBusquedaDueno("") }}
                        >
                          {d.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mascota-nombre">Nombre *</Label>
              <Input id="mascota-nombre" value={formMascota.nombre} onChange={(e) => setFormMascota({ ...formMascota, nombre: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mascota-especie">Especie *</Label>
              <Select value={formMascota.especie_id} onValueChange={(v) => setFormMascota({ ...formMascota, especie_id: v })}>
                <SelectTrigger id="mascota-especie"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {especies.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mascota-raza">Raza</Label>
                <Input id="mascota-raza" value={formMascota.raza} onChange={(e) => setFormMascota({ ...formMascota, raza: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mascota-color">Color</Label>
                <Input id="mascota-color" value={formMascota.color} onChange={(e) => setFormMascota({ ...formMascota, color: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mascota-sexo">Sexo</Label>
                <Select value={formMascota.sexo} onValueChange={(v) => setFormMascota({ ...formMascota, sexo: v })}>
                  <SelectTrigger id="mascota-sexo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                    <SelectItem value="no_especificado">No especificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mascota-fecha">Fecha nac.</Label>
                <Input id="mascota-fecha" type="date" value={formMascota.fecha_nacimiento} onChange={(e) => setFormMascota({ ...formMascota, fecha_nacimiento: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mascota-peso">Peso (kg)</Label>
                <Input id="mascota-peso" type="number" step="0.1" min="0" value={formMascota.peso} onChange={(e) => setFormMascota({ ...formMascota, peso: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mascota-esterilizado">Esterilizado</Label>
                <Select value={formMascota.esterilizado} onValueChange={(v) => setFormMascota({ ...formMascota, esterilizado: v })}>
                  <SelectTrigger id="mascota-esterilizado"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {errorForm && <p className="text-sm text-destructive">{errorForm}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCrearAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={pendiente}>{pendiente ? "Guardando..." : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={altaRapidaAbierto} onOpenChange={setAltaRapidaAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alta rápida</DialogTitle>
            <DialogDescription>Registra dueño y mascota en una misma pantalla.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAltaRapida} className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Datos del dueño</p>
            <div className="space-y-2">
              <Label htmlFor="ar-nombre">Nombre *</Label>
              <Input id="ar-nombre" value={formAltaRapida.dueno_nombre} onChange={(e) => setFormAltaRapida({ ...formAltaRapida, dueno_nombre: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-telefono">Teléfono *</Label>
              <Input id="ar-telefono" value={formAltaRapida.dueno_telefono} onChange={(e) => setFormAltaRapida({ ...formAltaRapida, dueno_telefono: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-cedula">Cédula</Label>
              <Input id="ar-cedula" value={formAltaRapida.dueno_cedula} onChange={(e) => setFormAltaRapida({ ...formAltaRapida, dueno_cedula: e.target.value })} placeholder="opcional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-email">Email</Label>
              <Input id="ar-email" type="email" value={formAltaRapida.dueno_email} onChange={(e) => setFormAltaRapida({ ...formAltaRapida, dueno_email: e.target.value })} />
            </div>

            <p className="text-sm font-medium text-muted-foreground">Datos de la mascota</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ar-mascota-nombre">Nombre *</Label>
                <Input id="ar-mascota-nombre" value={formAltaRapida.mascota_nombre} onChange={(e) => setFormAltaRapida({ ...formAltaRapida, mascota_nombre: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ar-especie">Especie *</Label>
                <Select value={formAltaRapida.especie_id} onValueChange={(v) => setFormAltaRapida({ ...formAltaRapida, especie_id: v })}>
                  <SelectTrigger id="ar-especie"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {especies.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ar-raza">Raza</Label>
                <Input id="ar-raza" value={formAltaRapida.raza} onChange={(e) => setFormAltaRapida({ ...formAltaRapida, raza: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ar-color">Color</Label>
                <Input id="ar-color" value={formAltaRapida.color} onChange={(e) => setFormAltaRapida({ ...formAltaRapida, color: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ar-sexo">Sexo</Label>
              <Select value={formAltaRapida.sexo} onValueChange={(v) => setFormAltaRapida({ ...formAltaRapida, sexo: v })}>
                <SelectTrigger id="ar-sexo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                  <SelectItem value="no_especificado">No especificado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {errorForm && <p className="text-sm text-destructive">{errorForm}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAltaRapidaAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={pendiente}>{pendiente ? "Guardando..." : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
