"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { crearClienteNavegador } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { SearchGlobal } from "@/components/layout/search-global"

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
      <SearchGlobal />
      <ThemeToggle />
      <Button variant="ghost" size="icon" onClick={cerrarSesion} aria-label="Cerrar sesión">
        <LogOut className="size-4" />
      </Button>
    </header>
  )
}
