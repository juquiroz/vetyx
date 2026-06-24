"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2, User, ArrowLeft } from "lucide-react"
import { crearClienteNavegador } from "@/lib/supabase/client"
import { registrarClinica } from "@/actions/auth/registro"
import { registrarDueno } from "@/actions/auth/registrar-dueño"

type Paso = "seleccion" | "clinica" | "dueno"

export default function RegistroPage() {
  const [paso, setPaso] = useState<Paso>("seleccion")
  const [email, setEmail] = useState("")
  const [nombreClinica, setNombreClinica] = useState("")
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmitClinica(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const form = new FormData()
    form.set("email", email)
    form.set("nombreClinica", nombreClinica)

    const res = await registrarClinica(form)
    setEnviando(false)

    if (res.error) {
      setError(res.error)
      return
    }

    if (res.accessToken && res.refreshToken) {
      const supabase = crearClienteNavegador()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: res.accessToken,
        refresh_token: res.refreshToken,
      })
      if (sessionError) {
        setError(sessionError.message)
        return
      }
      router.push("/inicio")
    }
  }

  async function handleSubmitDueno(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const form = new FormData()
    form.set("email", email)
    form.set("nombre", nombre)
    form.set("telefono", telefono)

    const res = await registrarDueno(form)
    setEnviando(false)

    if (res.error) {
      setError(res.error)
      return
    }

    if (res.accessToken && res.refreshToken) {
      const supabase = crearClienteNavegador()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: res.accessToken,
        refresh_token: res.refreshToken,
      })
      if (sessionError) {
        setError(sessionError.message)
        return
      }
      router.push("/inicio")
    }
  }

  if (paso === "seleccion") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>
            ¿Qué tipo de cuenta quieres crear?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            onClick={() => { setPaso("clinica"); setError(null) }}
            className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Soy una clínica veterinaria</p>
              <p className="text-sm text-muted-foreground">
                Gestiona pacientes, citas, historial clínico y más
              </p>
            </div>
          </button>
          <button
            onClick={() => { setPaso("dueno"); setError(null) }}
            className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <User className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Soy dueño de mascota</p>
              <p className="text-sm text-muted-foreground">
                Lleva el control de las vacunas e historial de tus mascotas
              </p>
            </div>
          </button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          </p>
        </CardFooter>
      </Card>
    )
  }

  if (paso === "dueno") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Registrarme como dueño</CardTitle>
          <CardDescription>
            Crea tu cuenta para llevar el control de tus mascotas
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitDueno}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="555-123-4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                maxLength={20}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
            <Button
              variant="link"
              className="p-0 h-auto text-sm"
              onClick={() => { setPaso("seleccion"); setError(null) }}
            >
              <ArrowLeft className="mr-1 size-3" />
              Atrás
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Registrar clínica</CardTitle>
        <CardDescription>
          Crea tu cuenta para empezar a usar Vetyx
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmitClinica}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombreClinica">Nombre de la clínica</Label>
            <Input
              id="nombreClinica"
              placeholder="Veterinaria Patitas Felices"
              value={nombreClinica}
              onChange={(e) => setNombreClinica(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Creando clínica..." : "Crear clínica"}
          </Button>
          <Button
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => { setPaso("seleccion"); setError(null) }}
          >
            <ArrowLeft className="mr-1 size-3" />
            Atrás
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
