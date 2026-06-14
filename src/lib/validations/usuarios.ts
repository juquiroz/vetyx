import { z } from "zod"

export const esquemaInvitarUsuario = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  rol: z.enum(["admin", "vet", "recepcionista"]),
})

export const esquemaCambiarRol = z.object({
  rol: z.enum(["admin", "vet", "recepcionista"]),
})

export type InvitarUsuarioInput = z.infer<typeof esquemaInvitarUsuario>
export type CambiarRolInput = z.infer<typeof esquemaCambiarRol>
