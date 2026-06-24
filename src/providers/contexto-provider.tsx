"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
import type { ClinicMembershipConClinica } from "@/types/models"

export interface ContextoActivo {
  tipo: "personal" | "clinic"
  clinicId?: string
  clinicNombre?: string
}

interface ContextoType {
  contextoActivo: ContextoActivo
  setContextoActivo: (ctx: ContextoActivo) => void
  clinicaNombre: string
  usuarioRol: string
  usuarioNombre: string
  membresias: ClinicMembershipConClinica[]
  clinicasStaff: { id: string; nombre: string }[]
}

const ContextoContext = createContext<ContextoType | null>(null)

const STORAGE_KEY = "vetyx-contexto"

export function ContextoProvider({
  clinicaId,
  clinicaNombre,
  usuarioRol,
  usuarioNombre,
  membresias = [],
  children,
}: {
  clinicaId?: string
  clinicaNombre: string
  usuarioRol: string
  usuarioNombre: string
  membresias?: ClinicMembershipConClinica[]
  children: React.ReactNode
}) {
  const clinicasStaff = useMemo(
    () => membresias.filter((m) => m.tipo === "staff").map((m) => ({ id: m.clinic_id, nombre: m.clinica_nombre })),
    [membresias],
  )

  const clinicaInicial = clinicaId ?? clinicasStaff[0]?.id
  const nombreInicial = clinicaNombre || clinicasStaff[0]?.nombre || ""

  const [contextoActivo, setState] = useState<ContextoActivo>({
    tipo: clinicasStaff.length > 0 ? "clinic" : "personal",
    clinicId: clinicaInicial,
    clinicNombre: nombreInicial,
  })

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (guardado === "personal" || guardado === "clinic") {
      const ctx: ContextoActivo = guardado === "clinic" && clinicaInicial
        ? { tipo: "clinic", clinicId: clinicaInicial, clinicNombre: nombreInicial }
        : { tipo: guardado }
      setState(ctx)
    }
  }, [clinicaInicial, nombreInicial])

  const setContextoActivo = useCallback((ctx: ContextoActivo) => {
    setState(ctx)
    localStorage.setItem(STORAGE_KEY, ctx.tipo)
  }, [])

  const currentNombre = contextoActivo.tipo === "clinic"
    ? contextoActivo.clinicNombre ?? nombreInicial
    : ""

  return (
    <ContextoContext.Provider
      value={{
        contextoActivo,
        setContextoActivo,
        clinicaNombre: currentNombre,
        usuarioRol,
        usuarioNombre,
        membresias,
        clinicasStaff,
      }}
    >
      {children}
    </ContextoContext.Provider>
  )
}

export function useContexto() {
  const context = useContext(ContextoContext)
  if (!context) {
    throw new Error("useContexto debe usarse dentro de ContextoProvider")
  }
  return context
}
