import { describe, it, expect } from "vitest"
import { mapearDia } from "../mapear-dia"
import type { CitaConRelaciones } from "@/types/models"

function crearCita(overrides: Partial<CitaConRelaciones> & { id: string; veterinario_id: string; fecha_hora: string }): CitaConRelaciones {
  return {
    clinic_id: "clinic-1",
    mascota_id: "m-1",
    motivo: "Consulta general",
    estado: "scheduled",
    duracion_minutos: 30,
    notas_internas: null,
    observaciones: null,
    motivo_cancelacion: null,
    monto: null,
    completed_by: null,
    created_by: "user-1",
    created_at: "2026-06-19T12:00:00Z",
    updated_at: "2026-06-19T12:00:00Z",
    rango_horario: null,
    mascota: { id: "m-1", nombre: "Max", especie: { id: "e-1", nombre: "Perro" }, dueno: { id: "d-1", nombre: "Juan", telefono: "555" } } as unknown as CitaConRelaciones["mascota"],
    veterinario: { id: "v-1", nombre: "Dr. Pérez", email: "vet@test.com", rol: "vet" } as unknown as CitaConRelaciones["veterinario"],
    ...overrides,
  } as CitaConRelaciones
}

describe("mapearDia", () => {
  it("genera 16 filas para un día sin citas", () => {
    const resultado = mapearDia({
      fecha: "2026-06-19",
      citas: [],
      veterinarios: [{ id: "v-1", nombre: "Dr. Pérez" }],
    })

    expect(resultado.filas).toHaveLength(16)
    expect(resultado.eventos).toHaveLength(0)
    expect(resultado.columnas).toHaveLength(1)
    expect(resultado.filas[0].hora).toBe("09:00")
    expect(resultado.filas[15].hora).toBe("17:30")
  })

  it("genera 0 columnas si no hay veterinarios", () => {
    const resultado = mapearDia({
      fecha: "2026-06-19",
      citas: [],
      veterinarios: [],
    })

    expect(resultado.columnas).toHaveLength(0)
    expect(resultado.filas).toHaveLength(16)
  })

  it("coloca una cita de 09:00 en fila 0", () => {
    const resultado = mapearDia({
      fecha: "2026-06-19",
      citas: [
        crearCita({ id: "c-1", veterinario_id: "v-1", fecha_hora: "2026-06-19T15:00:00Z" }),
      ],
      veterinarios: [{ id: "v-1", nombre: "Dr. Pérez" }],
      timezone: "America/Mexico_City",
    })

    expect(resultado.eventos).toHaveLength(1)
    expect(resultado.eventos[0].fila).toBe(0)
    expect(resultado.eventos[0].columna).toBe(0)
    expect(resultado.eventos[0].mascota_nombre).toBe("Max")
  })

  it("columna -1 si el vet no está en la lista", () => {
    const resultado = mapearDia({
      fecha: "2026-06-19",
      citas: [
        crearCita({ id: "c-1", veterinario_id: "v-999", fecha_hora: "2026-06-19T15:00:00Z" }),
      ],
      veterinarios: [{ id: "v-1", nombre: "Dr. Pérez" }],
    })

    expect(resultado.eventos).toHaveLength(0)
  })

  it("asigna cita a columna correcta entre múltiples vets", () => {
    const resultado = mapearDia({
      fecha: "2026-06-19",
      citas: [
        crearCita({ id: "c-1", veterinario_id: "v-2", fecha_hora: "2026-06-19T15:00:00Z" }),
      ],
      veterinarios: [
        { id: "v-1", nombre: "Dr. Pérez" },
        { id: "v-2", nombre: "Dra. López" },
        { id: "v-3", nombre: "Dr. García" },
      ],
      timezone: "America/Mexico_City",
    })

    expect(resultado.eventos).toHaveLength(1)
    expect(resultado.eventos[0].columna).toBe(1)
    expect(resultado.eventos[0].mascota_nombre).toBe("Max")
  })

  it("calcula span de 2 para cita de 60 minutos", () => {
    const resultado = mapearDia({
      fecha: "2026-06-19",
      citas: [
        crearCita({ id: "c-1", veterinario_id: "v-1", fecha_hora: "2026-06-19T15:00:00Z", duracion_minutos: 60 }),
      ],
      veterinarios: [{ id: "v-1", nombre: "Dr. Pérez" }],
      timezone: "America/Mexico_City",
    })

    expect(resultado.eventos[0].span).toBe(2)
  })

  it("asigna 3 vets a 3 columnas", () => {
    const resultado = mapearDia({
      fecha: "2026-06-19",
      citas: [],
      veterinarios: [
        { id: "v-1", nombre: "Dr. Pérez" },
        { id: "v-2", nombre: "Dra. López" },
        { id: "v-3", nombre: "Dr. García" },
      ],
    })

    expect(resultado.columnas).toHaveLength(3)
    expect(resultado.columnas[0].nombre).toBe("Dr. Pérez")
    expect(resultado.columnas[1].nombre).toBe("Dra. López")
    expect(resultado.columnas[2].nombre).toBe("Dr. García")
  })

  it("evento incluye hora_inicio formateada", () => {
    const resultado = mapearDia({
      fecha: "2026-06-19",
      citas: [
        crearCita({ id: "c-1", veterinario_id: "v-1", fecha_hora: "2026-06-19T15:00:00Z" }),
      ],
      veterinarios: [{ id: "v-1", nombre: "Dr. Pérez" }],
      timezone: "America/Mexico_City",
    })

    expect(resultado.eventos[0].hora_inicio).toBe("09:00")
  })
})
