"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

interface AgendaToolbarProps {
  vista: "dia" | "semana"
  onChangeVista: (v: "dia" | "semana") => void
  fecha: string
  titulo: string
  onNavegar: (delta: number) => void
  veterinarioId: string
  onChangeVeterinario: (id: string) => void
  veterinarios: { id: string; nombre: string }[]
  onCreateCita: () => void
}

export function AgendaToolbar({
  vista,
  onChangeVista,
  fecha,
  titulo,
  onNavegar,
  veterinarioId,
  onChangeVeterinario,
  veterinarios,
  onCreateCita,
}: AgendaToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-lg border p-0.5">
        <Button
          variant={vista === "dia" ? "default" : "ghost"}
          size="sm"
          onClick={() => onChangeVista("dia")}
        >
          Día
        </Button>
        <Button
          variant={vista === "semana" ? "default" : "ghost"}
          size="sm"
          onClick={() => onChangeVista("semana")}
        >
          Semana
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={() => onNavegar(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[180px] text-center text-sm font-medium">
          {titulo}
        </span>
        <Button variant="outline" size="icon" onClick={() => onNavegar(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Select value={veterinarioId} onValueChange={onChangeVeterinario}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos los veterinarios" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos los veterinarios</SelectItem>
          {veterinarios.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={onCreateCita} className="ml-auto">
        <Plus className="mr-1 size-4" />
        Nueva cita
      </Button>
    </div>
  )
}
