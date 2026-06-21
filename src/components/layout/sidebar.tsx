"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useContexto } from "@/providers/contexto-provider"
import {
  LayoutDashboard,
  Calendar,
  Users,
  PawPrint,
  Settings,
  UserCog,
  User,
  Building2,
} from "lucide-react"

const items = [
  { href: "/inicio", label: "Inicio", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/duenos", label: "Dueños", icon: Users },
  { href: "/mascotas", label: "Mascotas", icon: PawPrint },
]

const itemsConfig = [
  { href: "/configuracion/clinica", label: "Configuración", icon: Settings },
  { href: "/configuracion/usuarios", label: "Miembros", icon: UserCog },
]

function etiquetaRol(rol: string): string {
  const mapa: Record<string, string> = {
    admin: "Administrador",
    vet: "Veterinario",
    recepcionista: "Recepcionista",
  }
  return mapa[rol] ?? rol
}

export function Sidebar() {
  const pathname = usePathname()
  const { contextoActivo, setContextoActivo, clinicaNombre, usuarioRol, usuarioNombre } = useContexto()

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        Vetyx
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-2">
        <p className="px-3 py-1 text-xs text-muted-foreground">Configuración</p>
        {itemsConfig.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </div>
      <div className="border-t p-3" title="Los registros se guardarán en este contexto">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {usuarioNombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{contextoActivo.tipo === "personal" ? "Personal" : clinicaNombre}</p>
            <p className="truncate text-xs text-muted-foreground">{etiquetaRol(usuarioRol)}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-1 rounded-md bg-muted p-1">
          <button
            onClick={() => setContextoActivo({ tipo: "personal" })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
              contextoActivo.tipo === "personal" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <User className="size-3" />
            Personal
          </button>
          <button
            onClick={() => setContextoActivo({ tipo: "clinic" })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
              contextoActivo.tipo === "clinic" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Building2 className="size-3" />
            Clínica
          </button>
        </div>
      </div>
    </aside>
  )
}
