import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CrearCitaModal } from "../crear-cita-modal"
import type { ConflictoCita, SugerenciaSlot } from "@/actions/citas/verificar-disponibilidad"

const { mockPush, mockRefresh, mockToastSuccess, mockCrearCita, mockVerificarDisponibilidad, mockBuscarMascotas, mockObtenerVeterinarios, mockBuscarDuenos } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockCrearCita: vi.fn(),
  mockVerificarDisponibilidad: vi.fn(),
  mockBuscarMascotas: vi.fn(),
  mockObtenerVeterinarios: vi.fn(),
  mockBuscarDuenos: vi.fn(),
}))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush, refresh: mockRefresh }) }))
vi.mock("sonner", () => ({ toast: { success: mockToastSuccess } }))
vi.mock("@/actions/citas/crear", () => ({ crearCita: mockCrearCita }))
vi.mock("@/actions/citas/verificar-disponibilidad", () => ({ verificarDisponibilidad: mockVerificarDisponibilidad }))
vi.mock("@/actions/mascotas/buscar", () => ({ buscarMascotas: mockBuscarMascotas }))
vi.mock("@/actions/citas/obtener-veterinarios", () => ({ obtenerVeterinarios: mockObtenerVeterinarios }))
vi.mock("@/actions/duenos/buscar", () => ({ buscarDuenos: mockBuscarDuenos }))

const VETS = [
  { id: "vet-1", nombre: "Dr. Pérez", rol: "vet" },
  { id: "vet-2", nombre: "Dra. López", rol: "vet" },
]

const DUENOS = [
  { id: "d-1", cedula: "12345678", nombre: "Juan", telefono: "555-0101", email: "juan@test.com", activo: true },
]

function setupModal(props?: Partial<React.ComponentProps<typeof CrearCitaModal>>) {
  const onOpenChange = props?.onOpenChange ?? vi.fn()
  render(<CrearCitaModal abierto={true} onOpenChange={onOpenChange} {...props} />)
  return { onOpenChange }
}

async function seleccionarDueno(user: ReturnType<typeof userEvent.setup>) {
  const duenoInput = screen.getByPlaceholderText(/buscar dueño/i)
  await user.type(duenoInput, "Juan")
  await waitFor(() => expect(screen.getByText("Juan")).toBeDefined())
  await user.click(screen.getByText("Juan"))
}

describe("CrearCitaModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuscarMascotas.mockResolvedValue([])
    mockVerificarDisponibilidad.mockResolvedValue({ disponible: true, conflictos: [], sugerencias: [] })
    mockBuscarDuenos.mockResolvedValue([])
    mockObtenerVeterinarios.mockResolvedValue([])
    mockCrearCita.mockResolvedValue({ ok: false, error: "default" })
  })

  it("1. apertura: muestra modal con titulo y campos", async () => {
    mockObtenerVeterinarios.mockResolvedValue(VETS)
    setupModal()
    await waitFor(() => {
      expect(screen.getByText("Nueva cita")).toBeDefined()
      expect(screen.getByText(/agenda una consulta/i)).toBeDefined()
      expect(screen.getByRole("button", { name: /cancelar/i })).toBeDefined()
      expect(screen.getByRole("button", { name: /crear cita/i })).toBeDefined()
    })
  })

  it("2. cierre: llama onOpenChange con false al cancelar", async () => {
    mockObtenerVeterinarios.mockResolvedValue(VETS)
    const utils = setupModal()
    await waitFor(() => expect(mockObtenerVeterinarios).toHaveBeenCalled())
    await userEvent.setup().click(screen.getByRole("button", { name: /cancelar/i }))
    expect(utils.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("3. creacion exitosa: envia formulario y muestra toast", async () => {
    mockObtenerVeterinarios.mockResolvedValue(VETS)
    mockBuscarDuenos.mockResolvedValue(DUENOS)
    mockBuscarMascotas.mockResolvedValue([
      { id: "m-1", nombre: "Firulais", especie: "Perro", dueno_nombre: "Juan", dueno_id: "d-1", activo: true },
    ])
    mockVerificarDisponibilidad.mockResolvedValue({ disponible: true, conflictos: [], sugerencias: [] })
    mockCrearCita.mockResolvedValue({ ok: true, cita: { id: "c-1" }, mensaje: "Cita creada exitosamente" })

    setupModal({ veterinarioId: "vet-1" })
    const user = userEvent.setup()

    await waitFor(() => expect(screen.getByDisplayValue("Dr. Pérez")).toBeDefined())

    await seleccionarDueno(user)

    const mascotaInput = screen.getByPlaceholderText(/buscar mascota/i)
    await user.type(mascotaInput, "Firulais")
    await waitFor(() => expect(screen.getByText("Firulais")).toBeDefined())
    await user.click(screen.getByText("Firulais"))

    const fechaInput = screen.getByLabelText(/fecha/i)
    fireEvent.change(fechaInput, { target: { value: "2026-06-17" } })

    const horaInput = screen.getByLabelText(/hora/i)
    fireEvent.change(horaInput, { target: { value: "10:00" } })

    await user.click(screen.getByRole("button", { name: /crear cita/i }))

    await waitFor(() => {
      expect(mockCrearCita).toHaveBeenCalled()
      expect(mockToastSuccess).toHaveBeenCalledWith("Cita creada exitosamente")
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it("4. conflicto: muestra sugerencias cuando hay conflicto", async () => {
    const conflicto: ConflictoCita = {
      id: "c-conf",
      mascota_id: "m-2",
      fecha_hora: "2026-06-17T15:00:00.000Z",
      duracion_minutos: 30,
    }
    const sugerencia: SugerenciaSlot = { fecha_hora: "2026-06-17T16:00:00.000Z" }

    mockObtenerVeterinarios.mockResolvedValue(VETS)
    mockBuscarDuenos.mockResolvedValue(DUENOS)
    mockBuscarMascotas.mockResolvedValue([
      { id: "m-1", nombre: "Firulais", especie: "Perro", dueno_nombre: "Juan", dueno_id: "d-1", activo: true },
    ])
    mockVerificarDisponibilidad.mockResolvedValue({
      disponible: false,
      conflictos: [conflicto],
      sugerencias: [sugerencia],
    })

    const user = userEvent.setup()
    setupModal({ veterinarioId: "vet-1" })

    await waitFor(() => expect(screen.getByDisplayValue("Dr. Pérez")).toBeDefined())

    await seleccionarDueno(user)

    const mascotaInput = screen.getByPlaceholderText(/buscar mascota/i)
    await user.type(mascotaInput, "Firulais")
    await waitFor(() => expect(screen.getByText("Firulais")).toBeDefined())
    await user.click(screen.getByText("Firulais"))

    const fechaInput = screen.getByLabelText(/fecha/i)
    fireEvent.change(fechaInput, { target: { value: "2026-06-17" } })

    const horaInput = screen.getByLabelText(/hora/i)
    fireEvent.change(horaInput, { target: { value: "10:00" } })

    await waitFor(() => {
      expect(mockVerificarDisponibilidad).toHaveBeenCalled()
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(screen.getByText(/conflicto de horario/i)).toBeDefined()
    }, { timeout: 3000 })

    const dSug = new Date(sugerencia.fecha_hora)
    const hh = String(dSug.getHours()).padStart(2, "0")
    const mm = String(dSug.getMinutes()).padStart(2, "0")

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${hh}:${mm} hs`, "i"))).toBeDefined()
    }, { timeout: 3000 })
  })

  it("5. error: muestra error del servidor y permite reintentar", async () => {
    mockObtenerVeterinarios.mockResolvedValue(VETS)
    mockBuscarDuenos.mockResolvedValue(DUENOS)
    mockBuscarMascotas.mockResolvedValue([
      { id: "m-1", nombre: "Firulais", especie: "Perro", dueno_nombre: "Juan", dueno_id: "d-1", activo: true },
    ])
    mockVerificarDisponibilidad.mockResolvedValue({ disponible: true, conflictos: [], sugerencias: [] })
    mockCrearCita.mockResolvedValue({ ok: false, error: "Error del servidor" })

    setupModal({ veterinarioId: "vet-1" })
    const user = userEvent.setup()

    await waitFor(() => expect(screen.getByDisplayValue("Dr. Pérez")).toBeDefined())

    await seleccionarDueno(user)

    const mascotaInput = screen.getByPlaceholderText(/buscar mascota/i)
    await user.type(mascotaInput, "Firulais")
    await waitFor(() => expect(screen.getByText("Firulais")).toBeDefined())
    await user.click(screen.getByText("Firulais"))

    const fechaInput = screen.getByLabelText(/fecha/i)
    fireEvent.change(fechaInput, { target: { value: "2026-06-17" } })

    const horaInput = screen.getByLabelText(/hora/i)
    fireEvent.change(horaInput, { target: { value: "10:00" } })

    await user.click(screen.getByRole("button", { name: /crear cita/i }))

    await waitFor(() => {
      expect(screen.getByText("Error del servidor")).toBeDefined()
    })

    expect(screen.getAllByText("Dr. Pérez").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Firulais")).toBeDefined()
  })

  it("6. persistencia: datos se conservan tras error de servidor", async () => {
    mockObtenerVeterinarios.mockResolvedValue(VETS)
    mockBuscarDuenos.mockResolvedValue(DUENOS)
    mockBuscarMascotas.mockResolvedValue([
      { id: "m-1", nombre: "Firulais", especie: "Perro", dueno_nombre: "Juan", dueno_id: "d-1", activo: true },
    ])
    mockVerificarDisponibilidad.mockResolvedValue({ disponible: true, conflictos: [], sugerencias: [] })
    mockCrearCita.mockResolvedValue({ ok: false, error: "Error de prueba" })

    setupModal({ veterinarioId: "vet-1" })
    const user = userEvent.setup()

    await waitFor(() => expect(screen.getByDisplayValue("Dr. Pérez")).toBeDefined())

    await seleccionarDueno(user)

    const mascotaInput = screen.getByPlaceholderText(/buscar mascota/i)
    await user.type(mascotaInput, "Firulais")
    await waitFor(() => expect(screen.getByText("Firulais")).toBeDefined())
    await user.click(screen.getByText("Firulais"))

    const fechaInput = screen.getByLabelText(/fecha/i)
    fireEvent.change(fechaInput, { target: { value: "2026-06-17" } })

    const horaInput = screen.getByLabelText(/hora/i)
    fireEvent.change(horaInput, { target: { value: "10:00" } })

    await user.click(screen.getByRole("button", { name: /crear cita/i }))

    await waitFor(() => {
      expect(screen.getByText("Error de prueba")).toBeDefined()
    })

    expect(screen.getAllByText("Dr. Pérez").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Firulais")).toBeDefined()
  })
})
