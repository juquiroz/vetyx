import { listarDuenos } from "./listar"
import { DuenosClient } from "./client"

export default async function DuenosPage() {
  const duenos = await listarDuenos()
  return <DuenosClient duenosIniciales={duenos} />
}
