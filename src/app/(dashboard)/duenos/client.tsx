"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Users, Plus, Search } from "lucide-react"
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
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { listarDuenos, type DuenoResumen } from "./listar"
import { crearDueno } from "@/actions/duenos/crear"
import { editarDueno } from "@/actions/duenos/editar"
import { desactivarDueno } from "@/actions/duenos/desactivar"


interface Props {
  duenosIniciales: DuenoResumen[]
}

export function DuenosClient({ duenosIniciales }: Props) {
  const router = useRouter()
  const [duenos, setDuenos] = useState(duenosIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [pendiente] = useTransition()

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [editarAbierto, setEditarAbierto] = useState(false)
  const [desactivarAbierto, setDesactivarAbierto] = useState(false)
  const [duenoSeleccionado, setDuenoSeleccionado] = useState<DuenoResumen | null>(null)

  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
  })
  const [errorForm, setErrorForm] = useState<string | null>(null)

  async function recargar() {
    const data = await listarDuenos()
    setDuenos(data)
    router.refresh()
  }

  function abrirCrear() {
    setFormData({ cedula: "", nombre: "", telefono: "", email: "", direccion: "" })
    setErrorForm(null)
    setCrearAbierto(true)
  }

  function abrirEditar(dueno: DuenoResumen) {
    setDuenoSeleccionado(dueno)
    setFormData({
      cedula: dueno.cedula ?? "",
      nombre: dueno.nombre,
      telefono: dueno.telefono,
      email: dueno.email ?? "",
      direccion: "",
    })
    setErrorForm(null)
    setEditarAbierto(true)
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    setErrorForm(null)

    const form = new FormData()
    form.set("nombre", formData.nombre)
    form.set("telefono", formData.telefono)
    if (formData.cedula) form.set("cedula", formData.cedula)
    if (formData.email) form.set("email", formData.email)
    if (formData.direccion) form.set("direccion", formData.direccion)

    const res = await crearDueno(form)

    if (res.error) {
      if (res.detalles) {
        const msgs = Object.values(res.detalles.fieldErrors).flat()
        setErrorForm(msgs.join(", ") || res.error)
      } else {
        setErrorForm(res.error)
      }
      return
    }

    toast.success("Dueño registrado")
    setCrearAbierto(false)
    recargar()
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    if (!duenoSeleccionado) return
    setErrorForm(null)

    const form = new FormData()
    form.set("id", duenoSeleccionado.id)
    form.set("nombre", formData.nombre)
    form.set("telefono", formData.telefono)
    if (formData.cedula) form.set("cedula", formData.cedula)
    if (formData.email) form.set("email", formData.email)
    if (formData.direccion) form.set("direccion", formData.direccion)

    const res = await editarDueno(form)

    if (res.error) {
      if (res.detalles) {
        const msgs = Object.values(res.detalles.fieldErrors).flat()
        setErrorForm(msgs.join(", ") || res.error)
      } else {
        setErrorForm(res.error)
      }
      return
    }

    toast.success("Dueño actualizado")
    setEditarAbierto(false)
    setDuenoSeleccionado(null)
    recargar()
  }

  function abrirDesactivar(dueno: DuenoResumen) {
    setDuenoSeleccionado(dueno)
    setDesactivarAbierto(true)
  }

  async function handleDesactivar() {
    if (!duenoSeleccionado) return

    const form = new FormData()
    form.set("id", duenoSeleccionado.id)

    const res = await desactivarDueno(form)
    if (res.error) { toast.error(res.error); return }

    toast.success("Dueño desactivado")
    setDesactivarAbierto(false)
    setDuenoSeleccionado(null)
    recargar()
  }

  const duenosFiltrados = busqueda.length >= 2
    ? duenos.filter(
        (d) =>
          d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          d.telefono.includes(busqueda) ||
          (d.cedula ?? "").includes(busqueda)
      )
    : duenos

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dueños</h1>
        <Button onClick={abrirCrear}>
          <Plus className="mr-2 size-4" />
          Nuevo dueño
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono o cédula..."
          className="pl-9"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {duenos.length === 0 ? (
        <EmptyState
          icon={<Users className="size-12" />}
          titulo="Aún no has registrado ningún dueño"
          descripcion="Registra el primer dueño para comenzar a gestionar tus pacientes."
          accion={{ label: "Registrar primer dueño", onClick: abrirCrear }}
        />
      ) : (
        <DataTable
          columns={[
            { key: "nombre", header: "Nombre" },
            { key: "cedula", header: "Cédula", render: (d) => d.cedula || <span className="text-muted-foreground">—</span> },
            { key: "telefono", header: "Teléfono" },
            {
              key: "email",
              header: "Email",
              render: (d) => d.email || <span className="text-muted-foreground">—</span>,
            },
            {
              key: "mascotas_count",
              header: "Mascotas",
              render: (d) => (
                <Badge variant="secondary">{d.mascotas_count}</Badge>
              ),
            },
            {
              key: "activo",
              header: "Estado",
              render: (d) =>
                d.activo ? (
                  <Badge variant="success">Activo</Badge>
                ) : (
                  <Badge variant="destructive">Inactivo</Badge>
                ),
            },
            {
              key: "id",
              header: "",
              render: (d) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); abrirEditar(d) }}>
                    Editar
                  </Button>
                  {d.activo && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); abrirDesactivar(d) }}>
                      Desactivar
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={duenosFiltrados}
          onRowClick={(d) => router.push(`/duenos/${d.id}`)}
        />
      )}

      <Dialog open={crearAbierto} onOpenChange={setCrearAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo dueño</DialogTitle>
            <DialogDescription>Registra un nuevo dueño en la clínica.</DialogDescription>
          </DialogHeader>
          <FormularioDueno
            data={formData}
            onChange={setFormData}
            error={errorForm}
            onSubmit={handleCrear}
            onCancel={() => setCrearAbierto(false)}
            pendiente={pendiente}
            submitLabel="Registrar"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editarAbierto} onOpenChange={setEditarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar dueño</DialogTitle>
            <DialogDescription>Actualiza los datos del dueño.</DialogDescription>
          </DialogHeader>
          <FormularioDueno
            data={formData}
            onChange={setFormData}
            error={errorForm}
            onSubmit={handleEditar}
            onCancel={() => setEditarAbierto(false)}
            pendiente={pendiente}
            submitLabel="Guardar"
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        abierto={desactivarAbierto}
        titulo="Desactivar dueño"
        descripcion={
          duenoSeleccionado
            ? `¿Estás seguro de desactivar a ${duenoSeleccionado.nombre}? No podrá ser seleccionado en nuevas citas.`
            : ""
        }
        etiquetaConfirmar="Desactivar"
        onConfirmar={handleDesactivar}
        onCancelar={() => setDesactivarAbierto(false)}
        cargando={pendiente}
      />
    </div>
  )
}

interface FormularioDuenoProps {
  data: { cedula: string; nombre: string; telefono: string; email: string; direccion: string }
  onChange: (data: FormularioDuenoProps["data"]) => void
  error: string | null
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  pendiente: boolean
  submitLabel: string
}

function FormularioDueno({
  data,
  onChange,
  error,
  onSubmit,
  onCancel,
  pendiente,
  submitLabel,
}: FormularioDuenoProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dueno-cedula">Cédula</Label>
        <Input
          id="dueno-cedula"
          value={data.cedula}
          onChange={(e) => onChange({ ...data, cedula: e.target.value })}
          placeholder="opcional"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueno-nombre">Nombre *</Label>
        <Input
          id="dueno-nombre"
          value={data.nombre}
          onChange={(e) => onChange({ ...data, nombre: e.target.value })}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueno-telefono">Teléfono *</Label>
        <Input
          id="dueno-telefono"
          value={data.telefono}
          onChange={(e) => onChange({ ...data, telefono: e.target.value })}
          required
          placeholder="+521234567890"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueno-email">Email</Label>
        <Input
          id="dueno-email"
          type="email"
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder="opcional"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueno-direccion">Dirección</Label>
        <Input
          id="dueno-direccion"
          value={data.direccion}
          onChange={(e) => onChange({ ...data, direccion: e.target.value })}
          placeholder="opcional"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
