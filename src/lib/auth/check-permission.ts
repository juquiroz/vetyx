const PERMISOS = {
  admin: {
    duenos: ["crear", "editar", "desactivar", "ver"],
    mascotas: ["crear", "editar", "desactivar", "ver"],
    citas: ["crear", "editar", "cancelar", "completar", "marcar-no-show", "ver"],
    historial: ["crear", "editar", "ver"],
    vacunas: ["crear", "editar", "ver"],
    usuarios: ["invitar", "cambiar-rol", "desactivar", "ver"],
    dashboard: ["ver-completo"],
    config: ["editar-clinica"],
  },
  vet: {
    duenos: ["ver"],
    mascotas: ["crear", "editar", "desactivar", "ver"],
    citas: ["completar", "ver"],
    historial: ["crear", "editar", "ver"],
    vacunas: ["crear", "editar", "ver"],
    dashboard: ["ver-parcial"],
    usuarios: [],
    config: [],
  },
  recepcionista: {
    duenos: ["crear", "editar", "ver"],
    mascotas: ["crear", "editar", "ver"],
    citas: ["crear", "editar", "cancelar", "marcar-no-show", "ver"],
    historial: ["ver"],
    vacunas: ["ver"],
    dashboard: [],
    usuarios: [],
    config: [],
  },
} as const

type Rol = keyof typeof PERMISOS
type Modulo = keyof (typeof PERMISOS)[Rol]

export function verificarPermiso(
  rol: string,
  modulo: string,
  accion: string
): boolean {
  const permisosRol = PERMISOS[rol as Rol]
  if (!permisosRol) return false

    const accionesModulo = permisosRol[modulo as Modulo]
  if (!accionesModulo) return false

  return (accionesModulo as readonly string[]).includes(accion)
}
