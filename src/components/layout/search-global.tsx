"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, PawPrint, Command } from "lucide-react"
import { Input } from "@/components/ui/input"
import { buscarGlobal, type ResultadoGlobal } from "@/actions/shared/buscar-global"

export function SearchGlobal() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [query, setQuery] = useState("")
  const [resultados, setResultados] = useState<ResultadoGlobal>({ duenos: [], mascotas: [] })
  const [indice, setIndice] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  function abrir() {
    setAbierto(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function cerrar() {
    setAbierto(false)
    setQuery("")
    setResultados({ duenos: [], mascotas: [] })
    setIndice(-1)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (abierto) cerrar()
        else abrir()
      }
      if (e.key === "Escape" && abierto) {
        cerrar()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [abierto])

  useEffect(() => {
    if (query.length < 2) return

    const id = setTimeout(async () => {
      const res = await buscarGlobal(query)
      setResultados(res)
      setIndice(-1)
    }, 200)

    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    if (query.length >= 2) return
    const id = setTimeout(() => {
      setResultados({ duenos: [], mascotas: [] })
    }, 0)
    return () => clearTimeout(id)
  }, [query])

  const items = [
    ...resultados.duenos.map((d) => ({ tipo: "dueño" as const, id: d.id, nombre: d.nombre, subtitulo: d.telefono })),
    ...resultados.mascotas.map((m) => ({ tipo: "mascota" as const, id: m.id, nombre: m.nombre, subtitulo: `${m.especie} · ${m.dueno_nombre}` })),
  ]

  function navegar(index: number) {
    const item = items[index]
    if (!item) return
    cerrar()
    if (item.tipo === "dueño") router.push(`/duenos/${item.id}`)
    else router.push(`/mascotas/${item.id}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setIndice((prev) => (prev < items.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setIndice((prev) => (prev > 0 ? prev - 1 : items.length - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      navegar(indice)
    }
  }

  if (!abierto) {
    return (
      <>
        <button
          onClick={abrir}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent max-md:hidden"
          aria-label="Abrir búsqueda"
        >
          <Search className="size-4" />
          <span>Buscar...</span>
          <kbd className="ml-2 hidden rounded border bg-muted px-1.5 py-0.5 text-xs md:inline-flex items-center gap-0.5">
            <Command className="size-3" />K
          </kbd>
        </button>
        <button
          onClick={abrir}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent md:hidden"
          aria-label="Abrir búsqueda"
        >
          <Search className="size-5" />
        </button>
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60" onClick={cerrar} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border bg-background shadow-2xl">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar dueños o mascotas..."
            className="border-0 px-0 shadow-none focus-visible:ring-0"
          />
          <button
            onClick={cerrar}
            className="ml-2 rounded-sm p-1 text-xs text-muted-foreground hover:bg-accent"
          >
            ESC
          </button>
        </div>

        {query.length >= 2 && items.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">Sin resultados</div>
        )}

        {items.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {resultados.duenos.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Dueños</p>
                {resultados.duenos.map((d, i) => {
                  const idx = i
                  return (
                    <button
                      key={d.id}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                        indice === idx ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                      onClick={() => navegar(idx)}
                      onMouseEnter={() => setIndice(idx)}
                    >
                      <Users className="size-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{d.nombre}</p>
                        <p className="text-xs text-muted-foreground">{d.telefono}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {resultados.mascotas.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Mascotas</p>
                {resultados.mascotas.map((m, i) => {
                  const idx = resultados.duenos.length + i
                  return (
                    <button
                      key={m.id}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                        indice === idx ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                      onClick={() => navegar(idx)}
                      onMouseEnter={() => setIndice(idx)}
                    >
                      <PawPrint className="size-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{m.nombre}</p>
                        <p className="text-xs text-muted-foreground">{`${m.especie} · ${m.dueno_nombre}`}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
