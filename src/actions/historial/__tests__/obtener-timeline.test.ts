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

import { obtenerTimeline } from "../obtener-timeline"

interface FilaMock extends PromiseLike<{ data: Record<string, unknown>[] | null; error: null }> {
  from: (table: string) => FilaMock
  select: (columns?: string) => FilaMock
  eq: (column: string, value: string) => FilaMock
  filter: (column: string, operator: string, value: string) => FilaMock
  in: (column: string, values: string[]) => FilaMock
  order: (column: string, opts?: { ascending: boolean }) => FilaMock
}

type Resolved = { data: Record<string, unknown>[] | null; error: null }

function crearFila(resolvedValue: Resolved): FilaMock {
  const mock: FilaMock = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    filter: vi.fn(() => mock),
    in: vi.fn(() => mock),
    order: vi.fn(() => mock),
    then<TResult1 = Resolved, TResult2 = never>(
      onfulfilled?: ((value: Resolved) => TResult1 | PromiseLike<TResult1>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      return Promise.resolve(resolvedValue).then(onfulfilled ?? undefined) as PromiseLike<TResult1 | TResult2>
    },
  }
  return mock
}

const USUARIO_MOCK = { id: "user-1", clinic_id: "clinic-1", rol: "vet", nombre: "Dr. Test" }
const SESION_MOCK = { user: { id: "user-1" } }

const MASCOTA_ID = "00000000-0000-0000-0000-000000000010"

const USUARIO_NOMBRE = "Dr. Test"
const USUARIO_ID = "user-1"

const HISTORIAL_MOCK = [
  {
    id: "hist-1",
    tipo: "consulta",
    fecha: "2026-06-18",
    diagnostico: "Paciente presenta dolor abdominal agudo con vómito",
    tratamiento: "Administrar antiinflamatorio cada 12h por 5 días",
    notas: "Traer a revisión en una semana",
    created_by: USUARIO_ID,
    created_at: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "hist-2",
    tipo: "cirugia",
    fecha: "2026-06-15",
    diagnostico: "Luxación patelar grado II en pata trasera derecha",
    tratamiento: "Reposo absoluto 2 semanas, fisioterapia después",
    notas: null,
    created_by: USUARIO_ID,
    created_at: "2026-06-15T14:00:00.000Z",
  },
]

const VACUNA_MOCK = [
  {
    id: "vac-1",
    tipo_vacuna_id: "v01",
    nombre_personalizado: null,
    lote: "LOTE-001",
    observaciones: "Primera dosis del esquema",
    fecha_aplicacion: "2026-06-10",
    fecha_proxima_dosis: "2026-07-10",
    recordatorio_enviado: 0,
    aplicado_por: USUARIO_ID,
    created_at: "2026-06-10T09:00:00.000Z",
  },
  {
    id: "vac-2",
    tipo_vacuna_id: "v02",
    nombre_personalizado: "Vacuna personalizada experimental",
    lote: null,
    observaciones: null,
    fecha_aplicacion: "2026-05-01",
    fecha_proxima_dosis: null,
    recordatorio_enviado: 0,
    aplicado_por: USUARIO_ID,
    created_at: "2026-05-01T10:00:00.000Z",
  },
]

const CATALOGO_MOCK = [
  { id: "v01", nombre: "Múltiple canina" },
  { id: "v02", nombre: "Otra" },
]

const USUARIOS_MOCK = [
  { id: USUARIO_ID, nombre: USUARIO_NOMBRE },
]

// ─── Helpers ───────────────────────────────

function crearClientesMock(
  historial: Record<string, unknown>[] | null,
  vacunas: Record<string, unknown>[] | null,
  usuarios: Record<string, unknown>[] | null,
  catalogo: Record<string, unknown>[] | null,
) {
  const historialMock = crearFila({ data: historial, error: null })
  const vacunaMock = crearFila({ data: vacunas, error: null })
  const usuariosMock = crearFila({ data: usuarios, error: null })
  const catalogoMock = crearFila({ data: catalogo, error: null })

  mockCliente.mockResolvedValue({
    from: (table: string) => {
      if (table === "historial_medico") return historialMock
      if (table === "vacunas") return vacunaMock
      if (table === "usuarios") return usuariosMock
      if (table === "catalogo_vacunas") return catalogoMock
      return crearFila({ data: [], error: null })
    },
  })
}

// ─── Tests ─────────────────────────────────

describe("obtenerTimeline", () => {
  beforeEach(() => {
    mockSesion.mockResolvedValue(SESION_MOCK)
    mockUsuario.mockResolvedValue(USUARIO_MOCK)
    mockPermiso.mockReturnValue(true)
  })

  // 1. Sin sesión
  it("rechaza sin sesion", async () => {
    mockSesion.mockResolvedValue(null)
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toEqual({ success: false, error: "No autorizado" })
  })

  // 2. Usuario no encontrado
  it("rechaza usuario no encontrado", async () => {
    mockUsuario.mockResolvedValue(null)
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toEqual({ success: false, error: "Usuario no encontrado" })
  })

  // 3. Permiso denegado
  it("rechaza permiso denegado", async () => {
    mockPermiso.mockReturnValue(false)
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toEqual({ success: false, error: "Permiso denegado" })
  })

  // 4. MascotaId inválido
  it("rechaza mascotaId invalido", async () => {
    const resultado = await obtenerTimeline("abc")
    expect(resultado).toEqual({ success: false, error: "Mascota inválida" })
  })

  // 5. Timeline vacío
  it("retorna timeline vacio cuando no hay eventos", async () => {
    crearClientesMock([], [], [], [])
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.eventos).toHaveLength(0)
      expect(resultado.data.total).toBe(0)
      expect(resultado.data.tieneMas).toBe(false)
    }
  })

  // 6. Merge historial + vacunas ordenado por fecha
  it("mezcla historial y vacunas ordenado por fecha descendente", async () => {
    crearClientesMock(HISTORIAL_MOCK, VACUNA_MOCK, USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.eventos).toHaveLength(4)
      expect(resultado.data.total).toBe(4)

      // Orden: 2026-06-18, 2026-06-15, 2026-06-10
      expect(resultado.data.eventos[0].fecha).toBe("2026-06-18")
      expect(resultado.data.eventos[0].tipo).toBe("consulta")
      expect(resultado.data.eventos[1].fecha).toBe("2026-06-15")
      expect(resultado.data.eventos[1].tipo).toBe("cirugia")
      expect(resultado.data.eventos[2].fecha).toBe("2026-06-10")
      expect(resultado.data.eventos[2].tipo).toBe("vacuna")
    }
  })

  // 7. Tipos y metadata correctos
  it("mapea correctamente tipos y metadata", async () => {
    crearClientesMock(HISTORIAL_MOCK, VACUNA_MOCK, USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      const consulta = resultado.data.eventos[0]
      expect(consulta.tipo).toBe("consulta")
      expect(consulta.titulo).toBe("Consulta")
      expect(consulta.resumen).toBe(HISTORIAL_MOCK[0].diagnostico)
      expect(consulta.metadata.diagnostico).toBe(HISTORIAL_MOCK[0].diagnostico)
      expect(consulta.metadata.tratamiento).toBe(HISTORIAL_MOCK[0].tratamiento)
      expect(consulta.metadata.created_by_name).toBe(USUARIO_NOMBRE)

      const cirugia = resultado.data.eventos[1]
      expect(cirugia.tipo).toBe("cirugia")
      expect(cirugia.titulo).toBe("Cirugía")

      const vacuna = resultado.data.eventos[2]
      expect(vacuna.tipo).toBe("vacuna")
      expect(vacuna.titulo).toBe("Múltiple canina")
      expect(vacuna.resumen).toBe("Múltiple canina")
      expect(vacuna.metadata.nombre_vacuna).toBe("Múltiple canina")
      expect(vacuna.metadata.lote).toBe("LOTE-001")
      expect(vacuna.metadata.aplicado_por_name).toBe(USUARIO_NOMBRE)
    }
  })

  // 8. Vacunas nunca son editables
  it("marca vacunas como no editables", async () => {
    crearClientesMock(HISTORIAL_MOCK, VACUNA_MOCK, USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      const vacuna = resultado.data.eventos.find((e) => e.tipo === "vacuna")
      expect(vacuna?.editable).toBe(false)
    }
  })

  // 9. Paginación
  it("respeta paginacion con porPagina", async () => {
    crearClientesMock(HISTORIAL_MOCK, VACUNA_MOCK, USUARIOS_MOCK, CATALOGO_MOCK)

    const pagina1 = await obtenerTimeline(MASCOTA_ID, 1, 2)
    expect(pagina1).toHaveProperty("success", true)
    if (pagina1.success) {
      expect(pagina1.data.eventos).toHaveLength(2)
      expect(pagina1.data.total).toBe(4)
      expect(pagina1.data.tieneMas).toBe(true)
    }

    const pagina2 = await obtenerTimeline(MASCOTA_ID, 2, 2)
    expect(pagina2).toHaveProperty("success", true)
    if (pagina2.success) {
      expect(pagina2.data.eventos).toHaveLength(2)
      expect(pagina2.data.total).toBe(4)
      expect(pagina2.data.tieneMas).toBe(false)
    }
  })

  // 10. Historial reciente es editable con permiso
  it("marca historial reciente como editable cuando tiene permiso", async () => {
    const ahora = new Date().toISOString()
    const historialReciente = [
      {
        id: "hist-reciente",
        tipo: "consulta",
        fecha: "2026-06-18",
        diagnostico: "Diagnóstico de prueba con más de diez caracteres",
        tratamiento: "Tratamiento",
        notas: null,
        created_by: USUARIO_ID,
        created_at: ahora,
      },
    ]
    crearClientesMock(historialReciente, [], USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.eventos[0].editable).toBe(true)
    }
  })

  // 11. Historial antiguo no es editable
  it("marca historial antiguo como no editable", async () => {
    const anioPasado = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // >24h
    const historialAntiguo = [
      {
        id: "hist-antiguo",
        tipo: "consulta",
        fecha: "2026-06-01",
        diagnostico: "Diagnóstico de prueba con más de diez caracteres",
        tratamiento: "Tratamiento",
        notas: null,
        created_by: USUARIO_ID,
        created_at: anioPasado,
      },
    ]
    crearClientesMock(historialAntiguo, [], USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.eventos[0].editable).toBe(false)
    }
  })

  // 13. Filtro por búsqueda de texto
  it("filtra eventos por busqueda de texto", async () => {
    crearClientesMock(HISTORIAL_MOCK, VACUNA_MOCK, USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID, 1, 20, "dolor")
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.eventos).toHaveLength(1)
      expect(resultado.data.eventos[0].id).toBe("hist-1")
      expect(resultado.data.total).toBe(1)
    }
  })

  // 14. Filtro por fecha desde
  it("filtra eventos desde una fecha", async () => {
    crearClientesMock(HISTORIAL_MOCK, VACUNA_MOCK, USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID, 1, 20, undefined, "2026-06-12")
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.eventos).toHaveLength(2)
      expect(resultado.data.eventos[0].id).toBe("hist-1")
      expect(resultado.data.eventos[1].id).toBe("hist-2")
      expect(resultado.data.total).toBe(2)
    }
  })

  // 15. Filtro por fecha hasta
  it("filtra eventos hasta una fecha", async () => {
    crearClientesMock(HISTORIAL_MOCK, VACUNA_MOCK, USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID, 1, 20, undefined, undefined, "2026-06-12")
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.eventos).toHaveLength(2)
      expect(resultado.data.eventos[0].id).toBe("vac-1")
      expect(resultado.data.total).toBe(2)
    }
  })

  // 16. Búsqueda sin resultados
  it("retorna vacio cuando busqueda no coincide", async () => {
    crearClientesMock(HISTORIAL_MOCK, VACUNA_MOCK, USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID, 1, 20, "xyz123")
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.eventos).toHaveLength(0)
      expect(resultado.data.total).toBe(0)
    }
  })

  // 12. Historial editable requiere permiso editar (renumerado)
  it("no marca editable si no tiene permiso de editar", async () => {
    mockPermiso.mockImplementation((_rol: string, modulo: string, _accion: string) => {
      if (modulo === "historial" && _accion === "editar") return false
      return true
    })

    const ahora = new Date().toISOString()
    const historialReciente = [
      {
        id: "hist-reciente",
        tipo: "consulta",
        fecha: "2026-06-18",
        diagnostico: "Diagnóstico de prueba con más de diez caracteres",
        tratamiento: null,
        notas: null,
        created_by: USUARIO_ID,
        created_at: ahora,
      },
    ]
    crearClientesMock(historialReciente, [], USUARIOS_MOCK, CATALOGO_MOCK)
    const resultado = await obtenerTimeline(MASCOTA_ID)
    expect(resultado).toHaveProperty("success", true)
    if (resultado.success) {
      expect(resultado.data.eventos[0].editable).toBe(false)
    }
  })
})
