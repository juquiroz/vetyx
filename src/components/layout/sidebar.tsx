"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  PawPrint,
  Settings,
  UserCog,
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

export function Sidebar() {
  const pathname = usePathname()

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
    </aside>
  )
}
