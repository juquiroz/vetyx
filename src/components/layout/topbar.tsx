"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Search } from "lucide-react"
import { crearClienteNavegador } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Topbar() {
  const router = useRouter()

  async function cerrarSesion() {
    const supabase = crearClienteNavegador()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b px-4 md:px-6">
      <div className="flex-1" />
      <Button variant="ghost" size="icon" aria-label="Buscar">
        <Search className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={cerrarSesion} aria-label="Cerrar sesión">
        <LogOut className="size-4" />
      </Button>
    </header>
  )
}
