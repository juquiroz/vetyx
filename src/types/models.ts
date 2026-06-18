import type { Database } from "./database"

type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type Clinica = Row<"clinicas">
export type Usuario = Row<"usuarios">
export type Dueno = Row<"duenos">
export type Especie = Row<"especies">
export type Mascota = Row<"mascotas">
export type Cita = Row<"citas">
export type HistorialMedico = Row<"historial_medico">
export type CatalogoVacuna = Row<"catalogo_vacunas">
export type Vacuna = Row<"vacunas">

export interface DuenoConMascotas extends Dueno {
  mascotas: Mascota[]
}

export interface MascotaConDueno extends Mascota {
  dueno: Dueno
  especie: Especie
}

export interface CitaBasica {
  id: string
  mascota_id: string
  fecha_hora: string
  duracion_minutos: number
}

export interface CitaConRelaciones extends Cita {
  mascota: MascotaConDueno
  veterinario: Usuario
}

export interface HistorialConUsuario extends HistorialMedico {
  usuario: Usuario
}

export interface VacunaConCatalogo extends Vacuna {
  catalogo_vacuna: CatalogoVacuna
  usuario: Usuario
}
