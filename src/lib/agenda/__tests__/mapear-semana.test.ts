import { describe, it, expect } from "vitest"
import { mapearSemana } from "../mapear-semana"
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

describe("mapearSemana", () => {
  it("genera 6 columnas (lun-sáb) para semana sin citas", () => {
    const resultado = mapearSemana({
      fecha: "2026-06-19",
      citas: [],
      veterinarios: [{ id: "v-1", nombre: "Dr. Pérez" }],
    })

    expect(resultado.columnas).toHaveLength(6)
    expect(resultado.eventos).toHaveLength(0)
    expect(resultado.filas).toHaveLength(16)
  })

  it("las columnas son lunes a sábado cuando la fecha es viernes", () => {
    const resultado = mapearSemana({
      fecha: "2026-06-19",
      citas: [],
      veterinarios: [],
    })

    expect(resultado.columnas[0].nombre).toBe("lunes")
    expect(resultado.columnas[1].nombre).toBe("martes")
    expect(resultado.columnas[2].nombre).toBe("miércoles")
    expect(resultado.columnas[3].nombre).toBe("jueves")
    expect(resultado.columnas[4].nombre).toBe("viernes")
    expect(resultado.columnas[5].nombre).toBe("sábado")
  })

  it("coloca cita en columna correcta por día", () => {
    const resultado = mapearSemana({
      fecha: "2026-06-19",
      citas: [
        crearCita({ id: "c-1", veterinario_id: "v-1", fecha_hora: "2026-06-19T15:00:00Z" }),
      ],
      veterinarios: [{ id: "v-1", nombre: "Dr. Pérez" }],
      timezone: "America/Mexico_City",
    })

    const columnaViernes = resultado.columnas.find((c) => c.nombre === "viernes")
    expect(columnaViernes).toBeDefined()
    expect(resultado.eventos).toHaveLength(1)
    expect(resultado.eventos[0].columna).toBe(resultado.columnas.indexOf(columnaViernes!))
  })

  it("distribuye citas en distintos días", () => {
    const resultado = mapearSemana({
      fecha: "2026-06-19",
      citas: [
        crearCita({ id: "c-1", veterinario_id: "v-1", fecha_hora: "2026-06-15T15:00:00Z" }),
        crearCita({ id: "c-2", veterinario_id: "v-1", fecha_hora: "2026-06-19T15:00:00Z" }),
      ],
      veterinarios: [{ id: "v-1", nombre: "Dr. Pérez" }],
      timezone: "America/Mexico_City",
    })

    expect(resultado.eventos).toHaveLength(2)
    const columnas = resultado.eventos.map((e) => e.columna)
    expect(new Set(columnas).size).toBe(2)
  })

  it("excluye domingo si no está en diasLaborales", () => {
    const resultado = mapearSemana({
      fecha: "2026-06-19",
      citas: [],
      veterinarios: [],
      diasLaborales: [1, 2, 3, 4, 5],
    })

    expect(resultado.columnas).toHaveLength(5)
    expect(resultado.columnas.every((c) => c.dia_semana !== 0 && c.dia_semana !== 6)).toBe(true)
  })
})
