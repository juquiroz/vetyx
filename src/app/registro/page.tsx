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
import { crearClienteNavegador } from "@/lib/supabase/client"
import { registrarClinica } from "@/actions/auth/registro"

export default function RegistroPage() {
  const [email, setEmail] = useState("")
  const [nombreClinica, setNombreClinica] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Registrar clínica</CardTitle>
        <CardDescription>
          Crea tu cuenta para empezar a usar Vetyx
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
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
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => router.push("/login")}
            >
              Iniciar sesión
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
