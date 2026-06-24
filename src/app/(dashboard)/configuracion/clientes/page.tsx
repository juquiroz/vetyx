import { listarClientes } from "@/actions/usuarios/listar-clientes"
import { ClientesClient } from "./client"

export default async function ClientesPage() {
  const clientes = await listarClientes()
  return <ClientesClient clientesIniciales={clientes} />
}
