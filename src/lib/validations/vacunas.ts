import { z } from "zod"

export const esquemaRegistrarVacuna = z.object({
  mascota_id: z.string().uuid("Mascota requerida"),
  catalogo_vacuna_id: z.string().uuid("Tipo de vacuna requerido"),
  nombre_personalizado: z.string().max(100).optional().or(z.literal("")),
  fecha_aplicacion: z.string().min(1, "La fecha de aplicación es requerida"),
  fecha_proxima_dosis: z.string().optional().or(z.literal("")),
  lote: z.string().max(50).optional().or(z.literal("")),
  observaciones: z.string().optional().or(z.literal("")),
  veterinario_id: z.string().uuid("Veterinario requerido"),
})

export const esquemaEditarVacuna = z.object({
  id: z.string().uuid("ID requerido"),
  lote: z.string().max(50).optional().or(z.literal("")),
  fecha_proxima_dosis: z.string().optional().or(z.literal("")),
  observaciones: z.string().optional().or(z.literal("")),
})

export type RegistrarVacunaInput = z.infer<typeof esquemaRegistrarVacuna>
export type EditarVacunaInput = z.infer<typeof esquemaEditarVacuna>
