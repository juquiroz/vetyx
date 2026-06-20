export type TipoEvento = "consulta" | "cirugia" | "hospitalizacion" | "control" | "procedimiento" | "otro" | "vacuna"

export interface EventoTimeline {
  id: string
  fecha: string
  tipo: TipoEvento
  titulo: string
  resumen: string
  metadata: Record<string, unknown>
  editable: boolean
  created_at: string
  created_by: string
}

export interface TimelineResponse {
  eventos: EventoTimeline[]
  total: number
  tieneMas: boolean
}

export const ETIQUETAS_TIPO: Record<string, string> = {
  consulta: "Consulta",
  cirugia: "Cirugía",
  hospitalizacion: "Hospitalización",
  control: "Control",
  procedimiento: "Procedimiento",
  otro: "Otro",
  vacuna: "Vacuna",
}
