import { listarMiembros } from "@/actions/usuarios/listar-miembros"
import { MiembrosClient } from "./client"

export default async function MiembrosPage() {
  const miembros = await listarMiembros()
  return <MiembrosClient miembrosIniciales={miembros} />
}
