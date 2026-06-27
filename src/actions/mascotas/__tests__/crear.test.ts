import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockSesion, mockUsuario, mockPermiso, mockCliente, mockDuenoPersonal } = vi.hoisted(() => ({
  mockSesion: vi.fn(),
  mockUsuario: vi.fn(),
  mockPermiso: vi.fn(),
  mockCliente: vi.fn(),
  mockDuenoPersonal: vi.fn(),
}))

vi.mock("@/lib/auth/get-session", () => ({ obtenerSesion: mockSesion, limpiarCacheSesion: vi.fn() }))
vi.mock("@/lib/auth/get-current-user", () => ({ obtenerUsuarioActual: mockUsuario }))
vi.mock("@/lib/auth/check-permission", () => ({ verificarPermiso: mockPermiso }))
vi.mock("@/lib/supabase/action", () => ({ crearClienteAccion: mockCliente }))
vi.mock("@/actions/duenos/obtener-o-crear-dueno-personal", () => ({
  obtenerOCrearDuenoPersonal: mockDuenoPersonal,
}))

import { crearMascota } from "../crear"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "recepcionista", nombre: "Test" }
const SESION_MOCK = { user: { id: "user-1" } }
const DUENO_ID = "00000000-0000-0000-0000-000000000001"
const ESPECIE_ID = "00000000-0000-0000-0000-000000000002"

function crearCadena(respuestas: {
  single?: { data: Record<string, unknown> | null; error: Record<string, unknown> | null }
  insertError?: { message: string } | null
}) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {}
  mock.from = vi.fn(() => mock)
  mock.select = vi.fn(() => mock)
  mock.eq = vi.fn(() => mock)
  mock.single = vi.fn().mockResolvedValue(
    respuestas.single ?? { data: { id: DUENO_ID, activo: true }, error: null },
  )
  mock.insert = vi.fn(() => mock)
  mock.upsert = vi.fn().mockResolvedValue({ error: null })
  return mock
}

function crearFormData(valores: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(valores)) fd.set(k, v)
  return fd
}

const INPUT_BASE = {
  nombre: "Firulais",
  especie_id: ESPECIE_ID,
}

describe("crearMascota", () => {
  beforeEach(() => {
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
    mockPermiso.mockReturnValue(true)
  })

  describe("flujo clinica (con owner_id)", () => {
    it("rechaza sin sesion", async () => {
      mockSesion.mockResolvedValue(null)
      const fd = crearFormData({ ...INPUT_BASE, owner_id: DUENO_ID })
      const res = await crearMascota(fd)
      expect(res).toEqual({ error: "No autorizado" })
    })

    it("rechaza usuario no encontrado", async () => {
      mockUsuario.mockResolvedValue(null)
      const fd = crearFormData({ ...INPUT_BASE, owner_id: DUENO_ID })
      const res = await crearMascota(fd)
      expect(res).toEqual({ error: "Usuario no encontrado" })
    })

    it("rechaza permiso denegado", async () => {
      mockPermiso.mockReturnValue(false)
      const fd = crearFormData({ ...INPUT_BASE, owner_id: DUENO_ID })
      const res = await crearMascota(fd)
      expect(res).toEqual({ error: "Permiso denegado" })
    })

    it("rechaza datos invalidos", async () => {
      const fd = crearFormData({ ...INPUT_BASE, nombre: "", owner_id: DUENO_ID })
      const res = await crearMascota(fd)
      expect(res.error).toBe("Datos inválidos")
      expect(res.detalles).toBeDefined()
    })

    it("rechaza dueno no encontrado", async () => {
      const cadena = crearCadena({ single: { data: null, error: { message: "Not found" } } })
      mockCliente.mockResolvedValue(cadena)
      const fd = crearFormData({ ...INPUT_BASE, owner_id: DUENO_ID })
      const res = await crearMascota(fd)
      expect(res).toEqual({ error: "Dueño no encontrado" })
    })

    it("rechaza dueno inactivo", async () => {
      const cadena = crearCadena({ single: { data: { id: DUENO_ID, activo: false }, error: null } })
      mockCliente.mockResolvedValue(cadena)
      const fd = crearFormData({ ...INPUT_BASE, owner_id: DUENO_ID })
      const res = await crearMascota(fd)
      expect(res).toEqual({ error: "No se puede registrar una mascota a un dueño inactivo" })
    })

    it("crea mascota exitosamente en clinica", async () => {
      const cadena = crearCadena({ single: { data: { id: DUENO_ID, activo: true }, error: null } })
      mockCliente.mockResolvedValue(cadena)
      const fd = crearFormData({ ...INPUT_BASE, owner_id: DUENO_ID, raza: "Labrador" })
      const res = await crearMascota(fd)
      expect(res).toEqual({ success: true })
      expect(cadena.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_id: DUENO_ID,
          nombre: "Firulais",
          especie_id: ESPECIE_ID,
        }),
      )
    })
  })

  describe("flujo personal (sin owner_id)", () => {
    it("resuelve dueno y crea mascota", async () => {
      mockDuenoPersonal.mockResolvedValue({ success: true, data: { id: "personal-dueno-id" } })
      const cadena = crearCadena({})
      mockCliente.mockResolvedValue(cadena)

      const fd = crearFormData(INPUT_BASE)
      const res = await crearMascota(fd)
      expect(res).toEqual({ success: true })
      expect(mockDuenoPersonal).toHaveBeenCalledOnce()
      expect(cadena.insert).toHaveBeenCalledWith(
        expect.objectContaining({ owner_id: "personal-dueno-id" }),
      )
    })

    it("retorna error si dueno personal falla", async () => {
      mockDuenoPersonal.mockResolvedValue({ success: false, error: "Error de prueba" })
      const cadena = crearCadena({})
      mockCliente.mockResolvedValue(cadena)

      const fd = crearFormData(INPUT_BASE)
      const res = await crearMascota(fd)
      expect(res).toEqual({ error: "Error de prueba" })
    })
  })
})
