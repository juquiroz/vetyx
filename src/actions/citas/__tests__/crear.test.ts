import { describe, it, expect, vi, beforeEach } from "vitest"
import { SLOT_DURACION_MINUTOS } from "@/config/constants"

const { mockSesion, mockUsuario, mockPermiso, mockCliente, mockLimpiarCache } = vi.hoisted(() => ({
  mockSesion: vi.fn(),
  mockUsuario: vi.fn(),
  mockPermiso: vi.fn(),
  mockCliente: vi.fn(),
  mockLimpiarCache: vi.fn(),
}))

vi.mock("@/lib/auth/get-session", () => ({ obtenerSesion: mockSesion, limpiarCacheSesion: mockLimpiarCache }))
vi.mock("@/lib/auth/get-current-user", () => ({ obtenerUsuarioActual: mockUsuario }))
vi.mock("@/lib/auth/check-permission", () => ({ verificarPermiso: mockPermiso }))
vi.mock("@/lib/supabase/action", () => ({ crearClienteAccion: mockCliente }))

import { crearCita } from "../crear"

interface CitaRowMock {
  id: string
  clinic_id: string
  mascota_id: string
  veterinario_id: string
  fecha_hora: string
  duracion_minutos: number
  motivo: string
  estado: string
  monto: number | null
  notas_internas: string | null
  observaciones: string | null
  motivo_cancelacion: string | null
  created_by: string
  completed_by: string | null
  created_at: string
  updated_at: string
}

interface CadenaCompletaMock {
  from: (table: string) => CadenaCompletaMock
  select: (columns?: string) => CadenaCompletaMock
  eq: (column: string, value: string) => CadenaCompletaMock
  in: (column: string, values: string[]) => CadenaCompletaMock
  gte: (column: string, value: string) => CadenaCompletaMock
  lte: (column: string, value: string) => Promise<{ data: CitaRowMock[] | null; error: null }>
  insert: (values: Record<string, unknown>) => CadenaCompletaMock
  single: () => Promise<{ data: CitaRowMock | null; error: { code: string; message: string } | null }>
}

function crearCadenaCompleta(
  citasExistentes: CitaRowMock[] | null,
  resultadoInsert: { data: CitaRowMock | null; error: { code: string; message: string } | null },
): CadenaCompletaMock {
  const mock: CadenaCompletaMock = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    in: vi.fn(() => mock),
    gte: vi.fn(() => mock),
    lte: vi.fn().mockResolvedValue({ data: citasExistentes, error: null }),
    insert: vi.fn(() => mock),
    single: vi.fn().mockResolvedValue(resultadoInsert),
  }
  return mock
}

function crearFormData(valores: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(valores)) fd.set(k, v)
  return fd
}

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "recepcionista", nombre: "Test" }
const SESION_MOCK = { user: { id: "user-1" } }

const UUID_VET_1 = "00000000-0000-0000-0000-000000000001"
const UUID_MASCOTA_1 = "00000000-0000-0000-0000-000000000010"

const CITA_CREADA: CitaRowMock = {
  id: "00000000-0000-0000-0000-000000000100",
  clinic_id: "clinic-1",
  mascota_id: UUID_MASCOTA_1,
  veterinario_id: UUID_VET_1,
  fecha_hora: "2026-06-17T15:00:00.000Z",
  duracion_minutos: 30,
  motivo: "Consulta de rutina",
  estado: "scheduled",
  monto: null,
  notas_internas: null,
  observaciones: null,
  motivo_cancelacion: null,
  created_by: "user-1",
  completed_by: null,
  created_at: "2026-06-17T10:00:00.000Z",
  updated_at: "2026-06-17T10:00:00.000Z",
}

const INPUT_VALIDO = {
  mascota_id: UUID_MASCOTA_1,
  veterinario_id: UUID_VET_1,
  fecha_hora: "2026-06-17T15:00:00.000Z",
  duracion_minutos: String(SLOT_DURACION_MINUTOS),
  motivo: "Consulta de rutina",
}

// ─── Tests ───────────────────────────────────────────

describe("crearCita", () => {
  beforeEach(() => {
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
    mockPermiso.mockReturnValue(true)
  })

  // 1. Sin sesión
  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearCita(fd)
    expect(resultado).toEqual({ ok: false, error: "No autorizado" })
  })

  // 2. Usuario no encontrado
  it("rechaza usuario no encontrado", async () => {
    mockUsuario.mockResolvedValue(null)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearCita(fd)
    expect(resultado).toEqual({ ok: false, error: "Usuario no encontrado" })
  })

  // 3. Permiso denegado
  it("rechaza permiso denegado", async () => {
    mockPermiso.mockReturnValue(false)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearCita(fd)
    expect(resultado).toEqual({ ok: false, error: "Permiso denegado" })
  })

  // 4. Zod inválido (motivo muy corto)
  it("rechaza datos invalidos (motivo corto)", async () => {
    const fd = crearFormData({ ...INPUT_VALIDO, motivo: "abc" })
    const resultado = await crearCita(fd)
    expect(resultado).toEqual({ ok: false, error: "Datos inválidos" })
  })

  // 5. Fuera de horario laboral
  it("rechaza fuera de horario laboral", async () => {
    const fd = crearFormData({
      ...INPUT_VALIDO,
      fecha_hora: "2026-06-17T06:00:00.000Z",
    })
    const resultado = await crearCita(fd)
    expect(resultado).toEqual({ ok: false, error: "Fuera del horario laboral" })
  })

  // 6. Conflicto detectado → retorna conflictos + sugerencias
  it("retorna conflicto con sugerencias cuando hay solapamiento", async () => {
    const citaExistente: CitaRowMock = {
      id: "cita-existente",
      clinic_id: "clinic-1",
      mascota_id: UUID_MASCOTA_1,
      veterinario_id: UUID_VET_1,
      fecha_hora: "2026-06-17T15:00:00.000Z",
      duracion_minutos: 30,
      motivo: "Consulta",
      estado: "confirmed",
      monto: null,
      notas_internas: null,
      observaciones: null,
      motivo_cancelacion: null,
      created_by: "user-2",
      completed_by: null,
      created_at: "2026-06-16T10:00:00.000Z",
      updated_at: "2026-06-16T10:00:00.000Z",
    }

    const mock = crearCadenaCompleta([citaExistente], { data: null, error: null })
    mockCliente.mockResolvedValue(mock)

    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearCita(fd)

    expect(resultado).toHaveProperty("ok", false)
    if (!resultado.ok && "conflictos" in resultado) {
      expect(resultado.conflictos).toHaveLength(1)
      expect(resultado.conflictos[0].id).toBe("cita-existente")
      expect(Array.isArray(resultado.sugerencias)).toBe(true)
      expect(resultado.mensaje).toBe("Conflicto de horario con otra cita")
    }
  })

  // 7. Disponible → crea cita exitosamente
  it("crea cita exitosamente cuando esta disponible", async () => {
    const mock = crearCadenaCompleta([], { data: CITA_CREADA, error: null })
    mockCliente.mockResolvedValue(mock)

    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearCita(fd)

    expect(resultado).toHaveProperty("ok", true)
    if (resultado.ok) {
      expect(resultado.cita.id).toBe(CITA_CREADA.id)
      expect(resultado.cita.mascota_id).toBe(UUID_MASCOTA_1)
      expect(resultado.cita.motivo).toBe("Consulta de rutina")
      expect(resultado.mensaje).toBe("Cita creada exitosamente")
      expect(mockLimpiarCache).toHaveBeenCalledOnce()
    }
  })

  // 8. Exclusion constraint catch (race condition)
  it("maneja exclusion constraint y retorna conflicto actualizado", async () => {
    const errorExclusion = {
      code: "23P01",
      message: 'duplicate key value violates exclusion constraint "excl_citas_solapamiento"',
    }

    const mock = crearCadenaCompleta(
      [],
      { data: null, error: errorExclusion },
    )
    mockCliente.mockResolvedValue(mock)

    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearCita(fd)

    expect(resultado).toHaveProperty("ok", false)
    if (!resultado.ok && "conflictos" in resultado) {
      expect(resultado.mensaje).toContain("Conflicto de horario detectado al guardar")
    }
  })
})
