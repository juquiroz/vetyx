"use client"

interface AgendaColumnProps {
  nombre: string
  fecha?: string
  esHoy?: boolean
}

export function AgendaColumn({ nombre, fecha, esHoy }: AgendaColumnProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background px-2 py-2 text-center">
      <div className="text-xs font-medium">{nombre}</div>
      {fecha && (
        <div className="text-[10px] text-muted-foreground">
          {new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
            day: "numeric",
          })}
        </div>
      )}
      {esHoy && (
        <div className="mx-auto mt-0.5 size-1.5 rounded-full bg-blue-500" />
      )}
    </div>
  )
}
