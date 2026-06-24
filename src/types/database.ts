export type Database = {
  public: {
    Tables: {
      clinicas: {
        Row: {
          id: string
          nombre: string
          slug: string
          email: string
          telefono: string | null
          direccion: string | null
          plan: string
          activo: boolean
          zona_horaria: string
          fecha_registro: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          slug: string
          email: string
          telefono?: string | null
          direccion?: string | null
          plan?: string
          activo?: boolean
          zona_horaria?: string
          fecha_registro?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          slug?: string
          email?: string
          telefono?: string | null
          direccion?: string | null
          plan?: string
          activo?: boolean
          zona_horaria?: string
          fecha_registro?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          clinic_id: string | null
          email: string
          nombre: string
          rol: string
          telefono: string | null
          activo: boolean
          ultimo_acceso: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          clinic_id: string | null
          email: string
          nombre: string
          rol: string
          telefono?: string | null
          activo?: boolean
          ultimo_acceso?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          email?: string
          nombre?: string
          rol?: string
          telefono?: string | null
          activo?: boolean
          ultimo_acceso?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      duenos: {
        Row: {
          id: string
          clinic_id: string | null
          cedula: string | null
          nombre: string
          telefono: string
          email: string | null
          direccion: string | null
          activo: boolean
          user_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string | null
          cedula?: string | null
          nombre: string
          telefono: string
          email?: string | null
          direccion?: string | null
          activo?: boolean
          user_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          cedula?: string | null
          nombre?: string
          telefono?: string
          email?: string | null
          direccion?: string | null
          activo?: boolean
          user_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      especies: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          created_at?: string
        }
        Relationships: []
      }
      mascotas: {
        Row: {
          id: string
          clinic_id: string | null
          owner_id: string
          especie_id: string
          nombre: string
          raza: string | null
          fecha_nacimiento: string | null
          color: string | null
          peso: number | null
          sexo: string
          esterilizado: boolean
          activo: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string | null
          owner_id: string
          especie_id: string
          nombre: string
          raza?: string | null
          fecha_nacimiento?: string | null
          color?: string | null
          peso?: number | null
          sexo?: string
          esterilizado?: boolean
          activo?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          owner_id?: string
          especie_id?: string
          nombre?: string
          raza?: string | null
          fecha_nacimiento?: string | null
          color?: string | null
          peso?: number | null
          sexo?: string
          esterilizado?: boolean
          activo?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      citas: {
        Row: {
          id: string
          clinic_id: string | null
          mascota_id: string
          veterinario_id: string
          fecha_hora: string
          duracion_minutos: number
          rango_horario: string
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
        Insert: {
          id?: string
          clinic_id: string | null
          mascota_id: string
          veterinario_id: string
          fecha_hora: string
          duracion_minutos: number
          motivo: string
          estado?: string
          monto?: number | null
          notas_internas?: string | null
          observaciones?: string | null
          motivo_cancelacion?: string | null
          created_by: string
          completed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          mascota_id?: string
          veterinario_id?: string
          fecha_hora?: string
          duracion_minutos?: number
          motivo?: string
          estado?: string
          monto?: number | null
          notas_internas?: string | null
          observaciones?: string | null
          motivo_cancelacion?: string | null
          created_by?: string
          completed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      historial_medico: {
        Row: {
          id: string
          clinic_id: string | null
          mascota_id: string
          tipo: string
          fecha: string
          diagnostico: string
          tratamiento: string | null
          notas: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string | null
          mascota_id: string
          tipo: string
          fecha: string
          diagnostico: string
          tratamiento?: string | null
          notas?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          mascota_id?: string
          tipo?: string
          fecha?: string
          diagnostico?: string
          tratamiento?: string | null
          notas?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalogo_vacunas: {
        Row: {
          id: string
          nombre: string
          especie_id: string | null
          dosis_tipica: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          especie_id?: string | null
          dosis_tipica?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          especie_id?: string | null
          dosis_tipica?: string | null
          created_at?: string
        }
        Relationships: []
      }
      vacunas: {
        Row: {
          id: string
          clinic_id: string | null
          mascota_id: string
          tipo_vacuna_id: string
          nombre_personalizado: string | null
          lote: string | null
          fecha_aplicacion: string
          fecha_proxima_dosis: string | null
          observaciones: string | null
          recordatorio_enviado: number
          aplicado_por: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string | null
          mascota_id: string
          tipo_vacuna_id: string
          nombre_personalizado?: string | null
          lote?: string | null
          fecha_aplicacion: string
          fecha_proxima_dosis?: string | null
          observaciones?: string | null
          recordatorio_enviado?: number
          aplicado_por: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          mascota_id?: string
          tipo_vacuna_id?: string
          nombre_personalizado?: string | null
          lote?: string | null
          fecha_aplicacion?: string
          fecha_proxima_dosis?: string | null
          observaciones?: string | null
          recordatorio_enviado?: number
          aplicado_por?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinic_memberships: {
        Row: {
          id: string
          clinic_id: string
          user_id: string
          tipo: string
          rol: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          user_id: string
          tipo: string
          rol?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          user_id?: string
          tipo?: string
          rol?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
