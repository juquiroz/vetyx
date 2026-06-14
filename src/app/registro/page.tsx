"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { registrarClinica } from "@/actions/auth/registro"

export default function RegistroPage() {
  const [email, setEmail] = useState("")
  const [nombreClinica, setNombreClinica] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const formData = new FormData()
    formData.set("email", email)
    formData.set("nombreClinica", nombreClinica)

    const result = await registrarClinica(formData)

    setEnviando(false)

    if ("error" in result && result.error) {
      setError(result.error)
      return
    }

    setExito(true)
  }

  if (exito) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">¡Clínica creada!</CardTitle>
          <CardDescription>
            Revisa tu email para activar tu cuenta. El enlace expira en 1 hora.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button variant="ghost" onClick={() => router.push("/login")}>
            Ir a iniciar sesión
          </Button>
        </CardFooter>
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
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Creando clínica..." : "Crear clínica"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
