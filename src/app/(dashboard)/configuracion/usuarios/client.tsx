"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserCog, MoreHorizontal } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { listarMiembros, type MiembroStaff } from "@/actions/usuarios/listar-miembros"
import { invitarUsuario } from "@/actions/usuarios/invitar"
import { cambiarRolUsuario } from "@/actions/usuarios/cambiar-rol"
import { desactivarUsuario } from "@/actions/usuarios/desactivar"

const ETIQUETAS_ROL: Record<string, string> = {
  admin: "Admin",
  vet: "Veterinario",
  recepcionista: "Recepcionista",
}

const COLORES_ROL: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  vet: "secondary",
  recepcionista: "outline",
}

interface Props {
  miembrosIniciales: MiembroStaff[]
}

export function MiembrosClient({ miembrosIniciales }: Props) {
  const router = useRouter()
  const [miembros, setMiembros] = useState(miembrosIniciales)
  const [invitarAbierto, setInvitarAbierto] = useState(false)
  const [cambiarRolAbierto, setCambiarRolAbierto] = useState(false)
  const [desactivarAbierto, setDesactivarAbierto] = useState(false)
  const [miembroSeleccionado, setMiembroSeleccionado] = useState<MiembroStaff | null>(null)
  const [pendiente] = useTransition()

  const [formInvitar, setFormInvitar] = useState({ email: "", nombre: "", rol: "recepcionista" })
  const [errorInvitar, setErrorInvitar] = useState<string | null>(null)
  const [nuevoRol, setNuevoRol] = useState("")

  async function recargar() {
    const data = await listarMiembros()
    setMiembros(data)
    router.refresh()
  }

  function abrirInvitar() {
    setFormInvitar({ email: "", nombre: "", rol: "recepcionista" })
    setErrorInvitar(null)
    setInvitarAbierto(true)
  }

  async function handleInvitar(e: React.FormEvent) {
    e.preventDefault()
    setErrorInvitar(null)

    const form = new FormData()
    form.set("email", formInvitar.email)
    form.set("nombre", formInvitar.nombre)
    form.set("rol", formInvitar.rol)

    const res = await invitarUsuario(form)

    if (res.error) {
      if (res.detalles) {
        const msgs = Object.values(res.detalles.fieldErrors).flat()
        setErrorInvitar(msgs.join(", ") || res.error)
      } else {
        setErrorInvitar(res.error)
      }
      return
    }

    toast.success(res.mensaje ?? "Invitación enviada")
    setInvitarAbierto(false)
    recargar()
  }

  function abrirCambiarRol(miembro: MiembroStaff) {
    setMiembroSeleccionado(miembro)
    setNuevoRol(miembro.rol)
    setCambiarRolAbierto(true)
  }

  async function handleCambiarRol() {
    if (!miembroSeleccionado || !nuevoRol) return

    const form = new FormData()
    form.set("usuarioId", miembroSeleccionado.id)
    form.set("nuevoRol", nuevoRol)

    const res = await cambiarRolUsuario(form)
    if (res.error) { toast.error(res.error); return }

    toast.success("Rol actualizado")
    setCambiarRolAbierto(false)
    setMiembroSeleccionado(null)
    recargar()
  }

  function abrirDesactivar(miembro: MiembroStaff) {
    setMiembroSeleccionado(miembro)
    setDesactivarAbierto(true)
  }

  async function handleDesactivar() {
    if (!miembroSeleccionado) return

    const form = new FormData()
    form.set("usuarioId", miembroSeleccionado.id)

    const res = await desactivarUsuario(form)
    if (res.error) { toast.error(res.error); return }

    toast.success(`${miembroSeleccionado.nombre} ha sido desactivado`)
    setDesactivarAbierto(false)
    setMiembroSeleccionado(null)
    recargar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Miembros del staff</h1>
        <Button onClick={abrirInvitar}>Invitar miembro</Button>
      </div>

      {miembros.length === 0 ? (
        <EmptyState
          icon={<UserCog className="size-12" />}
          titulo="Aún no has invitado a nadie a tu clínica"
          descripcion="Invita a veterinarios y recepcionistas para que se unan a tu clínica."
          accion={{ label: "Invitar miembro", onClick: abrirInvitar }}
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "nombre",
              header: "Nombre",
              render: (m) => (
                <div>
                  <p className="font-medium">{m.nombre}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              ),
            },
            {
              key: "rol",
              header: "Rol",
              render: (m) => (
                <Badge variant={COLORES_ROL[m.rol] ?? "outline"}>
                  {ETIQUETAS_ROL[m.rol] ?? m.rol}
                </Badge>
              ),
            },
            {
              key: "ultimo_acceso",
              header: "Estado",
              render: (m) => {
                if (!m.activo) return <Badge variant="destructive">Inactivo</Badge>
                if (!m.ultimo_acceso) return <Badge variant="warning">Pendiente</Badge>
                return <Badge variant="success">Activo</Badge>
              },
            },
            {
              key: "id",
              header: "",
              render: (m) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="size-8 p-0">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => abrirCambiarRol(m)}>
                      Cambiar rol
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => abrirDesactivar(m)}>
                      Desactivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]}
          data={miembros}
        />
      )}

      <Dialog open={invitarAbierto} onOpenChange={setInvitarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar miembro</DialogTitle>
            <DialogDescription>
              El nuevo miembro recibirá un enlace para acceder a la clínica.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvitar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invitar-email">Email</Label>
              <Input
                id="invitar-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formInvitar.email}
                onChange={(e) => setFormInvitar({ ...formInvitar, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invitar-nombre">Nombre</Label>
              <Input
                id="invitar-nombre"
                placeholder="Nombre completo"
                value={formInvitar.nombre}
                onChange={(e) => setFormInvitar({ ...formInvitar, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invitar-rol">Rol</Label>
              <Select value={formInvitar.rol} onValueChange={(v) => setFormInvitar({ ...formInvitar, rol: v })}>
                <SelectTrigger id="invitar-rol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="vet">Veterinario</SelectItem>
                  <SelectItem value="recepcionista">Recepcionista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorInvitar && <p className="text-sm text-destructive">{errorInvitar}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInvitarAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pendiente}>
                {pendiente ? "Enviando..." : "Invitar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cambiarRolAbierto} onOpenChange={setCambiarRolAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar rol</DialogTitle>
            <DialogDescription>
              {miembroSeleccionado ? `Nuevo rol para ${miembroSeleccionado.nombre}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nuevo-rol">Rol</Label>
            <Select value={nuevoRol} onValueChange={setNuevoRol}>
              <SelectTrigger id="nuevo-rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="vet">Veterinario</SelectItem>
                <SelectItem value="recepcionista">Recepcionista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCambiarRolAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCambiarRol} disabled={pendiente}>
              {pendiente ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        abierto={desactivarAbierto}
        titulo="Desactivar miembro"
        descripcion={
          miembroSeleccionado
            ? `¿Estás seguro de desactivar a ${miembroSeleccionado.nombre}? No podrá iniciar sesión hasta que sea reactivado.`
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
