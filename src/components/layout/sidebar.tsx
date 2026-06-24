"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useContexto } from "@/providers/contexto-provider"
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  PawPrint,
  Settings,
  UserCog,
  User,
  Building2,
  ChevronDown,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const items = [
  { href: "/inicio", label: "Inicio", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/duenos", label: "Dueños", icon: Users },
  { href: "/mascotas", label: "Mascotas", icon: PawPrint },
]

const itemsConfig = [
  { href: "/configuracion/clinica", label: "Configuración", icon: Settings },
  { href: "/configuracion/usuarios", label: "Miembros", icon: UserCog },
  { href: "/configuracion/clientes", label: "Clientes", icon: UserCheck },
]

const ITEMS_PERMITIDOS_POR_ROL: Record<string, string[]> = {
  dueño: ["/inicio", "/duenos", "/mascotas"],
}

function etiquetaRol(rol: string): string {
  const mapa: Record<string, string> = {
    admin: "Administrador",
    vet: "Veterinario",
    recepcionista: "Recepcionista",
    dueño: "Dueño",
  }
  return mapa[rol] ?? rol
}

function itemsParaRol(rol: string): typeof items {
  const permitidos = ITEMS_PERMITIDOS_POR_ROL[rol]
  if (!permitidos) return items
  return items.filter((i) => permitidos.includes(i.href))
}

export function Sidebar() {
  const pathname = usePathname()
  const { contextoActivo, setContextoActivo, clinicaNombre, usuarioRol, usuarioNombre, clinicasStaff } = useContexto()

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        Vetyx
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {itemsParaRol(usuarioRol).map((item) => (
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
      {usuarioRol !== "dueño" && (
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
      )}
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
        {usuarioRol !== "dueño" && (
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
            {clinicasStaff.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs transition-colors",
                      contextoActivo.tipo === "clinic" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Building2 className="size-3" />
                    <span className="truncate">{contextoActivo.tipo === "clinic" ? clinicaNombre : "Clínica"}</span>
                    <ChevronDown className="size-3 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top">
                  {clinicasStaff.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() => setContextoActivo({ tipo: "clinic", clinicId: c.id, clinicNombre: c.nombre })}
                    >
                      {c.nombre}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
