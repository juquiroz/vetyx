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

const mockVerificarDisponibilidad = vi.hoisted(() => vi.fn())
vi.mock("../verificar-disponibilidad", () => ({ verificarDisponibilidadInterna: mockVerificarDisponibilidad }))

import { editarCita } from "../editar"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "recepcionista", nombre: "Test" }
const SESION_MOCK = { user: { id: "user-1" } }

const UUID_CITA = "00000000-0000-0000-0000-000000000001"
const UUID_VET = "00000000-0000-0000-0000-000000000002"
const UUID_NUEVO_VET = "00000000-0000-0000-0000-000000000003"

const CITA_EXISTENTE = {
  id: UUID_CITA,
  clinic_id: "clinic-1",
  mascota_id: "00000000-0000-0000-0000-000000000010",
  veterinario_id: UUID_VET,
  fecha_hora: "2026-06-19T15:00:00Z",
  duracion_minutos: 30,
  motivo: "Consulta general",
  estado: "scheduled",
  notas_internas: null,
  observaciones: null,
  motivo_cancelacion: null,
  monto: null,
  completed_by: null,
  created_by: "user-1",
  created_at: "2026-06-19T12:00:00Z",
  updated_at: "2026-06-19T12:00:00Z",
}

function crearMockCliente(disponible = true) {
  mockVerificarDisponibilidad.mockResolvedValue({ disponible, conflictos: [], sugerencias: [] })
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
              .mockResolvedValueOnce({ data: CITA_EXISTENTE, error: null })
              .mockResolvedValueOnce({ data: { ...CITA_EXISTENTE, veterinario_id: UUID_NUEVO_VET, motivo: "Nuevo motivo" }, error: null }),
          })),
          filter: vi.fn(() => ({
            single: vi.fn()
              .mockResolvedValueOnce({ data: CITA_EXISTENTE, error: null })
              .mockResolvedValueOnce({ data: { ...CITA_EXISTENTE, veterinario_id: UUID_NUEVO_VET, motivo: "Nuevo motivo" }, error: null }),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { ...CITA_EXISTENTE, veterinario_id: UUID_NUEVO_VET, motivo: "Nuevo motivo" }, error: null }),
            })),
          })),
          filter: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { ...CITA_EXISTENTE, veterinario_id: UUID_NUEVO_VET, motivo: "Nuevo motivo" }, error: null }),
            })),
          })),
        })),
      })),
    })),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSesion.mockResolvedValue(SESION_MOCK)
  mockUsuario.mockResolvedValue(USUARIO_MOCK)
  mockPermiso.mockReturnValue(true)
})

describe("editarCita", () => {
  it("edita campos correctamente", async () => {
    mockCliente.mockResolvedValue(crearMockCliente())

    const fd = new FormData()
    fd.set("id", UUID_CITA)
    fd.set("veterinario_id", UUID_NUEVO_VET)
    fd.set("motivo", "Nuevo motivo")

    const resultado = await editarCita(fd)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.mensaje).toBe("Cita actualizada exitosamente")
    }
  })

  it("rechaza edicion sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const fd = new FormData()
    fd.set("id", UUID_CITA)
    const resultado = await editarCita(fd)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok && "error" in resultado) expect(resultado.error).toBe("No autorizado")
  })

  it("rechaza edicion sin permiso", async () => {
    mockPermiso.mockReturnValue(false)
    const fd = new FormData()
    fd.set("id", UUID_CITA)
    const resultado = await editarCita(fd)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok && "error" in resultado) expect(resultado.error).toBe("Permiso denegado")
  })

  it("rechaza edicion con datos invalidos", async () => {
    const fd = new FormData()
    fd.set("id", "no-uuid")
    const resultado = await editarCita(fd)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok && "error" in resultado) expect(resultado.error).toBe("Datos inválidos")
  })
})
