import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockSesion, mockUsuario, mockCliente } = vi.hoisted(() => ({
  mockSesion: vi.fn(),
  mockUsuario: vi.fn(),
  mockCliente: vi.fn(),
}))

vi.mock("@/lib/auth/get-session", () => ({ obtenerSesion: mockSesion }))
vi.mock("@/lib/auth/get-current-user", () => ({ obtenerUsuarioActual: mockUsuario }))
vi.mock("@/lib/supabase/action", () => ({ crearClienteAccion: mockCliente }))

import { obtenerOCrearDuenoPersonal } from "../obtener-o-crear-dueno-personal"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "vet", nombre: "Dr. Test" }
const SESION_MOCK = { user: { id: "user-1" } }

function crearCadenaMock(respuestas: {
  maybeSingle?: { data: Record<string, unknown> | null; error: Record<string, unknown> | null }
  insertSelectSingle?: { data: Record<string, unknown> | null; error: Record<string, unknown> | null }
}) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {}
  mock.from = vi.fn((_table: string) => mock)
  mock.select = vi.fn((_columns?: string) => mock)
  mock.eq = vi.fn((_col: string, _val: unknown) => mock)
  mock.maybeSingle = vi.fn(() => {
    if (respuestas.maybeSingle) return Promise.resolve(respuestas.maybeSingle)
    return Promise.resolve({ data: null, error: null })
  })
  mock.insert = vi.fn((_values: Record<string, unknown>) => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(
        respuestas.insertSelectSingle ?? { data: { id: "existing-dueno-id" }, error: null }
      ),
    })),
  }))
  return mock
}

describe("obtenerOCrearDuenoPersonal", () => {
  beforeEach(() => {
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
  })

  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const res = await obtenerOCrearDuenoPersonal()
    expect(res).toEqual({ success: false, error: "No autorizado" })
  })

  it("rechaza usuario no encontrado", async () => {
    mockUsuario.mockResolvedValue(null)
    const res = await obtenerOCrearDuenoPersonal()
    expect(res).toEqual({ success: false, error: "Usuario no encontrado" })
  })

  it("reutiliza dueno existente", async () => {
    const cadena = crearCadenaMock({
      maybeSingle: { data: { id: "existing-dueno-id" }, error: null },
    })
    mockCliente.mockResolvedValue(cadena)

    const res = await obtenerOCrearDuenoPersonal()
    expect(res).toEqual({ success: true, data: { id: "existing-dueno-id" } })
  })

  it("crea dueno nuevo si no existe", async () => {
    const cadena = crearCadenaMock({
      maybeSingle: { data: null, error: null },
      insertSelectSingle: { data: { id: "new-dueno-id" }, error: null },
    })
    mockCliente.mockResolvedValue(cadena)

    const res = await obtenerOCrearDuenoPersonal()
    expect(res).toEqual({ success: true, data: { id: "new-dueno-id" } })
    expect(cadena.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        nombre: "Dr. Test",
      }),
    )
  })

  it("usa telefono vacio si usuario no tiene", async () => {
    mockUsuario.mockResolvedValue({ ...USUARIO_MOCK, telefono: null })
    const cadena = crearCadenaMock({
      maybeSingle: { data: null, error: null },
      insertSelectSingle: { data: { id: "new-dueno-id" }, error: null },
    })
    mockCliente.mockResolvedValue(cadena)

    await obtenerOCrearDuenoPersonal()
    expect(cadena.insert).toHaveBeenCalledWith(
      expect.objectContaining({ telefono: "" }),
    )
  })

  it("retorna error si falla insercion", async () => {
    const cadena = crearCadenaMock({
      maybeSingle: { data: null, error: null },
      insertSelectSingle: { data: null, error: { message: "DB error" } },
    })
    mockCliente.mockResolvedValue(cadena)

    const res = await obtenerOCrearDuenoPersonal()
    expect(res).toEqual({ success: false, error: "DB error" })
  })
})
