import { z } from "zod"

export const esquemaCrearMascota = z.object({
  owner_id: z.string().uuid("Dueño inválido"),
  especie_id: z.string().uuid("Especie requerida"),
  nombre: z.string().min(1, "El nombre es requerido").max(80),
  raza: z.string().max(80).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  color: z.string().max(80).optional().or(z.literal("")),
  peso: z.number().positive("El peso debe ser positivo").max(200).optional().nullable(),
  sexo: z.enum(["macho", "hembra", "no_especificado"]).optional(),
  esterilizado: z.boolean().optional(),
})

export const esquemaEditarMascota = esquemaCrearMascota.partial()

export type CrearMascotaInput = z.infer<typeof esquemaCrearMascota>
export type EditarMascotaInput = z.infer<typeof esquemaEditarMascota>
