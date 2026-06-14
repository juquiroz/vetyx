import { z } from "zod"

export const esquemaCrearEvento = z.object({
  mascota_id: z.string().uuid("Mascota requerida"),
  tipo: z.enum(["consulta", "cirugia"]),
  fecha: z.string().min(1, "La fecha es requerida"),
  diagnostico: z.string().min(10, "El diagnóstico debe tener al menos 10 caracteres"),
  tratamiento: z.string().optional().or(z.literal("")),
  notas: z.string().optional().or(z.literal("")),
})

export const esquemaEditarEvento = z.object({
  diagnostico: z.string().min(10).optional(),
  tratamiento: z.string().optional().or(z.literal("")),
  notas: z.string().optional().or(z.literal("")),
})

export type CrearEventoInput = z.infer<typeof esquemaCrearEvento>
export type EditarEventoInput = z.infer<typeof esquemaEditarEvento>
