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

import { obtenerCita } from "../obtener"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "recepcionista", nombre: "Test" }
const SESION_MOCK = { user: { id: "user-1" } }

const UUID_CITA = "00000000-0000-0000-0000-000000000001"
const CITA_MOCK = {
  id: UUID_CITA,
  clinic_id: "clinic-1",
  mascota_id: "m-1",
  veterinario_id: "v-1",
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

beforeEach(() => {
  vi.clearAllMocks()
  mockSesion.mockResolvedValue(SESION_MOCK)
  mockUsuario.mockResolvedValue(USUARIO_MOCK)
  mockPermiso.mockReturnValue(true)
})

describe("obtenerCita", () => {
  it("retorna la cita cuando existe", async () => {
    mockCliente.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: CITA_MOCK, error: null }),
            })),
          })),
        })),
      })),
    })

    const resultado = await obtenerCita(UUID_CITA)
    expect(resultado).toBeTruthy()
    expect(resultado?.id).toBe(UUID_CITA)
  })

  it("retorna null cuando no existe", async () => {
    mockCliente.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      })),
    })

    const resultado = await obtenerCita("no-existe")
    expect(resultado).toBeNull()
  })

  it("retorna null sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const resultado = await obtenerCita("cita-1")
    expect(resultado).toBeNull()
  })

  it("retorna null sin permiso", async () => {
    mockPermiso.mockReturnValue(false)
    const resultado = await obtenerCita("cita-1")
    expect(resultado).toBeNull()
  })
})
