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

import { cancelarCita } from "../cancelar"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "recepcionista", nombre: "Test" }
const SESION_MOCK = { user: { id: "user-1" } }

const UUID_CITA_1 = "00000000-0000-0000-0000-000000000001"
const UUID_CITA_2 = "00000000-0000-0000-0000-000000000002"
const CITA_SCHEDULED = {
  id: UUID_CITA_1, clinic_id: "clinic-1", mascota_id: "m-1", veterinario_id: "v-1",
  fecha_hora: "2026-06-19T15:00:00Z", duracion_minutos: 30, motivo: "Consulta",
  estado: "scheduled", notas_internas: null, observaciones: null,
  motivo_cancelacion: null, monto: null, completed_by: null,
  created_by: "user-1", created_at: "2026-06-19T12:00:00Z", updated_at: "2026-06-19T12:00:00Z",
}
const CITA_COMPLETED = { ...CITA_SCHEDULED, id: UUID_CITA_2, estado: "completed" }

function crearMockCliente(cita: typeof CITA_SCHEDULED) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: cita, error: null }),
          })),
          filter: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: cita, error: null }),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { ...cita, estado: "cancelled", motivo_cancelacion: "Motivo" }, error: null }),
            })),
          })),
          filter: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { ...cita, estado: "cancelled", motivo_cancelacion: "Motivo" }, error: null }),
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

describe("cancelarCita", () => {
  it("cancela cita scheduled exitosamente", async () => {
    mockCliente.mockResolvedValue(crearMockCliente(CITA_SCHEDULED))
    const fd = new FormData()
    fd.set("id", UUID_CITA_1)
    fd.set("motivo_cancelacion", "Motivo")
    const resultado = await cancelarCita(fd)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) expect(resultado.mensaje).toBe("Cita cancelada exitosamente")
  })

  it("rechaza cancelar cita completada", async () => {
    mockCliente.mockResolvedValue(crearMockCliente(CITA_COMPLETED))
    const fd = new FormData()
    fd.set("id", UUID_CITA_2)
    const resultado = await cancelarCita(fd)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.error).toContain("No se puede cancelar")
  })

  it("rechaza sin permiso", async () => {
    mockPermiso.mockReturnValue(false)
    const fd = new FormData()
    fd.set("id", UUID_CITA_1)
    const resultado = await cancelarCita(fd)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.error).toBe("Permiso denegado")
  })

  it("permite cancelar sin motivo", async () => {
    mockCliente.mockResolvedValue(crearMockCliente(CITA_SCHEDULED))
    const fd = new FormData()
    fd.set("id", UUID_CITA_1)
    const resultado = await cancelarCita(fd)
    expect(resultado.ok).toBe(true)
  })
})
