"use client"

import { cn } from "@/lib/utils"

interface AgendaSlotProps {
  onClick?: () => void
  children?: React.ReactNode
  className?: string
}

export function AgendaSlot({ onClick, children, className }: AgendaSlotProps) {
  if (children) {
    return (
      <div
        className={cn(
          "relative min-h-[60px] border-b border-r border-border/50 p-0.5",
          className,
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[60px] border-b border-r border-border/50 transition-colors hover:cursor-pointer hover:border-blue-400 hover:bg-blue-50/50",
        className,
      )}
      aria-label="Slot disponible"
    />
  )
}
