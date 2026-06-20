"use client"

import { cn } from "@/lib/utils"

const COLORES_ESTADO: Record<string, string> = {
  scheduled: "border-l-blue-400",
  confirmed: "border-l-blue-600",
  in_progress: "border-l-amber-500",
  completed: "border-l-green-500",
  cancelled: "border-l-red-500",
  no_show: "border-l-gray-400",
}

const FONDOS_ESTADO: Record<string, string> = {
  scheduled: "bg-blue-50",
  confirmed: "bg-blue-100",
  in_progress: "bg-amber-50",
  completed: "bg-green-50",
  cancelled: "bg-red-50",
  no_show: "bg-gray-50",
}

interface AgendaEventCardProps {
  mascotaNombre: string
  horaInicio: string
  estado: string
  motivo: string
  span: number
  onClick?: () => void
}

export function AgendaEventCard({
  mascotaNombre,
  horaInicio,
  estado,
  motivo,
  span,
  onClick,
}: AgendaEventCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex size-full flex-col justify-center overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-xs transition-colors hover:brightness-95",
        COLORES_ESTADO[estado] ?? "border-l-gray-300",
        FONDOS_ESTADO[estado] ?? "bg-gray-50",
        span > 1 && "py-1",
      )}
    >
      <span className="truncate font-medium">{mascotaNombre}</span>
      <span className="truncate text-[10px] text-muted-foreground">
        {horaInicio}
        {motivo ? ` · ${motivo}` : ""}
      </span>
    </button>
  )
}
