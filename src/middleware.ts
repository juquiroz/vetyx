import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { actualizarSesion } from "@/lib/supabase/middleware"

const rutasProtegidas = ["/inicio", "/agenda", "/duenos", "/mascotas", "/historial", "/vacunas", "/configuracion", "/onboarding"]
const rutasPublicas = ["/login", "/registro"]

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await actualizarSesion(request)

  const url = new URL(request.url)
  const path = url.pathname

  const esRutaProtegida = rutasProtegidas.some((ruta) => path.startsWith(ruta))
  const esRutaPublica = rutasPublicas.some((ruta) => path.startsWith(ruta))

  if (esRutaProtegida && !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (esRutaPublica && user) {
    return NextResponse.redirect(new URL("/inicio", request.url))
  }

  if (path === "/auth/callback") {
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
