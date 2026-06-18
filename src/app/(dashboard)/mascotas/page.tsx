import { listarMascotas } from "@/actions/mascotas/listar"
import { obtenerEspecies } from "./obtener-especies"
import { MascotasClient } from "./client"

export default async function MascotasPage() {
  const [mascotas, especies] = await Promise.all([
    listarMascotas(),
    obtenerEspecies(),
  ])
  return <MascotasClient mascotasIniciales={mascotas} especies={especies} />
}
