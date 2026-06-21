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

import { registrarVacuna } from "../registrar"

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "vet", nombre: "Dr. Test" }
const SESION_MOCK = { user: { id: "user-1" } }
const MASCOTA_ID = "00000000-0000-0000-0000-000000000010"
const CATALOGO_ID = "00000000-0000-0000-0000-000000000020"
const CATALOGO_OTRA_ID = "00000000-0000-0000-0000-000000000021"
const VETERINARIO_ID = "00000000-0000-0000-0000-000000000030"
const HOY = new Date().toISOString().split("T")[0]

function crearFormData(valores: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(valores)) fd.set(k, v)
  return fd
}

const INPUT_VALIDO = {
  mascota_id: MASCOTA_ID,
  catalogo_vacuna_id: CATALOGO_ID,
  fecha_aplicacion: HOY,
  veterinario_id: VETERINARIO_ID,
}

type FilaMock = {
  from: (table: string) => FilaMock
  select: (columns?: string) => FilaMock
  eq: (column: string, value: string) => FilaMock
  single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
  insert: (values: Record<string, unknown>) => FilaMock
  then: <T>(onfulfilled?: (value: unknown) => T) => Promise<T>
}

function crearFila(selectData: Record<string, unknown> | null, selectError: { message: string } | null): FilaMock {
  const mock: FilaMock = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    single: vi.fn().mockResolvedValue({ data: selectData, error: selectError }),
    insert: vi.fn(() => mock),
    then: vi.fn((onfulfilled) => Promise.resolve(onfulfilled?.({ data: selectData, error: selectError }))),
  }
  return mock
}

function crearSupabaseMock(
  mascota: Record<string, unknown> | null,
  catalogo: Record<string, unknown> | null,
  veterinario: Record<string, unknown> | null,
  vacunaInsertada: Record<string, unknown> | null,
) {
  const mascotaMock = crearFila(mascota, mascota ? null : { message: "Not found" })
  const catalogoMock = crearFila(catalogo, catalogo ? null : { message: "Not found" })
  const vetMock = crearFila(veterinario, veterinario ? null : { message: "Not found" })

  const insertable = {
    ...crearFila(null, null),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: vacunaInsertada, error: vacunaInsertada ? null : { message: "Error" } }),
      })),
    })),
  }

  mockCliente.mockResolvedValue({
    from: (table: string) => {
      if (table === "mascotas") return mascotaMock
      if (table === "catalogo_vacunas") return catalogoMock
      if (table === "usuarios") return vetMock
      if (table === "vacunas") return insertable
      return crearFila(null, { message: "Not found" })
    },
  })
}

describe("registrarVacuna", () => {
  beforeEach(() => {
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
    mockPermiso.mockReturnValue(true)
  })

  // 1. Sin sesión
  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "No autorizado" })
  })

  // 2. Usuario no encontrado
  it("rechaza usuario no encontrado", async () => {
    mockUsuario.mockResolvedValue(null)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Usuario no encontrado" })
  })

  // 3. Permiso denegado
  it("rechaza permiso denegado", async () => {
    mockPermiso.mockReturnValue(false)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Permiso denegado" })
  })

  // 4. Validación falla (Zod)
  it("rechaza datos invalidos", async () => {
    const fd = crearFormData({ mascota_id: "no-es-uuid", catalogo_vacuna_id: CATALOGO_ID, fecha_aplicacion: HOY, veterinario_id: VETERINARIO_ID })
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Datos inválidos" })
  })

  // 5. Fecha futura
  it("rechaza fecha futura", async () => {
    const manana = new Date()
    manana.setDate(manana.getDate() + 5)
    const fd = crearFormData({ ...INPUT_VALIDO, fecha_aplicacion: manana.toISOString().split("T")[0] })
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "La fecha de aplicación no puede ser futura" })
  })

  // 6. Fecha próxima dosis <= fecha aplicación
  it("rechaza fecha proxima dosis invalida", async () => {
    const fd = crearFormData({ ...INPUT_VALIDO, fecha_proxima_dosis: "2020-01-01" })
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "La próxima dosis debe ser posterior a la fecha de aplicación" })
  })

  // 7. Mascota no encontrada
  it("rechaza mascota no encontrada", async () => {
    crearSupabaseMock(null, null, null, null)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Mascota no encontrada" })
  })

  // 8. Mascota inactiva
  it("rechaza mascota inactiva", async () => {
    crearSupabaseMock(
      { id: MASCOTA_ID, activo: false, especie_id: "especie-perro", clinic_id: "clinic-1" },
      null, null, null,
    )
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "La mascota no está activa" })
  })

  // 9. Especie incompatible
  it("rechaza especie incompatible", async () => {
    crearSupabaseMock(
      { id: MASCOTA_ID, activo: true, especie_id: "especie-gato", clinic_id: "clinic-1" },
      { id: CATALOGO_ID, nombre: "Antirrábica canina", especie_id: "especie-perro" },
      null, null,
    )
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Esta vacuna no es compatible con la especie de la mascota" })
  })

  // 10. "Otra" sin nombre_personalizado
  it("rechaza otra sin nombre personalizado", async () => {
    crearSupabaseMock(
      { id: MASCOTA_ID, activo: true, especie_id: "especie-perro", clinic_id: "clinic-1" },
      { id: CATALOGO_OTRA_ID, nombre: "Otra", especie_id: null },
      null, null,
    )
    const fd = crearFormData({ ...INPUT_VALIDO, catalogo_vacuna_id: CATALOGO_OTRA_ID })
    const resultado = await registrarVacuna(fd)
    expect(resultado).toEqual({ success: false, error: "Debes especificar el nombre de la vacuna" })
  })

  // 11. Registro exitoso con catálogo estándar
  it("registra vacuna exitosamente", async () => {
    crearSupabaseMock(
      { id: MASCOTA_ID, activo: true, especie_id: "especie-perro", clinic_id: "clinic-1" },
      { id: CATALOGO_ID, nombre: "Múltiple canina", especie_id: "especie-perro" },
      { id: VETERINARIO_ID, clinic_id: "clinic-1" },
      { id: "vac-1", fecha_aplicacion: HOY },
    )
    const fd = crearFormData({ ...INPUT_VALIDO, lote: "LOTE-001", observaciones: "Primera dosis" })
    const resultado = await registrarVacuna(fd)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.id).toBe("vac-1")
      expect(resultado.data.nombre_vacuna).toBe("Múltiple canina")
      expect(resultado.data.fecha_aplicacion).toBe(HOY)
    }
  })

  // 12. Registro exitoso con "Otra" + nombre_personalizado
  it("registra vacuna personalizada exitosamente", async () => {
    crearSupabaseMock(
      { id: MASCOTA_ID, activo: true, especie_id: "especie-perro", clinic_id: "clinic-1" },
      { id: CATALOGO_OTRA_ID, nombre: "Otra", especie_id: null },
      { id: VETERINARIO_ID, clinic_id: "clinic-1" },
      { id: "vac-2", fecha_aplicacion: HOY },
    )
    const fd = crearFormData({ ...INPUT_VALIDO, catalogo_vacuna_id: CATALOGO_OTRA_ID, nombre_personalizado: "Vacuna experimental" })
    const resultado = await registrarVacuna(fd)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.nombre_vacuna).toBe("Vacuna experimental")
    }
  })
})
