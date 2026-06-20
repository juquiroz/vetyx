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

import { crearEvento } from "../crear-evento"

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

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "vet", nombre: "Dr. Test" }
const SESION_MOCK = { user: { id: "user-1" } }
const MASCOTA_ID = "00000000-0000-0000-0000-000000000010"

function crearFormData(valores: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(valores)) fd.set(k, v)
  return fd
}

const INPUT_VALIDO = {
  mascota_id: MASCOTA_ID,
  tipo: "consulta",
  fecha: new Date().toISOString().split("T")[0],
  diagnostico: "Paciente presenta dolor abdominal con vómito frecuente",
  tratamiento: "Antiinflamatorio cada 12h por 5 días",
  notas: "Traer a revisión en una semana",
}

describe("crearEvento", () => {
  beforeEach(() => {
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
    mockPermiso.mockReturnValue(true)
  })

  // 1. Sin sesión
  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearEvento(fd)
    expect(resultado).toEqual({ success: false, error: "No autorizado" })
  })

  // 2. Usuario no encontrado
  it("rechaza usuario no encontrado", async () => {
    mockUsuario.mockResolvedValue(null)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Usuario no encontrado" })
  })

  // 3. Permiso denegado
  it("rechaza permiso denegado", async () => {
    mockPermiso.mockReturnValue(false)
    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Permiso denegado" })
  })

  // 4. Validación Zod falla (diagnóstico corto)
  it("rechaza diagnostico corto", async () => {
    const fd = crearFormData({ ...INPUT_VALIDO, diagnostico: "corto" })
    const resultado = await crearEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Datos inválidos" })
  })

  // 5. Validación Zod falla (tipo inválido)
  it("rechaza tipo invalido", async () => {
    const fd = crearFormData({ ...INPUT_VALIDO, tipo: "invalido" })
    const resultado = await crearEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Datos inválidos" })
  })

  // 6. Fecha futura
  it("rechaza fecha futura", async () => {
    const manana = new Date()
    manana.setDate(manana.getDate() + 2)
    const fd = crearFormData({ ...INPUT_VALIDO, fecha: manana.toISOString().split("T")[0] })
    const resultado = await crearEvento(fd)
    expect(resultado).toEqual({ success: false, error: "La fecha no puede ser futura" })
  })

  // 7. Mascota no encontrada
  it("rechaza mascota no encontrada", async () => {
    const mascotaMock = crearFila(null, { message: "Not found" })
    mockCliente.mockResolvedValue({
      from: (table: string) => {
        if (table === "mascotas") return mascotaMock
        return crearFila(null, { message: "Not found" })
      },
    })

    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearEvento(fd)
    expect(resultado).toEqual({ success: false, error: "Mascota no encontrada" })
  })

  // 8. Tipos válidos
  it("acepta todos los tipos validos", async () => {
    const TIPOS = ["consulta", "cirugia", "hospitalizacion", "control", "procedimiento", "otro"]

    for (const tipo of TIPOS) {
      const eventoInsertado = {
        id: "evento-1",
        tipo,
        fecha: INPUT_VALIDO.fecha,
        diagnostico: INPUT_VALIDO.diagnostico,
        tratamiento: INPUT_VALIDO.tratamiento,
        notas: INPUT_VALIDO.notas,
        created_by: "user-1",
        created_at: new Date().toISOString(),
      }

      const supabaseMock = {
        from: (table: string) => {
          if (table === "mascotas") return crearFila({ id: MASCOTA_ID }, null)
          if (table === "historial_medico") {
            const insertable: Record<string, unknown> = {}
            return {
              ...crearFila(null, null),
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: eventoInsertado, error: null }),
                })),
              })),
            }
          }
          return crearFila(null, { message: "Not found" })
        },
      }
      mockCliente.mockResolvedValue(supabaseMock)

      const fd = crearFormData({ ...INPUT_VALIDO, tipo })
      const resultado = await crearEvento(fd)
      expect(resultado).toHaveProperty("success", true)
      if (resultado.success) {
        expect(resultado.data.tipo).toBe(tipo)
      }
    }
  })

  // 9. Éxito con datos completos
  it("crea evento exitosamente con todos los campos", async () => {
    const ahora = new Date().toISOString()
    const eventoInsertado = {
      id: "evento-1",
      tipo: "consulta",
      fecha: INPUT_VALIDO.fecha,
      diagnostico: INPUT_VALIDO.diagnostico,
      tratamiento: INPUT_VALIDO.tratamiento,
      notas: INPUT_VALIDO.notas,
      created_by: "user-1",
      created_at: ahora,
    }

    const mascotaMock = crearFila({ id: MASCOTA_ID }, null)
    const historialMock = {
      ...crearFila(null, null),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: eventoInsertado, error: null }),
        })),
      })),
    }

    mockCliente.mockResolvedValue({
      from: (table: string) => {
        if (table === "mascotas") return mascotaMock
        if (table === "historial_medico") return historialMock
        return crearFila(null, { message: "Not found" })
      },
    })

    const fd = crearFormData(INPUT_VALIDO)
    const resultado = await crearEvento(fd)

    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.id).toBe("evento-1")
      expect(resultado.data.tipo).toBe("consulta")
      expect(resultado.data.titulo).toBe("Consulta")
      expect(resultado.data.resumen).toBe(INPUT_VALIDO.diagnostico)
      expect(resultado.data.editable).toBe(true)
      expect(resultado.data.metadata.diagnostico).toBe(INPUT_VALIDO.diagnostico)
      expect(resultado.data.metadata.tratamiento).toBe(INPUT_VALIDO.tratamiento)
      expect(resultado.data.metadata.notas).toBe(INPUT_VALIDO.notas)
      expect(resultado.data.metadata.created_by_name).toBe("Dr. Test")
    }
  })
})
