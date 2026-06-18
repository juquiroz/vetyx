"use client"

import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"
import { useTema } from "@/providers/theme-provider"

export function ThemeToggle() {
  const { tema, alternarTema } = useTema()

  return (
    <Button variant="ghost" size="icon" onClick={alternarTema} aria-label={tema === "oscuro" ? "Modo claro" : "Modo oscuro"}>
      {tema === "oscuro" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
