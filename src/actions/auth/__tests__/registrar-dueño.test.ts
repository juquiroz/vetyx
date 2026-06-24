import { describe, it, expect, vi, beforeEach } from "vitest"

const mockAdminCliente = vi.hoisted(() => vi.fn())
const mockLimpiarCacheSesion = vi.hoisted(() => vi.fn())
const mockLimpiarCacheUsuario = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/admin", () => ({ crearClienteAdmin: mockAdminCliente }))
vi.mock("@/lib/auth/get-session", () => ({ limpiarCacheSesion: mockLimpiarCacheSesion }))
vi.mock("@/lib/auth/get-current-user", () => ({ limpiarCacheUsuario: mockLimpiarCacheUsuario }))

import { registrarDueno } from "../registrar-dueño"

const ID_USUARIO = "user-123"
const ID_CLINICA = "clinic-456"

interface AdminMock {
  auth: {
    admin: {
      createUser: ReturnType<typeof vi.fn>
      generateLink: ReturnType<typeof vi.fn>
      deleteUser: ReturnType<typeof vi.fn>
    }
  }
  from: ReturnType<typeof vi.fn>
}

function crearAdminMock(fallaEn?: string): AdminMock {
  const clinicas: Record<string, ReturnType<typeof vi.fn>> = {} as Record<string, ReturnType<typeof vi.fn>>
  const usuarios: Record<string, ReturnType<typeof vi.fn>> = {} as Record<string, ReturnType<typeof vi.fn>>
  const duenos: Record<string, ReturnType<typeof vi.fn>> = {} as Record<string, ReturnType<typeof vi.fn>>

  const admin: AdminMock = {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue(
          fallaEn === "authUser"
            ? { data: null, error: { message: "Error al crear usuario" } }
            : { data: { user: { id: ID_USUARIO } }, error: null }
        ),
        generateLink: vi.fn().mockResolvedValue(
          fallaEn === "link"
            ? { data: null, error: { message: "Error al generar enlace" } }
            : { data: { properties: { email_otp: "123456" } }, error: null }
        ),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    from: vi.fn(() => ({})),
  }

  clinicas.insert = vi.fn((_values: Record<string, unknown>) => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(
        fallaEn === "clinica"
          ? { data: null, error: { message: "Error al crear clínica" } }
          : { data: { id: ID_CLINICA }, error: null }
      ),
    })),
  }))
  clinicas.delete = vi.fn(() => ({ eq: vi.fn(() => clinicas) }))
  clinicas.eq = vi.fn(() => clinicas)

  usuarios.insert = vi.fn().mockResolvedValue(
    fallaEn === "usuario"
      ? { error: { message: "Error al crear usuario" } }
      : { error: null }
  )
  usuarios.delete = vi.fn(() => ({ eq: vi.fn(() => usuarios) }))
  usuarios.eq = vi.fn(() => usuarios)

  duenos.insert = vi.fn().mockResolvedValue(
    fallaEn === "dueno"
      ? { error: { message: "Error al crear dueño" } }
      : { error: null }
  )

  admin.from = vi.fn((tabla: string) => {
    if (tabla === "clinicas") return clinicas
    if (tabla === "usuarios") return usuarios
    if (tabla === "duenos") return duenos
    return {}
  })

  return admin
}

function formData(overrides?: Record<string, string>) {
  const fd = new FormData()
  fd.set("email", "test@example.com")
  fd.set("nombre", "Juan Pérez")
  fd.set("telefono", "555-123-4567")
  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      fd.set(k, v)
    }
  }
  return fd
}

describe("registrarDueno", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "token-123", refresh_token: "refresh-456" }),
    }))
  })

  it("rechaza email inválido", async () => {
    const res = await registrarDueno(formData({ email: "invalido" }))
    expect(res).toHaveProperty("error", "Datos inválidos")
  })

  it("rechaza nombre vacío", async () => {
    const res = await registrarDueno(formData({ nombre: "" }))
    expect(res).toHaveProperty("error", "Datos inválidos")
  })

  it("rechaza teléfono vacío", async () => {
    const res = await registrarDueno(formData({ telefono: "" }))
    expect(res).toHaveProperty("error", "Datos inválidos")
  })

  it("rechaza si falla crear usuario auth", async () => {
    mockAdminCliente.mockReturnValue(crearAdminMock("authUser"))
    const res = await registrarDueno(formData())
    expect(res).toHaveProperty("error", "Error al crear usuario")
  })

  it("rechaza si falla crear usuario y elimina auth", async () => {
    const admin = crearAdminMock("usuario")
    mockAdminCliente.mockReturnValue(admin)
    const res = await registrarDueno(formData())
    expect(res).toHaveProperty("error", "Error al crear usuario")
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith(ID_USUARIO)
  })

  it("rechaza si falla crear dueño y elimina usuario + auth", async () => {
    const admin = crearAdminMock("dueno")
    mockAdminCliente.mockReturnValue(admin)
    const res = await registrarDueno(formData())
    expect(res).toHaveProperty("error", "Error al crear dueño")
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith(ID_USUARIO)
  })

  it("rechaza si falla generar enlace", async () => {
    const admin = crearAdminMock("link")
    mockAdminCliente.mockReturnValue(admin)
    const res = await registrarDueno(formData())
    expect(res).toHaveProperty("error", "Error al generar enlace")
  })

  it("rechaza si falla verify OTP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "OTP inválido",
    }))
    mockAdminCliente.mockReturnValue(crearAdminMock(undefined))
    const res = await registrarDueno(formData())
    expect(res).toHaveProperty("error")
    expect(res.error).toContain("Error al verificar")
  })

  it("registra dueño exitosamente", async () => {
    mockAdminCliente.mockReturnValue(crearAdminMock(undefined))
    const res = await registrarDueno(formData())
    expect(res).toEqual({
      success: true,
      accessToken: "token-123",
      refreshToken: "refresh-456",
    })
    expect(mockLimpiarCacheSesion).toHaveBeenCalled()
    expect(mockLimpiarCacheUsuario).toHaveBeenCalledWith(ID_USUARIO)
  })

  it("crea usuario sin clínica (clinic_id = null)", async () => {
    const admin = crearAdminMock(undefined)
    mockAdminCliente.mockReturnValue(admin)
    await registrarDueno(formData())
    expect(admin.from).toHaveBeenCalledWith("usuarios")
    expect(admin.from).not.toHaveBeenCalledWith("clinicas")
  })

  it("crea usuario con rol dueño", async () => {
    const admin = crearAdminMock(undefined)
    mockAdminCliente.mockReturnValue(admin)
    await registrarDueno(formData())
    expect(admin.from).toHaveBeenCalledWith("usuarios")
  })

  it("crea dueño vinculado al usuario auth", async () => {
    const admin = crearAdminMock(undefined)
    mockAdminCliente.mockReturnValue(admin)
    await registrarDueno(formData())
    expect(admin.from).toHaveBeenCalledWith("duenos")
  })
})
