import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { obtenerDueno } from "@/actions/duenos/obtener"
import { PawPrint, Phone, Mail, MapPin, IdCard } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PerfilDuenoPage({ params }: Props) {
  const { id } = await params
  const dueno = await obtenerDueno(id)

  if (!dueno) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dueno.nombre}</h1>
        <div className="flex gap-2">
          {dueno.activo ? (
            <Badge variant="success">Activo</Badge>
          ) : (
            <Badge variant="destructive">Inactivo</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dueno.cedula && (
            <div className="flex items-center gap-2 text-sm">
              <IdCard className="size-4 text-muted-foreground" />
              <span>Cédula: {dueno.cedula}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="size-4 text-muted-foreground" />
            <span>{dueno.telefono}</span>
          </div>
          {dueno.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              <span>{dueno.email}</span>
            </div>
          )}
          {dueno.direccion && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-muted-foreground" />
              <span>{dueno.direccion}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mascotas</h2>
          <Button asChild size="sm">
            <Link href={`/mascotas?dueno_id=${dueno.id}`}>
              <PawPrint className="mr-2 size-4" />
              Agregar mascota
            </Link>
          </Button>
        </div>

        {dueno.mascotas.length === 0 ? (
          <EmptyState
            icon={<PawPrint className="size-8" />}
            titulo="Este dueño aún no tiene mascotas registradas"
            descripcion="Registra la primera mascota para comenzar su historial médico."
            accion={{ label: "Agregar primera mascota", href: `/mascotas?dueno_id=${dueno.id}` }}
          />
        ) : (
          <div className="grid gap-3">
            {dueno.mascotas.map((mascota) => (
              <Link key={mascota.id} href={`/mascotas/${mascota.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <PawPrint className="size-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{mascota.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {mascota.especie}
                          {mascota.raza ? ` · ${mascota.raza}` : ""}
                          {mascota.color ? ` · ${mascota.color}` : ""}
                        </p>
                      </div>
                    </div>
                    {mascota.activo ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="destructive">Inactivo</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
