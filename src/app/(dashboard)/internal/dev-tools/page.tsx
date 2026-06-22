import { redirect } from "next/navigation"
import { DevToolsClient } from "./client"

export default function DevToolsPage() {
  if (process.env.NODE_ENV !== "development") redirect("/inicio")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Herramientas de Desarrollo</h1>
        <p className="text-sm text-muted-foreground">
          Solo disponible en entorno de desarrollo. Estas operaciones son destructivas.
        </p>
      </div>
      <DevToolsClient />
    </div>
  )
}
