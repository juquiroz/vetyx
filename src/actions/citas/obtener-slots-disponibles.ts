"use server"

import { z } from "zod"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"
import {
  HORA_INICIO, HORA_FIN, HORA_COMIDAS, SLOT_DURACION_MINUTOS,
  ESTADOS_BLOQUEAN,
} from "@/config/constants"
import { haySolapamiento, sumarMinutos } from "./solapamiento"

export interface SlotInfo {
  hora: string
  fecha_hora: string
  disponible: boolean
  conflicto_id?: string
}

export interface SlotsPorVeterinario {
  slots: SlotInfo[]
}

export type ObtenerSlotsResultado = SlotsPorVeterinario | { error: string }

const esquema = z.object({
  veterinario_id: z.string().uuid("Veterinario requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  duracion_minutos: z.coerce.number().int().positive().default(SLOT_DURACION_MINUTOS),
})

export async function obtenerSlotsDisponibles(
  input: FormData
): Promise<ObtenerSlotsResultado> {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos" }

  const { veterinario_id, fecha, duracion_minutos } = parsed.data
  const supabase = await crearClienteAccion()

  const [anio, mes, dia] = fecha.split("-").map(Number)
  const inicioDia = new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0))
  const finDia = new Date(Date.UTC(anio, mes - 1, dia, 23, 59, 59, 999))

  const { data: citasExistentes } = await supabase
    .from("citas")
    .select("id, fecha_hora, duracion_minutos")
    .eq("clinic_id", usuario.clinic_id)
    .eq("veterinario_id", veterinario_id)
    .in("estado", [...ESTADOS_BLOQUEAN])
    .gte("fecha_hora", inicioDia.toISOString())
    .lte("fecha_hora", finDia.toISOString())

  const slots: SlotInfo[] = []

  for (let hora = HORA_INICIO; hora < HORA_FIN; hora++) {
    if (hora >= HORA_COMIDAS[0] && hora < HORA_COMIDAS[1]) continue

    for (let minuto = 0; minuto < 60; minuto += SLOT_DURACION_MINUTOS) {
      const horaSlot = new Date(Date.UTC(anio, mes - 1, dia, hora, minuto, 0))
      const horaStr = `${hora.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")}`
      const finSlot = sumarMinutos(horaSlot, duracion_minutos)

      let disponible = true
      let conflicto_id: string | undefined

      for (const c of citasExistentes ?? []) {
        const finCita = sumarMinutos(new Date(c.fecha_hora), c.duracion_minutos)
        if (haySolapamiento(
          { inicio: horaSlot, fin: finSlot },
          { inicio: new Date(c.fecha_hora), fin: finCita }
        )) {
          disponible = false
          conflicto_id = c.id
          break
        }
      }

      slots.push({ hora: horaStr, fecha_hora: horaSlot.toISOString(), disponible, conflicto_id })
    }
  }

  return { slots }
}
