import { HORA_INICIO, HORA_FIN, HORA_COMIDAS, SLOT_DURACION_MINUTOS, ZONA_HORARIA_DEFAULT } from "@/config/constants"
import type { CitaConRelaciones } from "@/types/models"
import type { FilaAgenda, EventoAgenda, ColumnaAgenda } from "./types"

function obtenerHoraLocal(fecha: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  })
  const partes = formatter.formatToParts(fecha)
  return parseInt(partes.find((p) => p.type === "hour")?.value ?? "0", 10)
}

function obtenerMinutosLocal(fecha: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  })
  const partes = formatter.formatToParts(fecha)
  return parseInt(partes.find((p) => p.type === "minute")?.value ?? "0", 10)
}

function generarFilas(fecha: string, timezone: string): FilaAgenda[] {
  const filas: FilaAgenda[] = []
  let indice = 0

  for (let hora = HORA_INICIO; hora < HORA_FIN; hora++) {
    if (hora >= HORA_COMIDAS[0] && hora < HORA_COMIDAS[1]) continue

    for (let minuto = 0; minuto < 60; minuto += SLOT_DURACION_MINUTOS) {
      const [anio, mes, dia] = fecha.split("-").map(Number)
      const utc = new Date(Date.UTC(anio, mes - 1, dia, hora, minuto, 0))
      filas.push({
        hora: `${hora.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")}`,
        indice,
        fecha_hora_utc: utc.toISOString(),
      })
      indice++
    }
  }

  return filas
}

function convertirCitaAFila(cita: CitaConRelaciones, filas: FilaAgenda[], timezone: string): number {
  const fechaCita = new Date(cita.fecha_hora)
  const horaLocal = obtenerHoraLocal(fechaCita, timezone)
  const minutosLocal = obtenerMinutosLocal(fechaCita, timezone)

  const totalMinutos = horaLocal * 60 + minutosLocal
  const inicioJornada = HORA_INICIO * 60
  const minutosDesdeInicio = totalMinutos - inicioJornada
  const indice = minutosDesdeInicio / SLOT_DURACION_MINUTOS

  const comidaInicio = HORA_COMIDAS[0] * 60 - inicioJornada
  const comidaDuracion = (HORA_COMIDAS[1] - HORA_COMIDAS[0]) * 60

  if (minutosDesdeInicio >= comidaInicio) {
    return indice - comidaDuracion / SLOT_DURACION_MINUTOS
  }

  return indice
}

export function mapearDia(input: {
  fecha: string
  citas: CitaConRelaciones[]
  veterinarios: { id: string; nombre: string }[]
  timezone?: string
}): {
  columnas: ColumnaAgenda[]
  filas: FilaAgenda[]
  eventos: EventoAgenda[]
} {
  const timezone = input.timezone ?? ZONA_HORARIA_DEFAULT

  const columnas = input.veterinarios.map((v) => ({
    id: v.id,
    nombre: v.nombre,
  }))

  const filas = generarFilas(input.fecha, timezone)

  const eventos: EventoAgenda[] = []

  for (const cita of input.citas) {
    const indiceFila = convertirCitaAFila(cita, filas, timezone)
    if (indiceFila < 0 || indiceFila >= filas.length) continue

    const columna = columnas.findIndex((c) => c.id === cita.veterinario_id)
    if (columna === -1) continue

    const span = Math.max(1, Math.round((cita.duracion_minutos ?? SLOT_DURACION_MINUTOS) / SLOT_DURACION_MINUTOS))
    const fechaCita = new Date(cita.fecha_hora)
    const horaInicio = fechaCita.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timezone })

    eventos.push({
      id: cita.id,
      columna,
      fila: indiceFila,
      span,
      cita_id: cita.id,
      mascota_nombre: cita.mascota?.nombre ?? "—",
      veterinario_nombre: cita.veterinario?.nombre ?? "—",
      hora_inicio: horaInicio,
      estado: cita.estado,
      motivo: cita.motivo,
    })
  }

  return { columnas, filas, eventos }
}
