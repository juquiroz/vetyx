import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockSesion, mockUsuario, mockCliente } = vi.hoisted(() => ({
  mockSesion: vi.fn(),
  mockUsuario: vi.fn(),
  mockCliente: vi.fn(),
}))

vi.mock("@/lib/auth/get-session", () => ({ obtenerSesion: mockSesion }))
vi.mock("@/lib/auth/get-current-user", () => ({ obtenerUsuarioActual: mockUsuario }))
vi.mock("@/lib/supabase/action", () => ({ crearClienteAccion: mockCliente }))

import { obtenerCitasRango } from "../obtener-citas-rango"

interface CitaRowMock {
  id: string
  mascota_id: string
  veterinario_id: string
  fecha_hora: string
  duracion_minutos: number
  motivo: string
  estado: string
  notas_internas: string | null
  observaciones: string | null
  created_by: string
  mascota: { id: string; nombre: string; especie: { id: string; nombre: string }; dueno: { id: string; nombre: string; telefono: string } }
  veterinario: { id: string; nombre: string; email: string; rol: string }
}

type CadenaMock = PromiseLike<{ data: CitaRowMock[] | null }> & {
  select: (columns: string) => CadenaMock
  eq: (column: string, value: string | boolean) => CadenaMock
  filter: (column: string, operator: string, value: string) => CadenaMock
  neq: (column: string, value: string) => CadenaMock
  gte: (column: string, value: string) => CadenaMock
  lte: (column: string, value: string) => CadenaMock
  order: (column: string, opts: { ascending: boolean }) => CadenaMock
}

function crearCadena(data: CitaRowMock[] | null): { from: (table: string) => CadenaMock } {
  const cadena = {
    select: vi.fn(() => cadena),
    eq: vi.fn(() => cadena),
    filter: vi.fn(() => cadena),
    neq: vi.fn(() => cadena),
    gte: vi.fn(() => cadena),
    lte: vi.fn(() => cadena),
    order: vi.fn(() => cadena),
    then: <T>(fn: (v: { data: CitaRowMock[] | null }) => T) => Promise.resolve(fn({ data })),
  } as unknown as CadenaMock
  return { from: vi.fn(() => cadena) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSesion.mockResolvedValue({ user: { id: "user-1" } })
  mockUsuario.mockResolvedValue({ id: "user-1", clinic_id: "clinic-1", rol: "admin", nombre: "Admin" })
})

describe("obtenerCitasRango", () => {
  it("retorna vacío si no hay sesión", async () => {
    mockSesion.mockResolvedValue(null)
    const resultado = await obtenerCitasRango({ fecha_inicio: "a", fecha_fin: "b" })
    expect(resultado).toEqual([])
  })

  it("retorna vacío si no hay usuario", async () => {
    mockUsuario.mockResolvedValue(null)
    const resultado = await obtenerCitasRango({ fecha_inicio: "a", fecha_fin: "b" })
    expect(resultado).toEqual([])
  })

  it("consulta citas en el rango de fechas", async () => {
    const mockData: CitaRowMock[] = [
      {
        id: "cita-1", mascota_id: "m-1", veterinario_id: "v-1",
        fecha_hora: "2026-06-19T15:00:00Z", duracion_minutos: 30,
        motivo: "Consulta", estado: "scheduled", notas_internas: null,
        observaciones: null, created_by: "user-1",
        mascota: { id: "m-1", nombre: "Max", especie: { id: "e-1", nombre: "Perro" }, dueno: { id: "d-1", nombre: "Juan", telefono: "555" } },
        veterinario: { id: "v-1", nombre: "Dr. Pérez", email: "vet@test.com", rol: "vet" },
      },
    ]

    mockCliente.mockResolvedValue(crearCadena(mockData))

    const resultado = await obtenerCitasRango({
      fecha_inicio: "2026-06-19T00:00:00Z",
      fecha_fin: "2026-06-19T23:59:59Z",
    })

    expect(resultado).toHaveLength(1)
    expect(resultado[0].id).toBe("cita-1")
    expect(resultado[0].mascota?.nombre).toBe("Max")
    expect(resultado[0].veterinario?.nombre).toBe("Dr. Pérez")
  })

  it("filtra por veterinario_id cuando se pasa", async () => {
    const mockClienteObj = crearCadena([{
      id: "cita-1", mascota_id: "m-1", veterinario_id: "v-1",
      fecha_hora: "2026-06-19T15:00:00Z", duracion_minutos: 30,
      motivo: "Consulta", estado: "scheduled", notas_internas: null,
      observaciones: null, created_by: "user-1",
      mascota: { id: "m-1", nombre: "Max", especie: { id: "e-1", nombre: "Perro" }, dueno: { id: "d-1", nombre: "Juan", telefono: "555" } },
      veterinario: { id: "v-1", nombre: "Dr. Pérez", email: "vet@test.com", rol: "vet" },
    }])
    mockCliente.mockResolvedValue(mockClienteObj)

    await obtenerCitasRango({
      fecha_inicio: "2026-06-19T00:00:00Z",
      fecha_fin: "2026-06-19T23:59:59Z",
      veterinario_id: "v-1",
    })

    const cadena = (mockClienteObj.from as ReturnType<typeof vi.fn>).mock.results[0].value as CadenaMock
    const llamadasEq = (cadena.eq as ReturnType<typeof vi.fn>).mock.calls.map((c: string[]) => c[0] + "=" + c[1])
    expect(llamadasEq).toContain("veterinario_id=v-1")
  })

  it("excluye citas canceladas", async () => {
    const mockClienteObj = crearCadena([])
    mockCliente.mockResolvedValue(mockClienteObj)

    await obtenerCitasRango({
      fecha_inicio: "2026-06-19T00:00:00Z",
      fecha_fin: "2026-06-19T23:59:59Z",
    })

    const cadena = (mockClienteObj.from as ReturnType<typeof vi.fn>).mock.results[0].value as CadenaMock
    expect((cadena.neq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith("estado", "cancelled")
  })
})
