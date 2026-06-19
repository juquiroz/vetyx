"use server"

import { z } from "zod"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { crearClienteAccion } from "@/lib/supabase/action"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import {
  SLOT_DURACION_MINUTOS, ESTADOS_BLOQUEAN,
  HORA_INICIO, HORA_FIN, HORA_COMIDAS,
  CANTIDAD_SUGERENCIAS, ZONA_HORARIA_DEFAULT,
} from "@/config/constants"
import { validarHorarioLaboral } from "@/lib/validations/citas"
import { haySolapamiento, sumarMinutos } from "./solapamiento"

export interface ConflictoCita {
  id: string
  mascota_id: string
  fecha_hora: string
  duracion_minutos: number
}

export interface SugerenciaSlot {
  fecha_hora: string
}

export interface DisponibilidadResultado {
  disponible: boolean
  conflictos: ConflictoCita[]
  sugerencias: SugerenciaSlot[]
}

const esquema = z.object({
  veterinario_id: z.string().uuid("Veterinario requerido"),
  fecha_hora: z.string().min(1, "Fecha y hora requeridas"),
  duracion_minutos: z.coerce.number().int().positive().default(SLOT_DURACION_MINUTOS),
  excluir_cita_id: z.string().uuid().optional(),
})

export type VerificarDisponibilidadParams = {
  supabase: SupabaseClient<Database>
  clinic_id: string
  veterinario_id: string
  fecha_hora: string
  duracion_minutos: number
  excluir_cita_id?: string
}

export async function verificarDisponibilidadInterna(
  params: VerificarDisponibilidadParams
): Promise<DisponibilidadResultado> {
  const { supabase, clinic_id, veterinario_id, fecha_hora, duracion_minutos, excluir_cita_id } = params
  const fechaCita = new Date(fecha_hora)

  if (!validarHorarioLaboral(fecha_hora, duracion_minutos, ZONA_HORARIA_DEFAULT)) {
    return { disponible: false, conflictos: [], sugerencias: [] }
  }

  const inicioDia = new Date(Date.UTC(fechaCita.getUTCFullYear(), fechaCita.getUTCMonth(), fechaCita.getUTCDate(), 0, 0, 0))
  const finDia = new Date(Date.UTC(fechaCita.getUTCFullYear(), fechaCita.getUTCMonth(), fechaCita.getUTCDate(), 23, 59, 59, 999))

  const { data: citasExistentes } = await supabase
    .from("citas")
    .select("id, mascota_id, fecha_hora, duracion_minutos")
    .eq("clinic_id", clinic_id)
    .eq("veterinario_id", veterinario_id)
    .in("estado", [...ESTADOS_BLOQUEAN])
    .gte("fecha_hora", inicioDia.toISOString())
    .lte("fecha_hora", finDia.toISOString())

  if (!citasExistentes) return { disponible: true, conflictos: [], sugerencias: [] }

  const finCitaNueva = sumarMinutos(fechaCita, duracion_minutos)

  const conflictos: ConflictoCita[] = citasExistentes
    .filter((c) => {
      if (excluir_cita_id && c.id === excluir_cita_id) return false
      const finCitaExistente = sumarMinutos(new Date(c.fecha_hora), c.duracion_minutos)
      return haySolapamiento(
        { inicio: fechaCita, fin: finCitaNueva },
        { inicio: new Date(c.fecha_hora), fin: finCitaExistente }
      )
    })
    .map((c) => ({
      id: c.id,
      mascota_id: c.mascota_id,
      fecha_hora: c.fecha_hora,
      duracion_minutos: c.duracion_minutos,
    }))

  if (conflictos.length > 0) {
    const sugerencias = generarSugerencias(citasExistentes, fechaCita, duracion_minutos, excluir_cita_id)
    return { disponible: false, conflictos, sugerencias }
  }

  return { disponible: true, conflictos: [], sugerencias: [] }
}

export async function verificarDisponibilidad(
  input: FormData
): Promise<DisponibilidadResultado | { error: string }> {
  const session = await obtenerSesion()
  if (!session) return { error: "No autorizado" }

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) return { error: "Usuario no encontrado" }

  const parsed = esquema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: "Datos inválidos" }

  const { veterinario_id, fecha_hora, duracion_minutos, excluir_cita_id } = parsed.data

  const supabase = await crearClienteAccion()

  return verificarDisponibilidadInterna({
    supabase,
    clinic_id: usuario.clinic_id,
    veterinario_id,
    fecha_hora,
    duracion_minutos,
    excluir_cita_id,
  })
}

function generarSugerencias(
  citasExistentes: { id: string; fecha_hora: string; duracion_minutos: number }[],
  fechaCita: Date,
  duracion_minutos: number,
  excluir_cita_id?: string,
): SugerenciaSlot[] {
  const ocupados: { inicio: Date; fin: Date }[] = citasExistentes
    .filter((c) => !(excluir_cita_id && c.id === excluir_cita_id))
    .map((c) => ({
      inicio: new Date(c.fecha_hora),
      fin: sumarMinutos(new Date(c.fecha_hora), c.duracion_minutos),
    }))
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())

  const sugerencias: SugerenciaSlot[] = []

  const inicioJornada = new Date(Date.UTC(
    fechaCita.getUTCFullYear(),
    fechaCita.getUTCMonth(),
    fechaCita.getUTCDate(),
    HORA_INICIO, 0, 0,
  ))
  const finJornada = new Date(Date.UTC(
    fechaCita.getUTCFullYear(),
    fechaCita.getUTCMonth(),
    fechaCita.getUTCDate(),
    HORA_FIN, 0, 0,
  ))

  const inicioComida = new Date(Date.UTC(
    fechaCita.getUTCFullYear(),
    fechaCita.getUTCMonth(),
    fechaCita.getUTCDate(),
    HORA_COMIDAS[0], 0, 0,
  ))
  const finComida = new Date(Date.UTC(
    fechaCita.getUTCFullYear(),
    fechaCita.getUTCMonth(),
    fechaCita.getUTCDate(),
    HORA_COMIDAS[1], 0, 0,
  ))

  let candidato = new Date(inicioJornada)

  while (candidato.getTime() + duracion_minutos * 60 * 1000 <= finJornada.getTime() && sugerencias.length < CANTIDAD_SUGERENCIAS) {
    if (candidato >= inicioComida && candidato < finComida) {
      candidato = new Date(finComida)
      continue
    }

    const finCandidato = sumarMinutos(candidato, duracion_minutos)
    const choca = ocupados.some((o) => haySolapamiento({ inicio: candidato, fin: finCandidato }, o))

    if (!choca) {
      sugerencias.push({ fecha_hora: candidato.toISOString() })
    }

    candidato = sumarMinutos(candidato, SLOT_DURACION_MINUTOS)
  }

  return sugerencias
}
