"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Building2, ChevronDown } from "lucide-react"
import { crearClienteNavegador } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { SearchGlobal } from "@/components/layout/search-global"
import { useContexto } from "@/providers/contexto-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Topbar() {
  const router = useRouter()
  const { contextoActivo, setContextoActivo, clinicaNombre, usuarioRol, usuarioNombre } = useContexto()

  async function cerrarSesion() {
    const supabase = crearClienteNavegador()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b px-4 md:px-6">
      <div className="flex items-center gap-2 max-md:hidden" title="Los registros se guardarán en este contexto">
        {contextoActivo.tipo === "personal" ? (
          <User className="size-4 text-muted-foreground" />
        ) : (
          <Building2 className="size-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">
          {contextoActivo.tipo === "personal" ? "Personal" : clinicaNombre}
        </span>
        <Badge variant="outline" className="text-xs">
          Contexto: {contextoActivo.tipo === "personal" ? "Personal" : "Clínica"}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-5">
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setContextoActivo({ tipo: "personal" })}>
              <User className="mr-2 size-4" />
              Personal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setContextoActivo({ tipo: "clinic" })}>
              <Building2 className="mr-2 size-4" />
              {clinicaNombre}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 md:hidden" title="Los registros se guardarán en este contexto">
        {contextoActivo.tipo === "personal" ? (
          <User className="size-4 text-muted-foreground" />
        ) : (
          <Building2 className="size-4 text-muted-foreground" />
        )}
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium">
            {contextoActivo.tipo === "personal" ? "Personal" : clinicaNombre}
          </span>
          <span className="text-xs text-muted-foreground capitalize">{usuarioRol}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {contextoActivo.tipo === "personal" ? "Personal" : "Clínica"}
        </Badge>
      </div>
      <div className="flex-1" />
      <SearchGlobal />
      <ThemeToggle />
      <div className="flex items-center gap-2 max-md:hidden">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {usuarioNombre.charAt(0).toUpperCase()}
        </div>
        <div className="text-right">
          <p className="text-sm leading-tight">{usuarioNombre}</p>
          <p className="text-xs text-muted-foreground capitalize">{usuarioRol}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={cerrarSesion} aria-label="Cerrar sesión">
        <LogOut className="size-4" />
      </Button>
    </header>
  )
}
