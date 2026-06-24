"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserPlus, Users } from "lucide-react"
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
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { listarClientes, type ClienteInfo } from "@/actions/usuarios/listar-clientes"
import { agregarCliente } from "@/actions/usuarios/agregar-cliente"

interface Props {
  clientesIniciales: ClienteInfo[]
}

export function ClientesClient({ clientesIniciales }: Props) {
  const router = useRouter()
  const [clientes, setClientes] = useState(clientesIniciales)
  const [agregarAbierto, setAgregarAbierto] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pendiente] = useTransition()

  async function recargar() {
    const data = await listarClientes()
    setClientes(data)
    router.refresh()
  }

  function abrirAgregar() {
    setEmail("")
    setError(null)
    setAgregarAbierto(true)
  }

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const form = new FormData()
    form.set("email", email)

    const res = await agregarCliente(form)

    if (res.error) {
      if (res.detalles) {
        const msgs = Object.values(res.detalles.fieldErrors).flat()
        setError(msgs.join(", ") || res.error)
      } else {
        setError(res.error)
      }
      return
    }

    toast.success(res.mensaje ?? "Cliente agregado")
    setAgregarAbierto(false)
    recargar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={abrirAgregar}>
          <UserPlus className="mr-2 size-4" />
          Agregar cliente
        </Button>
      </div>

      {clientes.length === 0 ? (
        <EmptyState
          icon={<Users className="size-12" />}
          titulo="No hay clientes vinculados"
          descripcion="Agrega a los dueños de mascotas que son clientes de tu clínica."
          accion={{ label: "Agregar cliente", onClick: abrirAgregar }}
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
              key: "telefono",
              header: "Teléfono",
              render: (m) => m.telefono ?? "—",
            },
            {
              key: "desde",
              header: "Desde",
              render: (m) => new Date(m.desde).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
            },
          ]}
          data={clientes}
        />
      )}

      <Dialog open={agregarAbierto} onOpenChange={setAgregarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar cliente</DialogTitle>
            <DialogDescription>
              Vincula a un usuario registrado en Vetyx como cliente de tu clínica.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAgregar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente-email">Email del usuario</Label>
              <Input
                id="cliente-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAgregarAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pendiente}>
                {pendiente ? "Agregando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
