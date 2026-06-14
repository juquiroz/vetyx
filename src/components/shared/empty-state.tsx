import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  titulo: string
  descripcion: string
  accion?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({ icon, titulo, descripcion, accion, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <h3 className="font-semibold">{titulo}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>
      {accion && (
        accion.href ? (
          <Button asChild>
            <Link href={accion.href}>{accion.label}</Link>
          </Button>
        ) : (
          <Button onClick={accion.onClick}>{accion.label}</Button>
        )
      )}
    </div>
  )
}
