import { describe, it, expect, vi, beforeEach } from "vitest"
import { haySolapamiento, sumarMinutos } from "../solapamiento"
import { HORA_INICIO, HORA_FIN, HORA_COMIDAS, SLOT_DURACION_MINUTOS } from "@/config/constants"

const { mockSesion, mockUsuario, mockCliente } = vi.hoisted(() => ({
  mockSesion: vi.fn(),
  mockUsuario: vi.fn(),
  mockCliente: vi.fn(),
}))

vi.mock("@/lib/auth/get-session", () => ({ obtenerSesion: mockSesion }))
vi.mock("@/lib/auth/get-current-user", () => ({ obtenerUsuarioActual: mockUsuario }))
vi.mock("@/lib/supabase/action", () => ({ crearClienteAccion: mockCliente }))

import { verificarDisponibilidad, type DisponibilidadResultado } from "../verificar-disponibilidad"
import { obtenerSlotsDisponibles } from "../obtener-slots-disponibles"

// ─── Types ────────────────────────────────────────────

interface CadenaSupabaseMock {
  from: (table: string) => CadenaSupabaseMock
  select: (columns: string) => CadenaSupabaseMock
  eq: (column: string, value: string) => CadenaSupabaseMock
  in: (column: string, values: string[]) => CadenaSupabaseMock
  gte: (column: string, value: string) => CadenaSupabaseMock
  lte: (column: string, value: string) => Promise<{ data: CitaRowMock[] | null; error: null }>
}

interface CitaRowMock {
  id: string
  mascota_id: string
  fecha_hora: string
  duracion_minutos: number
}

interface UsuarioActualMock {
  id: string
  clinic_id: string
  rol: string
  nombre: string
}

// ─── Helpers ──────────────────────────────────────────

function crearCadenaSupabase(data: CitaRowMock[] | null): CadenaSupabaseMock {
  const mock: CadenaSupabaseMock = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    in: vi.fn(() => mock),
    gte: vi.fn(() => mock),
    lte: vi.fn().mockResolvedValue({ data, error: null }),
  }
  return mock
}

function crearFormData(valores: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(valores)) fd.set(k, v)
  return fd
}

const USUARIO_MOCK: UsuarioActualMock = { id: "user-1", clinic_id: "clinic-1", rol: "recepcionista", nombre: "Test" }
const SESION_MOCK = { user: { id: "user-1" } }

const UUID_VET_1 = "00000000-0000-0000-0000-000000000001"
const UUID_MASCOTA_1 = "00000000-0000-0000-0000-000000000010"
const UUID_CITA_1 = "00000000-0000-0000-0000-000000000100"

const CITA_10AM: CitaRowMock = {
  id: UUID_CITA_1,
  mascota_id: UUID_MASCOTA_1,
  fecha_hora: "2026-06-17T15:00:00.000Z",
  duracion_minutos: 30,
}

// ─── Tests: solapamiento.ts ───────────────────────────

describe("haySolapamiento", () => {
  it("detecta solapamiento exacto", () => {
    const r = { inicio: new Date("2026-06-17T15:00:00Z"), fin: new Date("2026-06-17T15:30:00Z") }
    expect(haySolapamiento(r, r)).toBe(true)
  })

  it("detecta solapamiento parcial (primero antes)", () => {
    const a = { inicio: new Date("2026-06-17T15:00:00Z"), fin: new Date("2026-06-17T15:30:00Z") }
    const b = { inicio: new Date("2026-06-17T15:15:00Z"), fin: new Date("2026-06-17T15:45:00Z") }
    expect(haySolapamiento(a, b)).toBe(true)
  })

  it("detecta solapamiento parcial (segundo antes)", () => {
    const a = { inicio: new Date("2026-06-17T15:15:00Z"), fin: new Date("2026-06-17T15:45:00Z") }
    const b = { inicio: new Date("2026-06-17T15:00:00Z"), fin: new Date("2026-06-17T15:30:00Z") }
    expect(haySolapamiento(a, b)).toBe(true)
  })

  it("detecta contencion total (uno dentro del otro)", () => {
    const a = { inicio: new Date("2026-06-17T15:00:00Z"), fin: new Date("2026-06-17T16:00:00Z") }
    const b = { inicio: new Date("2026-06-17T15:15:00Z"), fin: new Date("2026-06-17T15:30:00Z") }
    expect(haySolapamiento(a, b)).toBe(true)
    expect(haySolapamiento(b, a)).toBe(true)
  })

  it("NO detecta solapamiento cuando no hay cruce", () => {
    const a = { inicio: new Date("2026-06-17T15:00:00Z"), fin: new Date("2026-06-17T15:30:00Z") }
    const b = { inicio: new Date("2026-06-17T15:30:00Z"), fin: new Date("2026-06-17T16:00:00Z") }
    expect(haySolapamiento(a, b)).toBe(false)
  })

  it("NO detecta solapamiento cuando estan separados", () => {
    const a = { inicio: new Date("2026-06-17T15:00:00Z"), fin: new Date("2026-06-17T15:30:00Z") }
    const b = { inicio: new Date("2026-06-17T16:00:00Z"), fin: new Date("2026-06-17T17:00:00Z") }
    expect(haySolapamiento(a, b)).toBe(false)
  })
})

describe("sumarMinutos", () => {
  it("suma minutos a una fecha", () => {
    const fecha = new Date("2026-06-17T15:00:00Z")
    const resultado = sumarMinutos(fecha, 30)
    expect(resultado.toISOString()).toBe("2026-06-17T15:30:00.000Z")
  })

  it("cruza el limite de hora", () => {
    const fecha = new Date("2026-06-17T15:45:00Z")
    const resultado = sumarMinutos(fecha, 30)
    expect(resultado.toISOString()).toBe("2026-06-17T16:15:00.000Z")
  })

  it("cruza el limite de dia", () => {
    const fecha = new Date("2026-06-17T23:45:00Z")
    const resultado = sumarMinutos(fecha, 30)
    expect(resultado.toISOString()).toBe("2026-06-18T00:15:00.000Z")
  })
})

// ─── Tests: verificarDisponibilidad ───────────────────
// 6 escenarios: doble click, simultáneos, tenant, edición, duración, reagendar

describe("verificarDisponibilidad", () => {
  beforeEach(() => {
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
  })

  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha_hora: "2026-06-17T15:00:00Z" })
    expect(await verificarDisponibilidad(fd)).toEqual({ error: "No autorizado" })
  })

  it("rechaza si usuario no existe", async () => {
    mockUsuario.mockResolvedValue(null)
    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha_hora: "2026-06-17T15:00:00Z" })
    expect(await verificarDisponibilidad(fd)).toEqual({ error: "Usuario no encontrado" })
  })

  it("E1: doble click mismo usuario — peticiones identicas detectan conflicto", async () => {
    // Simula dos llamadas rápidas: ambas ven 0 citas (race condition)
    const mockSupabase1 = crearCadenaSupabase([])
    const mockSupabase2 = crearCadenaSupabase([CITA_10AM])
    mockCliente
      .mockResolvedValueOnce(mockSupabase1)
      .mockResolvedValueOnce(mockSupabase2)

    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha_hora: "2026-06-17T15:00:00Z" })

    // Primer click: disponible
    const r1 = await verificarDisponibilidad(fd) as DisponibilidadResultado
    expect(r1.disponible).toBe(true)

    // Segundo click: la cita ya se registró → conflicto
    const r2 = await verificarDisponibilidad(fd) as DisponibilidadResultado
    expect(r2.disponible).toBe(false)
    expect(r2.conflictos).toHaveLength(1)
  })

  it("E2: dos usuarios simultáneos — mismo vet/hora detectan conflicto", async () => {
    // Usuario A consulta: no hay citas
    const mockA = crearCadenaSupabase([])
    // Usuario B consulta: A ya registró
    const mockB = crearCadenaSupabase([CITA_10AM])

    mockCliente
      .mockResolvedValueOnce(mockA)
      .mockResolvedValueOnce(mockB)

    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha_hora: "2026-06-17T15:00:00Z" })

    const r1 = await verificarDisponibilidad(fd) as DisponibilidadResultado
    expect(r1.disponible).toBe(true)

    const r2 = await verificarDisponibilidad(fd) as DisponibilidadResultado
    expect(r2.disponible).toBe(false)
  })

  it("E3: tenant distinto — mismo horario/vet sin conflicto", async () => {
    mockUsuario.mockResolvedValue({ ...USUARIO_MOCK, clinic_id: "clinic-999" })
    const mockSupabase = crearCadenaSupabase([])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha_hora: "2026-06-17T15:00:00Z" })
    const resultado = await verificarDisponibilidad(fd) as DisponibilidadResultado

    expect(resultado.disponible).toBe(true)
    expect(mockSupabase.eq).toHaveBeenCalledWith("clinic_id", "clinic-999")
  })

  it("E4: edición misma cita — excluye la cita actual del chequeo", async () => {
    const otraCita: CitaRowMock = {
      id: "00000000-0000-0000-0000-000000000200",
      mascota_id: "00000000-0000-0000-0000-000000000020",
      fecha_hora: "2026-06-17T15:00:00Z",
      duracion_minutos: 30,
    }
    const mockSupabase = crearCadenaSupabase([CITA_10AM, otraCita])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({
      veterinario_id: UUID_VET_1,
      fecha_hora: "2026-06-17T15:00:00Z",
      excluir_cita_id: UUID_CITA_1,
    })
    const resultado = await verificarDisponibilidad(fd) as DisponibilidadResultado

    expect(resultado.disponible).toBe(false)
    expect(resultado.conflictos).toHaveLength(1)
    expect(resultado.conflictos[0].id).toBe("00000000-0000-0000-0000-000000000200")
  })

  it("E4: edición — sin conflicto al excluir la única cita conflictiva", async () => {
    const mockSupabase = crearCadenaSupabase([CITA_10AM])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({
      veterinario_id: UUID_VET_1,
      fecha_hora: "2026-06-17T15:00:00Z",
      excluir_cita_id: UUID_CITA_1,
    })
    const resultado = await verificarDisponibilidad(fd) as DisponibilidadResultado

    expect(resultado.disponible).toBe(true)
    expect(resultado.conflictos).toHaveLength(0)
  })

  it("E5: duración distinta — 30 min nueva vs 60 min existente solapan parcialmente", async () => {
    const cita60min: CitaRowMock = {
      id: "00000000-0000-0000-0000-000000000300",
      mascota_id: "00000000-0000-0000-0000-000000000030",
      fecha_hora: "2026-06-17T15:00:00Z",
      duracion_minutos: 60,
    }
    const mockSupabase = crearCadenaSupabase([cita60min])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha_hora: "2026-06-17T15:15:00Z" })
    const resultado = await verificarDisponibilidad(fd) as DisponibilidadResultado

    expect(resultado.disponible).toBe(false)
    expect(resultado.conflictos).toHaveLength(1)
  })

  it("E5: duración distinta — sin solapamiento cuando no hay cruce", async () => {
    const cita60min: CitaRowMock = {
      id: "00000000-0000-0000-0000-000000000300",
      mascota_id: "00000000-0000-0000-0000-000000000030",
      fecha_hora: "2026-06-17T15:00:00Z",
      duracion_minutos: 60,
    }
    const mockSupabase = crearCadenaSupabase([cita60min])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha_hora: "2026-06-17T16:00:00Z" })
    const resultado = await verificarDisponibilidad(fd) as DisponibilidadResultado

    expect(resultado.disponible).toBe(true)
  })

  it("E6: reagendar — mover a horario libre es posible", async () => {
    const mockSupabase = crearCadenaSupabase([CITA_10AM])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({
      veterinario_id: UUID_VET_1,
      fecha_hora: "2026-06-17T16:30:00Z",
      excluir_cita_id: UUID_CITA_1,
    })
    const resultado = await verificarDisponibilidad(fd) as DisponibilidadResultado

    expect(resultado.disponible).toBe(true)
    expect(resultado.conflictos).toHaveLength(0)
  })

  it("E6: reagendar — mover a horario ocupado sin excluir genera conflicto", async () => {
    const mockSupabase = crearCadenaSupabase([CITA_10AM])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({
      veterinario_id: UUID_VET_1,
      fecha_hora: "2026-06-17T15:00:00Z",
    })
    const resultado = await verificarDisponibilidad(fd) as DisponibilidadResultado

    expect(resultado.disponible).toBe(false)
    expect(resultado.conflictos).toHaveLength(1)
  })

  it("retorna sugerencias cuando hay conflicto", async () => {
    const mockSupabase = crearCadenaSupabase([CITA_10AM])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha_hora: "2026-06-17T15:00:00Z" })
    const resultado = await verificarDisponibilidad(fd) as DisponibilidadResultado

    expect(resultado.disponible).toBe(false)
    expect(resultado.conflictos).toHaveLength(1)
    expect(Array.isArray(resultado.sugerencias)).toBe(true)
    if (resultado.sugerencias.length > 0) {
      expect(resultado.sugerencias[0]).toHaveProperty("fecha_hora")
    }
  })

  it("retorna error con datos invalidos (Zod)", async () => {
    const fd = crearFormData({ veterinario_id: "no-uuid", fecha_hora: "" })
    const resultado = await verificarDisponibilidad(fd)
    expect(resultado).toHaveProperty("error", "Datos inválidos")
  })
})

// ─── Tests: obtenerSlotsDisponibles ──────────────────

describe("obtenerSlotsDisponibles", () => {
  beforeEach(() => {
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
  })

  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha: "2026-06-17" })
    expect(await obtenerSlotsDisponibles(fd)).toEqual({ error: "No autorizado" })
  })

  it("genera slots cada 30 min dentro de jornada saltando comidas", async () => {
    const mockSupabase = crearCadenaSupabase([])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha: "2026-06-17" })
    const resultado = await obtenerSlotsDisponibles(fd) as { slots: { hora: string; disponible: boolean }[] }

    expect(Array.isArray(resultado.slots)).toBe(true)
    expect(resultado.slots.every((s) => s.disponible)).toBe(true)

    const horasEsperadas: string[] = []
    for (let h = HORA_INICIO; h < HORA_FIN; h++) {
      if (h >= HORA_COMIDAS[0] && h < HORA_COMIDAS[1]) continue
      for (let m = 0; m < 60; m += SLOT_DURACION_MINUTOS) {
        horasEsperadas.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
      }
    }
    expect(resultado.slots.map((s) => s.hora)).toEqual(horasEsperadas)
  })

  it("marca slot como ocupado si hay conflicto", async () => {
    const cita: CitaRowMock = {
      id: "cita-ocupada",
      mascota_id: UUID_MASCOTA_1,
      fecha_hora: "2026-06-17T15:00:00.000Z",
      duracion_minutos: 30,
    }
    const mockSupabase = crearCadenaSupabase([cita])
    mockCliente.mockResolvedValue(mockSupabase)

    const fd = crearFormData({ veterinario_id: UUID_VET_1, fecha: "2026-06-17" })
    const resultado = await obtenerSlotsDisponibles(fd) as { slots: { hora: string; disponible: boolean; conflicto_id?: string }[] }

    const slot15 = resultado.slots.find((s) => s.hora === "15:00")!
    expect(slot15.disponible).toBe(false)
    expect(slot15.conflicto_id).toBe("cita-ocupada")

    const slot09 = resultado.slots.find((s) => s.hora === "09:00")!
    expect(slot09.disponible).toBe(true)
    expect(slot09.conflicto_id).toBeUndefined()
  })
})
