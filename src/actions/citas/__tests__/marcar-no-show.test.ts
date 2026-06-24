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

import { marcarNoShow } from "../marcar-no-show"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "recepcionista", nombre: "Test" }
const SESION_MOCK = { user: { id: "user-1" } }

const UUID_CITA_1 = "00000000-0000-0000-0000-000000000001"
const UUID_CITA_2 = "00000000-0000-0000-0000-000000000002"
const CITA_CONFIRMED = {
  id: UUID_CITA_1, clinic_id: "clinic-1", mascota_id: "m-1", veterinario_id: "v-1",
  fecha_hora: "2026-06-19T15:00:00Z", duracion_minutos: 30, motivo: "Consulta",
  estado: "confirmed", notas_internas: null, observaciones: null,
  motivo_cancelacion: null, monto: null, completed_by: null,
  created_by: "user-1", created_at: "2026-06-19T12:00:00Z", updated_at: "2026-06-19T12:00:00Z",
}
const CITA_SCHEDULED = { ...CITA_CONFIRMED, id: UUID_CITA_2, estado: "scheduled" }

function crearMockCliente(cita: typeof CITA_CONFIRMED) {
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
              single: vi.fn().mockResolvedValue({ data: { ...cita, estado: "no_show" }, error: null }),
            })),
          })),
          filter: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { ...cita, estado: "no_show" }, error: null }),
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

describe("marcarNoShow", () => {
  it("marca como no show cita confirmada exitosamente", async () => {
    mockCliente.mockResolvedValue(crearMockCliente(CITA_CONFIRMED))
    const fd = new FormData()
    fd.set("id", UUID_CITA_1)
    const resultado = await marcarNoShow(fd)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) expect(resultado.mensaje).toBe("Cita marcada como no asistió")
  })

  it("rechaza marcar no show si no está confirmada", async () => {
    mockCliente.mockResolvedValue(crearMockCliente(CITA_SCHEDULED))
    const fd = new FormData()
    fd.set("id", UUID_CITA_2)
    const resultado = await marcarNoShow(fd)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.error).toContain("Solo se puede marcar como no show una cita confirmada")
  })

  it("rechaza sin permiso", async () => {
    mockPermiso.mockReturnValue(false)
    const fd = new FormData()
    fd.set("id", UUID_CITA_1)
    const resultado = await marcarNoShow(fd)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.error).toBe("Permiso denegado")
  })
})
