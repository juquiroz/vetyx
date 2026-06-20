import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { obtenerMascota } from "@/actions/mascotas/obtener"
import { obtenerVacunas } from "@/actions/vacunas/obtener"
import { Timeline } from "@/components/historial/timeline"
import { AccionesMascota } from "./acciones"
import { PawPrint, Clock, Syringe, Calendar, Weight, Info } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function FichaMascotaPage({ params }: Props) {
  const { id } = await params
  const mascota = await obtenerMascota(id)

  if (!mascota) notFound()

  const vacunas = await obtenerVacunas(id)

  const ETIQUETAS_SEXO: Record<string, string> = {
    macho: "Macho",
    hembra: "Hembra",
    no_especificado: "No especificado",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{mascota.nombre}</h1>
          {mascota.activo ? (
            <Badge variant="success">Activo</Badge>
          ) : (
            <Badge variant="destructive">Inactivo</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <AccionesMascota mascota={mascota} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/duenos/${mascota.dueno.id}`}>
              Ver dueño
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2 text-sm">
            <PawPrint className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Especie:</span>
            <span className="font-medium">{mascota.especie}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Raza:</span>
            <span className="font-medium">{mascota.raza || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Color:</span>
            <span className="font-medium">{mascota.color || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Sexo:</span>
            <span className="font-medium">{ETIQUETAS_SEXO[mascota.sexo] ?? mascota.sexo}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Weight className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Peso:</span>
            <span className="font-medium">{mascota.peso ? `${mascota.peso} kg` : "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Nacimiento:</span>
            <span className="font-medium">{mascota.fecha_nacimiento ? new Date(mascota.fecha_nacimiento).toLocaleDateString("es-MX") : "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Esterilizado:</span>
            <span className="font-medium">{mascota.esterilizado ? "Sí" : "No"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:col-span-2">
            <PawPrint className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Dueño:</span>
            <Link href={`/duenos/${mascota.dueno.id}`} className="font-medium text-primary hover:underline">
              {mascota.dueno.nombre}
            </Link>
            <span className="text-muted-foreground">· {mascota.dueno.telefono}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="historial">
        <TabsList>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <Clock className="size-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="vacunas" className="flex items-center gap-2">
            <Syringe className="size-4" />
            Vacunas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historial" className="pt-4">
          <Timeline mascotaId={mascota.id} />
        </TabsContent>

        <TabsContent value="vacunas" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vacunas</h2>
            <Button asChild size="sm">
              <Link href={`/vacunas/${mascota.id}`}>Registrar vacuna</Link>
            </Button>
          </div>
          {vacunas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Syringe className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Este paciente no tiene vacunas registradas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vacunas.map((vacuna) => (
                <Card key={vacuna.id}>
                  <CardContent className="flex items-start justify-between p-4">
                    <div>
                      <p className="font-medium">{vacuna.nombre_vacuna}</p>
                      {vacuna.lote && (
                        <p className="text-xs text-muted-foreground">Lote: {vacuna.lote}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(vacuna.fecha_aplicacion).toLocaleDateString("es-MX")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
