import { z } from "zod"
import {
  HORA_INICIO, HORA_FIN, HORA_COMIDAS, SLOT_DURACION_MINUTOS,
  ESTADOS_CITA, ESTADOS_BLOQUEAN, ZONA_HORARIA_DEFAULT,
} from "@/config/constants"

function convertirAZonaHoraria(fecha: Date, zonaHoraria: string): { hora: number; minutos: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: zonaHoraria,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  })
  const partes = formatter.formatToParts(fecha)
  const hora = parseInt(partes.find((p) => p.type === "hour")?.value ?? "0", 10)
  const minutos = parseInt(partes.find((p) => p.type === "minute")?.value ?? "0", 10)
  return { hora, minutos }
}

export function validarHorarioLaboral(
  fecha_hora: string,
  duracion_minutos: number,
  zonaHoraria: string = ZONA_HORARIA_DEFAULT,
): boolean {
  const fecha = new Date(fecha_hora)
  const { hora, minutos } = convertirAZonaHoraria(fecha, zonaHoraria)

  const inicioMinutos = hora * 60 + minutos
  const finMinutos = inicioMinutos + duracion_minutos
  const inicioJornada = HORA_INICIO * 60
  const finJornada = HORA_FIN * 60
  const inicioComida = HORA_COMIDAS[0] * 60
  const finComida = HORA_COMIDAS[1] * 60

  if (inicioMinutos < inicioJornada || finMinutos > finJornada) return false
  if (inicioMinutos < finComida && finMinutos > inicioComida) return false

  return true
}

export const esquemaVerificarDisponibilidad = z.object({
  veterinario_id: z.string().uuid("Veterinario requerido"),
  fecha_hora: z.string().min(1, "Fecha y hora requeridas"),
  duracion_minutos: z.coerce.number().int().positive("La duración debe ser positiva").default(SLOT_DURACION_MINUTOS),
  excluir_cita_id: z.string().uuid().optional(),
})

export const esquemaCrearCita = z.object({
  mascota_id: z.string().uuid("Mascota requerida"),
  veterinario_id: z.string().uuid("Veterinario requerido"),
  fecha_hora: z.string().min(1, "Fecha y hora requeridas"),
  duracion_minutos: z.coerce.number().int().positive("La duración debe ser positiva").default(SLOT_DURACION_MINUTOS),
  motivo: z.string().min(5, "El motivo debe tener al menos 5 caracteres").max(200),
  notas_internas: z.string().optional().or(z.literal("")),
  observaciones: z.string().optional().or(z.literal("")),
})

export const esquemaEditarCita = z.object({
  id: z.string().uuid("Cita requerida"),
  mascota_id: z.string().uuid("Mascota requerida").optional(),
  veterinario_id: z.string().uuid("Veterinario requerido").optional(),
  fecha_hora: z.string().min(1, "Fecha y hora requeridas").optional(),
  duracion_minutos: z.coerce.number().int().positive("La duración debe ser positiva").optional(),
  motivo: z.string().min(5, "El motivo debe tener al menos 5 caracteres").max(200).optional(),
  notas_internas: z.string().optional().or(z.literal("")),
  observaciones: z.string().optional().or(z.literal("")),
})

const estadosDestino = ESTADOS_CITA.filter((e) => !ESTADOS_BLOQUEAN.includes(e as never) && e !== "scheduled")
export const esquemaCambiarEstado = z.object({
  id: z.string().uuid("Cita requerida"),
  estado: z.enum(estadosDestino as [string, ...string[]]),
  motivo_cancelacion: z.string().optional().or(z.literal("")),
  monto: z.coerce.number().min(0).optional().nullable(),
})

export type VerificarDisponibilidadInput = z.infer<typeof esquemaVerificarDisponibilidad>
export type CrearCitaInput = z.infer<typeof esquemaCrearCita>
export type EditarCitaInput = z.infer<typeof esquemaEditarCita>
export type CambiarEstadoInput = z.infer<typeof esquemaCambiarEstado>
