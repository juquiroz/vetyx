"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useContexto } from "@/providers/contexto-provider"
import type { ContextoActivo } from "@/providers/contexto-provider"
import {
  LayoutDashboard,
  Calendar,
  Users,
  PawPrint,
  Settings,
  UserCog,
  UserCheck,
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
  { href: "/configuracion/clientes", label: "Clientes", icon: UserCheck },
]

function itemsParaRol(contexto: ContextoActivo): typeof items {
  if (contexto.tipo === "staff") return items
  return items.filter((i) => ["/inicio", "/mascotas"].includes(i.href))
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

export function Sidebar() {
  const pathname = usePathname()
  const {
    contextoActivo,
    setContextoActivo,
    clinicaNombre,
    usuarioRol,
    usuarioNombre,
    usuarioEmail,
    clinicasStaff,
    clinicasCliente,
  } = useContexto()

  const tieneStaff = clinicasStaff.length > 0
  const tieneCliente = clinicasCliente.length > 0

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        Vetyx
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {itemsParaRol(contextoActivo).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      {contextoActivo.tipo === "staff" && (
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
                  : "hover:bg-muted",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
      <div className="border-t p-3" title="Los registros se guardarán en este contexto">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {usuarioNombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{contextoActivo.tipo === "personal" ? "Personal" : clinicaNombre}</p>
            <p className="truncate text-xs text-muted-foreground">{usuarioEmail}</p>
            <p className="truncate text-xs text-muted-foreground">{etiquetaRol(usuarioRol)}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="px-3 py-1 text-xs font-medium text-muted-foreground">PERSONAL</p>
          <button
            onClick={() => setContextoActivo({ tipo: "personal" })}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors",
              contextoActivo.tipo === "personal"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <User className="size-3.5" />
            Personal
          </button>

          {tieneCliente && (
            <>
              <p className="px-3 py-1 text-xs font-medium text-muted-foreground">CLIENTE</p>
              {clinicasCliente.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setContextoActivo({ tipo: "cliente", clinicId: c.id, clinicNombre: c.nombre })}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors text-left",
                    contextoActivo.tipo === "cliente" && contextoActivo.clinicId === c.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Building2 className="size-3.5 shrink-0" />
                  <span className="truncate">Cliente · {c.nombre}</span>
                </button>
              ))}
            </>
          )}

          {tieneStaff && (
            <>
              <p className="px-3 py-1 text-xs font-medium text-muted-foreground">STAFF</p>
              {clinicasStaff.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setContextoActivo({ tipo: "staff", clinicId: c.id, clinicNombre: c.nombre })}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors text-left",
                    contextoActivo.tipo === "staff" && contextoActivo.clinicId === c.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Building2 className="size-3.5 shrink-0" />
                  <span className="truncate">Staff · {c.nombre}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
