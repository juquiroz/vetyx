import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockSesion, mockUsuario, mockCliente } = vi.hoisted(() => ({
  mockSesion: vi.fn(),
  mockUsuario: vi.fn(),
  mockCliente: vi.fn(),
}))

vi.mock("@/lib/auth/get-session", () => ({ obtenerSesion: mockSesion }))
vi.mock("@/lib/auth/get-current-user", () => ({ obtenerUsuarioActual: mockUsuario }))
vi.mock("@/lib/supabase/action", () => ({ crearClienteAccion: mockCliente }))

import { obtenerCatalogoVacunas } from "../obtener-catalogo"

const SESION_MOCK = { user: { id: "user-1" } }
const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "vet" }

type FilaMock = {
  from: (table: string) => FilaMock
  select: (columns?: string) => FilaMock
  eq: (column: string, value: string) => FilaMock
  or: (filters: string) => FilaMock
  order: (column: string, opts?: { ascending: boolean }) => FilaMock
  then: <T>(onfulfilled?: (value: unknown) => T) => Promise<T>
}

function crearCatalogoFila(data: Record<string, unknown>[]): FilaMock {
  const resolved = { data, error: null }
  const mock: FilaMock = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    or: vi.fn(() => mock),
    order: vi.fn(() => mock),
    then: vi.fn((onfulfilled) => Promise.resolve(onfulfilled?.(resolved))),
  }
  return mock
}

describe("obtenerCatalogoVacunas", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
  })

  // 1. Retorna todas las vacunas del catálogo (ORM filtra por especie)
  it("retorna catalogo completo desde db", async () => {
    const CATALOGO: Record<string, unknown>[] = [
      { id: "v1", nombre: "Antirrábica", especie_id: "perro" },
      { id: "v2", nombre: "Múltiple felina", especie_id: "gato" },
      { id: "v3", nombre: "Otra", especie_id: null },
    ]

    const fila = crearCatalogoFila(CATALOGO)
    mockCliente.mockResolvedValue({
      from: () => fila,
    })

    const resultado = await obtenerCatalogoVacunas("perro")
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data).toHaveLength(3)
    }
  })

  // 2. Catálogo vacío
  it("retorna data vacio si no hay catalogo", async () => {
    const fila = crearCatalogoFila([])
    mockCliente.mockResolvedValue({
      from: () => fila,
    })

    const resultado = await obtenerCatalogoVacunas("perro")
    expect(resultado).toEqual({ success: true, data: [] })
  })

  // 3. Error de base de datos
  it("retorna data vacio si hay error", async () => {
    const fila: FilaMock = {
      from: vi.fn(() => fila),
      select: vi.fn(() => fila),
      eq: vi.fn(() => fila),
      or: vi.fn(() => fila),
      order: vi.fn(() => fila),
      then: vi.fn((onfulfilled) => Promise.resolve(onfulfilled?.({ data: null, error: { message: "DB error" } }))),
    }
    mockCliente.mockResolvedValue({
      from: () => fila,
    })

    const resultado = await obtenerCatalogoVacunas("perro")
    expect(resultado).toEqual({ success: true, data: [] })
  })

  // 4. Rechaza sin sesión
  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const resultado = await obtenerCatalogoVacunas("perro")
    expect(resultado).toEqual({ success: false, error: "No autorizado" })
  })

  // 5. Rechaza usuario no encontrado
  it("rechaza usuario no encontrado", async () => {
    mockUsuario.mockResolvedValue(null)
    const resultado = await obtenerCatalogoVacunas("perro")
    expect(resultado).toEqual({ success: false, error: "Usuario no encontrado" })
  })
})
