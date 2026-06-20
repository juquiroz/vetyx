import { HORA_INICIO, HORA_FIN, HORA_COMIDAS, SLOT_DURACION_MINUTOS, ZONA_HORARIA_DEFAULT } from "@/config/constants"
import type { CitaConRelaciones } from "@/types/models"
import type { FilaAgenda, EventoAgenda, ColumnaAgenda } from "./types"

export const DIAS_LABORALES_DEFAULT = [1, 2, 3, 4, 5, 6]
const NOMBRES_DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

function obtenerInicioSemana(fecha: Date): Date {
  const d = new Date(fecha)
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

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

export function mapearSemana(input: {
  fecha: string
  citas: CitaConRelaciones[]
  veterinarios: { id: string; nombre: string }[]
  timezone?: string
  diasLaborales?: number[]
}): {
  columnas: ColumnaAgenda[]
  filas: FilaAgenda[]
  eventos: EventoAgenda[]
} {
  const timezone = input.timezone ?? ZONA_HORARIA_DEFAULT
  const diasLaborales = input.diasLaborales ?? DIAS_LABORALES_DEFAULT

  const fechaRef = new Date(input.fecha + "T12:00:00")
  const inicioSemana = obtenerInicioSemana(fechaRef)

  const columnas: ColumnaAgenda[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicioSemana)
    d.setDate(d.getDate() + i)
    const diaSemana = d.getDay()
    if (!diasLaborales.includes(diaSemana)) continue

    const fechaStr = d.toISOString().split("T")[0]
    columnas.push({
      id: fechaStr,
      nombre: NOMBRES_DIAS[diaSemana],
      fecha: fechaStr,
      dia_semana: diaSemana,
    })
  }

  const filas = generarFilas(inicioSemana.toISOString().split("T")[0], timezone)

  const eventos: EventoAgenda[] = []

  for (const cita of input.citas) {
    const fechaCita = new Date(cita.fecha_hora)
    const citaFechaStr = fechaCita.toISOString().split("T")[0]

    const columna = columnas.findIndex((c) => c.fecha === citaFechaStr)
    if (columna === -1) continue

    const indiceFila = convertirCitaAFila(cita, filas, timezone)
    if (indiceFila < 0 || indiceFila >= filas.length) continue

    const span = Math.max(1, Math.round((cita.duracion_minutos ?? SLOT_DURACION_MINUTOS) / SLOT_DURACION_MINUTOS))
    const horaInicio = fechaCita.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: timezone })

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
