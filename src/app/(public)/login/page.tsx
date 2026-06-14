"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { crearClienteNavegador } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function enviarMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const supabase = crearClienteNavegador()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setEnviando(false)

    if (err) {
      setError(err.message)
      return
    }

    setEnviado(true)
  }

  if (enviado) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Revisa tu email</CardTitle>
          <CardDescription>
            Te enviamos un magic link a <strong>{email}</strong>. El enlace expira en 1 hora.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button variant="ghost" onClick={() => setEnviado(false)}>
            Usar otro email
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Inicia sesión</CardTitle>
        <CardDescription>
          Ingresa tu email para recibir un magic link
        </CardDescription>
      </CardHeader>
      <form onSubmit={enviarMagicLink}>
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
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar magic link"}
          </Button>
          <p className="text-sm text-muted-foreground">
            ¿Eres nuevo?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/registro")}>
              Registrar clínica
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
