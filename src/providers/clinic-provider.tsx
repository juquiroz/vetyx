"use client"

import { createContext, useContext } from "react"
import type { UsuarioActual } from "@/lib/auth/get-current-user"

interface ClinicContextType {
  usuario: UsuarioActual
}

const ClinicContext = createContext<ClinicContextType | null>(null)

export function ClinicProvider({
  usuario,
  children,
}: {
  usuario: UsuarioActual
  children: React.ReactNode
}) {
  return (
    <ClinicContext.Provider value={{ usuario }}>
      {children}
    </ClinicContext.Provider>
  )
}

export function useClinic() {
  const context = useContext(ClinicContext)
  if (!context) {
    throw new Error("useClinic debe usarse dentro de ClinicProvider")
  }
  return context
}
