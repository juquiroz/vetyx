export const SLOT_DURACION_MINUTOS = 30
export const HORA_INICIO = 9
export const HORA_FIN = 18
export const HORA_COMIDAS = [13, 14]

export const ROLES = ["admin", "vet", "recepcionista"] as const
export type Rol = (typeof ROLES)[number]

export const ESTADOS_CITA = ["confirmada", "completada", "cancelada", "no_show"] as const
export type EstadoCita = (typeof ESTADOS_CITA)[number]

export const TIPOS_EVENTO_HISTORIAL = ["consulta", "cirugia"] as const
export type TipoEventoHistorial = (typeof TIPOS_EVENTO_HISTORIAL)[number]

export const SEXOS_MASCOTA = ["macho", "hembra", "no_especificado"] as const
export type SexoMascota = (typeof SEXOS_MASCOTA)[number]

export const VENTANA_EDICION_HISTORIAL_HORAS = 24
