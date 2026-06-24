import { describe, it, expect } from "vitest"
import { verificarPermiso } from "../check-permission"

describe("Dueño permissions", () => {
  it("puede ver dueños", () => {
    expect(verificarPermiso("dueño", "duenos", "ver")).toBe(true)
  })

  it("no puede crear dueños", () => {
    expect(verificarPermiso("dueño", "duenos", "crear")).toBe(false)
  })

  it("puede crear mascotas", () => {
    expect(verificarPermiso("dueño", "mascotas", "crear")).toBe(true)
  })

  it("puede editar mascotas", () => {
    expect(verificarPermiso("dueño", "mascotas", "editar")).toBe(true)
  })

  it("puede desactivar mascotas", () => {
    expect(verificarPermiso("dueño", "mascotas", "desactivar")).toBe(true)
  })

  it("puede ver mascotas", () => {
    expect(verificarPermiso("dueño", "mascotas", "ver")).toBe(true)
  })

  it("no puede crear citas", () => {
    expect(verificarPermiso("dueño", "citas", "crear")).toBe(false)
  })

  it("puede ver historial", () => {
    expect(verificarPermiso("dueño", "historial", "ver")).toBe(true)
  })

  it("puede ver vacunas", () => {
    expect(verificarPermiso("dueño", "vacunas", "ver")).toBe(true)
  })

  it("no puede gestionar usuarios", () => {
    expect(verificarPermiso("dueño", "usuarios", "invitar")).toBe(false)
    expect(verificarPermiso("dueño", "usuarios", "ver")).toBe(false)
  })

  it("no puede acceder a config", () => {
    expect(verificarPermiso("dueño", "config", "editar-clinica")).toBe(false)
  })
})
