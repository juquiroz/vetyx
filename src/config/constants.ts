export const SLOT_DURACION_MINUTOS = 30
export const HORA_INICIO = 9
export const HORA_FIN = 18
export const HORA_COMIDAS = [13, 14]
export const ZONA_HORARIA_DEFAULT = "America/Mexico_City"
export const CANTIDAD_SUGERENCIAS = 3

export const ROLES = ["admin", "vet", "recepcionista", "dueño"] as const
export type Rol = (typeof ROLES)[number]

export const ESTADOS_CITA = ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"] as const
export type EstadoCita = (typeof ESTADOS_CITA)[number]

export const ESTADOS_BLOQUEAN = ["confirmed", "in_progress"] as const
export type EstadoBloquea = (typeof ESTADOS_BLOQUEAN)[number]

export const TIPOS_EVENTO_HISTORIAL = ["consulta", "cirugia"] as const
export type TipoEventoHistorial = (typeof TIPOS_EVENTO_HISTORIAL)[number]

export const SEXOS_MASCOTA = ["macho", "hembra", "no_especificado"] as const
export type SexoMascota = (typeof SEXOS_MASCOTA)[number]

export const VENTANA_EDICION_HISTORIAL_HORAS = 24
