import { z } from "zod"

export const esquemaCrearDueno = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(120),
  telefono: z.string().min(1, "El teléfono es requerido").max(20),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().optional().or(z.literal("")),
})

export const esquemaEditarDueno = esquemaCrearDueno.partial()

export type CrearDuenoInput = z.infer<typeof esquemaCrearDueno>
export type EditarDuenoInput = z.infer<typeof esquemaEditarDueno>
