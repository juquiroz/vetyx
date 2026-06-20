export interface FilaAgenda {
  hora: string
  indice: number
  fecha_hora_utc: string
}

export interface EventoAgenda {
  id: string
  columna: number
  fila: number
  span: number
  cita_id: string
  mascota_nombre: string
  veterinario_nombre: string
  hora_inicio: string
  estado: string
  motivo: string
}

export interface ColumnaAgenda {
  id: string
  nombre: string
  fecha?: string
  dia_semana?: number
}
