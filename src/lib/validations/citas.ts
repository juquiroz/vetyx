import { z } from "zod"

export const esquemaCrearCita = z.object({
  mascota_id: z.string().uuid("Mascota requerida"),
  veterinario_id: z.string().uuid("Veterinario requerido"),
  fecha_hora: z.string().min(1, "Fecha y hora requeridas"),
  motivo: z.string().min(5, "El motivo debe tener al menos 5 caracteres").max(200),
  notas_internas: z.string().optional().or(z.literal("")),
})

export const esquemaEditarCita = z.object({
  motivo: z.string().min(5).max(200).optional(),
  notas_internas: z.string().optional().or(z.literal("")),
})

export const esquemaCambiarEstado = z.object({
  estado: z.enum(["completada", "cancelada", "no_show"]),
  motivo_cancelacion: z.string().optional().or(z.literal("")),
  monto: z.number().min(0).optional().nullable(),
})

export type CrearCitaInput = z.infer<typeof esquemaCrearCita>
export type EditarCitaInput = z.infer<typeof esquemaEditarCita>
export type CambiarEstadoInput = z.infer<typeof esquemaCambiarEstado>
