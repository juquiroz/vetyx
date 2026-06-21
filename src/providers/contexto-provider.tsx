"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"

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
}

const ContextoContext = createContext<ContextoType | null>(null)

const STORAGE_KEY = "vetyx-contexto"

export function ContextoProvider({
  clinicaId,
  clinicaNombre,
  usuarioRol,
  usuarioNombre,
  children,
}: {
  clinicaId?: string
  clinicaNombre: string
  usuarioRol: string
  usuarioNombre: string
  children: React.ReactNode
}) {
  const [contextoActivo, setState] = useState<ContextoActivo>({
    tipo: clinicaNombre ? "clinic" : "personal",
    clinicId: clinicaId,
    clinicNombre: clinicaNombre,
  })

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (guardado === "personal" || guardado === "clinic") {
      const ctx: ContextoActivo = guardado === "clinic" && clinicaId
        ? { tipo: "clinic", clinicId: clinicaId, clinicNombre: clinicaNombre }
        : { tipo: guardado }
      setState(ctx)
    }
  }, [])

  const setContextoActivo = useCallback((ctx: ContextoActivo) => {
    setState(ctx)
    localStorage.setItem(STORAGE_KEY, ctx.tipo)
  }, [])

  return (
    <ContextoContext.Provider value={{ contextoActivo, setContextoActivo, clinicaNombre, usuarioRol, usuarioNombre }}>
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
