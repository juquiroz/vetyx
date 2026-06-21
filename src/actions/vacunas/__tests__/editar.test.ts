import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockSesion, mockUsuario, mockPermiso, mockCliente } = vi.hoisted(() => ({
  mockSesion: vi.fn(),
  mockUsuario: vi.fn(),
  mockPermiso: vi.fn(),
  mockCliente: vi.fn(),
}))

vi.mock("@/lib/auth/get-session", () => ({ obtenerSesion: mockSesion }))
vi.mock("@/lib/auth/get-current-user", () => ({ obtenerUsuarioActual: mockUsuario }))
vi.mock("@/lib/auth/check-permission", () => ({ verificarPermiso: mockPermiso }))
vi.mock("@/lib/supabase/action", () => ({ crearClienteAccion: mockCliente }))

import { editarVacuna } from "../editar"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "vet", nombre: "Dr. Test" }
const SESION_MOCK = { user: { id: "user-1" } }
const VACUNA_ID = "00000000-0000-0000-0000-000000000100"

function crearFormData(valores: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(valores)) fd.set(k, v)
  return fd
}

function crearClienteMockUpdate(
  vacunaExistente: Record<string, unknown> | null,
  resultadoUpdate: Record<string, unknown> | null,
) {
  const resueltoExistente = { data: vacunaExistente, error: vacunaExistente ? null : { message: "Not found" } }
  const resueltoUpdate = { data: resultadoUpdate, error: resultadoUpdate ? null : { message: "Error" } }

  function then<T>(onfulfilled?: (value: typeof resueltoExistente) => T | PromiseLike<T>): Promise<T | undefined> {
    return Promise.resolve(resueltoExistente).then(onfulfilled)
  }

  const base = { from: () => base, select: () => base, eq: () => base, single: () => base, update: () => base, then }

  const updateQuery = {
    eq: () => ({
      select: () => ({
        single: () => ({
          then: (onfulfilled?: (value: typeof resueltoUpdate) => unknown) => Promise.resolve(resueltoUpdate).then(onfulfilled),
        }),
      }),
    }),
  }

  return Promise.resolve({
    from: (table: string) => {
      if (table === "vacunas") {
        return { ...base, update: () => updateQuery }
      }
      return base
    },
  })
}

describe("editarVacuna", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
    mockPermiso.mockReturnValue(true)
  })

  // 1. Sin sesión
  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const fd = crearFormData({ id: VACUNA_ID })
    const resultado = await editarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "No autorizado" })
  })

  // 2. Usuario no encontrado
  it("rechaza usuario no encontrado", async () => {
    mockUsuario.mockResolvedValue(null)
    const fd = crearFormData({ id: VACUNA_ID })
    const resultado = await editarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Usuario no encontrado" })
  })

  // 3. Permiso denegado
  it("rechaza permiso denegado", async () => {
    mockPermiso.mockReturnValue(false)
    const fd = crearFormData({ id: VACUNA_ID })
    const resultado = await editarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Permiso denegado" })
  })

  // 4. Validación falla (id inválido)
  it("rechaza id invalido", async () => {
    const fd = crearFormData({ id: "no-es-uuid" })
    const resultado = await editarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Datos inválidos" })
  })

  // 5. Vacuna no encontrada o de otra clínica
  it("rechaza vacuna no encontrada", async () => {
    mockCliente.mockImplementation(() => crearClienteMockUpdate(null, null))
    const fd = crearFormData({ id: VACUNA_ID })
    const resultado = await editarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Vacuna no encontrada" })
  })

  // 6. Vacuna de otra clínica
  it("rechaza vacuna de otra clinica", async () => {
    mockCliente.mockImplementation(() => crearClienteMockUpdate({ id: VACUNA_ID, clinic_id: "clinic-otra" }, null))
    const fd = crearFormData({ id: VACUNA_ID })
    const resultado = await editarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Permiso denegado" })
  })

  // 7. Edición exitosa (solo lote, fecha_proxima_dosis, observaciones)
  it("edita vacuna exitosamente", async () => {
    mockCliente.mockImplementation(() =>
      crearClienteMockUpdate(
        { id: VACUNA_ID, clinic_id: "clinic-1" },
        { id: VACUNA_ID, lote: "LOTE-NUEVO", fecha_proxima_dosis: null, observaciones: "Nueva observación" },
      ),
    )

    const fd = crearFormData({ id: VACUNA_ID, lote: "LOTE-NUEVO", observaciones: "Nueva observación" })
    const resultado = await editarVacuna(fd)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.id).toBe(VACUNA_ID)
      expect(resultado.data.lote).toBe("LOTE-NUEVO")
      expect(resultado.data.observaciones).toBe("Nueva observación")
    }
  })

  // 8. Sin campos para actualizar
  it("rechaza si no hay campos para actualizar", async () => {
    mockCliente.mockImplementation(() => crearClienteMockUpdate({ id: VACUNA_ID, clinic_id: "clinic-1" }, null))
    const fd = crearFormData({ id: VACUNA_ID })
    const resultado = await editarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "No hay campos para actualizar" })
  })
})
