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

import { editarEvento } from "../editar-evento"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "vet", nombre: "Dr. Test" }
const SESION_MOCK = { user: { id: "user-1" } }
const EVENTO_ID = "00000000-0000-0000-0000-000000000100"

function crearFormData(valores: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(valores)) fd.set(k, v)
  return fd
}

describe("editarEvento", () => {
  beforeEach(() => {
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
    mockPermiso.mockReturnValue(true)
  })

  function crearMockSupabase(
    resultadoExistente: { data: Record<string, unknown> | null; error: { message: string } | null },
    resultadoUpdate: { data: Record<string, unknown> | null; error: { message: string } | null },
  ) {
    const cadena = {
      from: vi.fn(() => cadena),
      select: vi.fn(() => cadena),
      eq: vi.fn(() => cadena),
      update: vi.fn(() => cadena),
      single: vi.fn()
        .mockResolvedValueOnce(resultadoExistente)
        .mockResolvedValueOnce(resultadoUpdate),
    }
    return cadena
  }

  // 1. Sin sesión
  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const fd = crearFormData({ id: EVENTO_ID, tratamiento: "Nuevo tratamiento" })
    const resultado = await editarEvento(fd)
    expect(resultado).toEqual({ success: false, error: "No autorizado" })
  })

  // 2. Usuario no encontrado
  it("rechaza usuario no encontrado", async () => {
    mockUsuario.mockResolvedValue(null)
    const fd = crearFormData({ id: EVENTO_ID, tratamiento: "Nuevo tratamiento" })
    const resultado = await editarEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Usuario no encontrado" })
  })

  // 3. Permiso denegado
  it("rechaza permiso denegado", async () => {
    mockPermiso.mockReturnValue(false)
    const fd = crearFormData({ id: EVENTO_ID, tratamiento: "Nuevo tratamiento" })
    const resultado = await editarEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Permiso denegado" })
  })

  // 4. Validación Zod falla (id inválido)
  it("rechaza id invalido", async () => {
    const fd = crearFormData({ id: "no-es-uuid", tratamiento: "Nuevo tratamiento" })
    const resultado = await editarEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Datos inválidos" })
  })

  // 5. Evento no encontrado
  it("rechaza evento no encontrado", async () => {
    const cadena = crearMockSupabase(
      { data: null, error: { message: "Not found" } },
      { data: null, error: { message: "Not found" } },
    )
    mockCliente.mockResolvedValue(cadena)

    const fd = crearFormData({ id: EVENTO_ID, tratamiento: "Nuevo tratamiento" })
    const resultado = await editarEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Evento no encontrado" })
  })

  // 6. Ventana 24h expirada
  it("rechaza edicion fuera de ventana 24h", async () => {
    const ayer = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const cadena = crearMockSupabase(
      { data: { id: EVENTO_ID, created_at: ayer }, error: null },
      { data: null, error: null },
    )
    mockCliente.mockResolvedValue(cadena)

    const fd = crearFormData({ id: EVENTO_ID, tratamiento: "Nuevo tratamiento" })
    const resultado = await editarEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Ya pasó la ventana de edición de 24 horas" })
  })

  // 7. Sin campos para actualizar
  it("rechaza sin campos para actualizar", async () => {
    const ahora = new Date().toISOString()
    const cadena = crearMockSupabase(
      { data: { id: EVENTO_ID, created_at: ahora }, error: null },
      { data: null, error: null },
    )
    mockCliente.mockResolvedValue(cadena)

    const fd = crearFormData({ id: EVENTO_ID })
    const resultado = await editarEvento(fd)
    expect(resultado).toEqual({ success: false, error: "No hay campos para actualizar" })
  })

  // 8. Edición exitosa dentro de 24h
  it("actualiza tratamiento y notas exitosamente", async () => {
    const ahora = new Date().toISOString()
    const cadena = crearMockSupabase(
      { data: { id: EVENTO_ID, created_at: ahora }, error: null },
      {
        data: { id: EVENTO_ID, tratamiento: "Nuevo tratamiento", notas: "Nuevas notas" },
        error: null,
      },
    )
    mockCliente.mockResolvedValue(cadena)

    const fd = crearFormData({
      id: EVENTO_ID,
      tratamiento: "Nuevo tratamiento",
      notas: "Nuevas notas",
    })
    const resultado = await editarEvento(fd)

    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.id).toBe(EVENTO_ID)
      expect(resultado.data.tratamiento).toBe("Nuevo tratamiento")
      expect(resultado.data.notas).toBe("Nuevas notas")
    }
  })

  // 9. Editar solo tratamiento
  it("actualiza solo tratamiento cuando notas no se envia", async () => {
    const ahora = new Date().toISOString()
    const cadena = crearMockSupabase(
      { data: { id: EVENTO_ID, created_at: ahora }, error: null },
      {
        data: { id: EVENTO_ID, tratamiento: "Solo tratamiento", notas: null },
        error: null,
      },
    )
    mockCliente.mockResolvedValue(cadena)

    const fd = crearFormData({ id: EVENTO_ID, tratamiento: "Solo tratamiento" })
    const resultado = await editarEvento(fd)

    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.tratamiento).toBe("Solo tratamiento")
    }
  })

  // 10. Límite de ventana: justo antes de 24h
  it("permite edicion justo antes de 24h", async () => {
    const casi24h = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
    const cadena = crearMockSupabase(
      { data: { id: EVENTO_ID, created_at: casi24h }, error: null },
      {
        data: { id: EVENTO_ID, tratamiento: "Dentro de ventana", notas: null },
        error: null,
      },
    )
    mockCliente.mockResolvedValue(cadena)

    const fd = crearFormData({ id: EVENTO_ID, tratamiento: "Dentro de ventana" })
    const resultado = await editarEvento(fd)

    expect(resultado).toHaveProperty("success", true)
  })
})
