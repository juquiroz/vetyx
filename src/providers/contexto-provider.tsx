"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
import type { ClinicMembershipConClinica } from "@/types/models"

export interface ContextoActivo {
  tipo: "personal" | "cliente" | "staff"
  clinicId?: string
  clinicNombre?: string
}

interface ContextoType {
  contextoActivo: ContextoActivo
  setContextoActivo: (ctx: ContextoActivo) => void
  clinicaNombre: string
  usuarioRol: string
  usuarioNombre: string
  usuarioEmail: string
  membresias: ClinicMembershipConClinica[]
  clinicasStaff: { id: string; nombre: string }[]
  clinicasCliente: { id: string; nombre: string }[]
}

const ContextoContext = createContext<ContextoType | null>(null)

const STORAGE_KEY = "vetyx-contexto"
const COOKIE_NAME = "vetyx_contexto"

function serializarContexto(tipo: string, clinicId?: string): string {
  return JSON.stringify({ tipo, clinicId })
}

function parsearContexto(raw: string | null): { tipo: string; clinicId?: string } | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    if (raw === "personal") return { tipo: "personal" }
    return null
  }
}

function setContextoCookie(tipo: string, clinicId?: string) {
  const valor = serializarContexto(tipo, clinicId)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(valor)}; path=/; max-age=${365 * 86400}; SameSite=Lax`
}

function elegirClinicaInicial(
  clinicasStaff: { id: string; nombre: string }[],
  clinicasCliente: { id: string; nombre: string }[],
  clinicaId?: string,
  clinicaNombre?: string,
): { id?: string; nombre?: string } {
  if (clinicaId) return { id: clinicaId, nombre: clinicaNombre }
  if (clinicasStaff.length > 0) return { id: clinicasStaff[0].id, nombre: clinicasStaff[0].nombre }
  if (clinicasCliente.length > 0) return { id: clinicasCliente[0].id, nombre: clinicasCliente[0].nombre }
  return {}
}

function tipoInicial(membresias: ClinicMembershipConClinica[]): "personal" | "cliente" | "staff" {
  if (membresias.some((m) => m.tipo === "staff")) return "staff"
  if (membresias.some((m) => m.tipo === "cliente")) return "cliente"
  return "personal"
}

export function ContextoProvider({
  clinicaId,
  clinicaNombre,
  usuarioRol,
  usuarioNombre,
  usuarioEmail,
  membresias = [],
  children,
}: {
  clinicaId?: string
  clinicaNombre: string
  usuarioRol: string
  usuarioNombre: string
  usuarioEmail: string
  membresias?: ClinicMembershipConClinica[]
  children: React.ReactNode
}) {
  const clinicasStaff = useMemo(
    () => membresias.filter((m) => m.tipo === "staff").map((m) => ({ id: m.clinic_id, nombre: m.clinica_nombre })),
    [membresias],
  )

  const clinicasCliente = useMemo(
    () => membresias.filter((m) => m.tipo === "cliente").map((m) => ({ id: m.clinic_id, nombre: m.clinica_nombre })),
    [membresias],
  )

  const inicial = elegirClinicaInicial(clinicasStaff, clinicasCliente, clinicaId, clinicaNombre)
  const tipoInit = tipoInicial(membresias)

  const [contextoActivo, setState] = useState<ContextoActivo>({
    tipo: tipoInit,
    clinicId: inicial.id,
    clinicNombre: inicial.nombre,
  })

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY)
    const parsed = parsearContexto(guardado)

    if (parsed) {
      if (parsed.tipo === "personal") {
        setState({ tipo: "personal" })
        return
      }

      if (parsed.tipo === "cliente" && parsed.clinicId) {
        const existe = clinicasCliente.some((c) => c.id === parsed.clinicId)
        if (existe) {
          const c = clinicasCliente.find((cc) => cc.id === parsed.clinicId)
          setState({ tipo: "cliente", clinicId: parsed.clinicId, clinicNombre: c?.nombre })
          return
        }
      }

      if (parsed.tipo === "staff" && parsed.clinicId) {
        const existe = clinicasStaff.some((c) => c.id === parsed.clinicId)
        if (existe) {
          const c = clinicasStaff.find((cc) => cc.id === parsed.clinicId)
          setState({ tipo: "staff", clinicId: parsed.clinicId, clinicNombre: c?.nombre })
          return
        }
      }
    }

    if (clinicasStaff.length > 0) {
      setState({ tipo: "staff", clinicId: clinicasStaff[0].id, clinicNombre: clinicasStaff[0].nombre })
    } else if (clinicasCliente.length > 0) {
      setState({ tipo: "cliente", clinicId: clinicasCliente[0].id, clinicNombre: clinicasCliente[0].nombre })
    } else {
      setState({ tipo: "personal" })
    }
  }, [clinicasStaff, clinicasCliente])

  const setContextoActivo = useCallback((ctx: ContextoActivo) => {
    setState(ctx)
    localStorage.setItem(STORAGE_KEY, serializarContexto(ctx.tipo, ctx.clinicId))
    setContextoCookie(ctx.tipo, ctx.clinicId)
  }, [])

  const currentNombre = contextoActivo.tipo !== "personal"
    ? contextoActivo.clinicNombre ?? ""
    : ""

  return (
    <ContextoContext.Provider
      value={{
        contextoActivo,
        setContextoActivo,
        clinicaNombre: currentNombre,
        usuarioRol,
        usuarioNombre,
        usuarioEmail,
        membresias,
        clinicasStaff,
        clinicasCliente,
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
