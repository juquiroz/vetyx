"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Tema = "claro" | "oscuro"

type TemaContexto = {
  tema: Tema
  alternarTema: () => void
  definirTema: (t: Tema) => void
}

const contexto = createContext<TemaContexto | null>(null)

export function useTema() {
  const ctx = useContext(contexto)
  if (!ctx) throw new Error("useTema debe usarse dentro de ThemeProvider")
  return ctx
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>(
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark") ? "oscuro" : "claro"
      : "claro"
  )

  useEffect(() => {
    const root = document.documentElement
    if (tema === "oscuro") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("vetyx-tema", tema)
  }, [tema])

  const alternarTema = useCallback(() => {
    setTema((prev) => (prev === "claro" ? "oscuro" : "claro"))
  }, [])

  const definirTema = useCallback((t: Tema) => setTema(t), [])

  return (
    <contexto.Provider value={{ tema, alternarTema, definirTema }}>
      {children}
    </contexto.Provider>
  )
}
