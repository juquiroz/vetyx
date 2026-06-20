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

import { completarCita } from "../completar"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "vet", nombre: "Dr. Test" }
const SESION_MOCK = { user: { id: "user-1" } }

const UUID_CITA_1 = "00000000-0000-0000-0000-000000000001"
const UUID_CITA_2 = "00000000-0000-0000-0000-000000000002"
const CITA_IN_PROGRESS = {
  id: UUID_CITA_1, clinic_id: "clinic-1", mascota_id: "m-1", veterinario_id: "v-1",
  fecha_hora: "2026-06-19T15:00:00Z", duracion_minutos: 30, motivo: "Consulta",
  estado: "in_progress", notas_internas: null, observaciones: null,
  motivo_cancelacion: null, monto: null, completed_by: null,
  created_by: "user-1", created_at: "2026-06-19T12:00:00Z", updated_at: "2026-06-19T12:00:00Z",
}
const CITA_SCHEDULED = { ...CITA_IN_PROGRESS, id: UUID_CITA_2, estado: "scheduled" }

function crearMockCliente(cita: typeof CITA_IN_PROGRESS) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: cita, error: null }),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { ...cita, estado: "completed", monto: 500, completed_by: "user-1" }, error: null }),
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

describe("completarCita", () => {
  it("completa cita in_progress exitosamente", async () => {
    mockCliente.mockResolvedValue(crearMockCliente(CITA_IN_PROGRESS))
    const fd = new FormData()
    fd.set("id", UUID_CITA_1)
    fd.set("monto", "500")
    const resultado = await completarCita(fd)
    expect(resultado.ok).toBe(true)
    if (resultado.ok) expect(resultado.mensaje).toBe("Cita completada exitosamente")
  })

  it("rechaza completar cita no in_progress", async () => {
    mockCliente.mockResolvedValue(crearMockCliente(CITA_SCHEDULED))
    const fd = new FormData()
    fd.set("id", UUID_CITA_2)
    const resultado = await completarCita(fd)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.error).toContain("Solo se pueden completar citas en curso")
  })

  it("rechaza sin permiso completar", async () => {
    mockPermiso.mockReturnValue(false)
    const fd = new FormData()
    fd.set("id", UUID_CITA_1)
    const resultado = await completarCita(fd)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.error).toBe("Permiso denegado")
  })

  it("completa sin monto", async () => {
    mockCliente.mockResolvedValue(crearMockCliente(CITA_IN_PROGRESS))
    const fd = new FormData()
    fd.set("id", UUID_CITA_1)
    const resultado = await completarCita(fd)
    expect(resultado.ok).toBe(true)
  })
})
