"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, User } from "lucide-react"
import { listarUsuariosDev } from "@/actions/auth/listar-usuarios-dev"
import { generarLinkDev } from "@/actions/auth/generar-link-dev"
import { crearClienteNavegador } from "@/lib/supabase/client"

type UsuarioDev = {
  id: string
  email: string
  nombre: string
  rol: string
  clinic_id: string | null
}

function obtenerErrorUrl(): string | null {
  if (typeof window === "undefined") return null
  const params = new URLSearchParams(window.location.search)
  if (params.has("error")) return "El enlace expiró o no es válido. Solicita uno nuevo."
  return null
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(obtenerErrorUrl)
  const [usuarios, setUsuarios] = useState<UsuarioDev[] | null>(null)
  const router = useRouter()

  useEffect(() => {
    listarUsuariosDev().then(setUsuarios)
  }, [])

  async function entrarComo(usuario: UsuarioDev) {
    setEnviando(true)
    setError(null)

    const res = await generarLinkDev(usuario.email)

    if (res.error) {
      setError(res.error)
      setEnviando(false)
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
        setEnviando(false)
        return
      }

      router.push("/inicio")
    }
  }

  async function enviarMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    const usuario = usuarios?.find((u) => u.email === email)
    if (usuario) {
      entrarComo(usuario)
    } else {
      setError(`No hay usuario registrado con el email ${email}`)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Inicia sesión</CardTitle>
        <CardDescription>
          {usuarios && usuarios.length > 0
            ? "Selecciona un usuario o ingresa tu email"
            : "Ingresa tu email"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {usuarios && usuarios.length > 0 && (
          <div className="space-y-2">
            <Label>Usuarios registrados</Label>
            <div className="grid gap-2">
              {usuarios.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={enviando}
                  onClick={() => entrarComo(u)}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{u.nombre}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-xs capitalize text-muted-foreground">{u.rol}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={enviarMagicLink}>
          <div className="space-y-2">
            <Label htmlFor="email">O ingresa tu email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="mt-4 w-full" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          ¿Eres nuevo?
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push("/registro")}>
            <Building2 className="mr-1 size-3" />
            Clínica
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push("/registro")}>
            <User className="mr-1 size-3" />
            Dueño
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
