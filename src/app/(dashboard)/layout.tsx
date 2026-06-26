import { redirect } from "next/navigation"
import { obtenerSesion } from "@/lib/auth/get-session"
import { obtenerUsuarioActual } from "@/lib/auth/get-current-user"
import { ClinicProvider } from "@/providers/clinic-provider"
import { ContextoProvider } from "@/providers/contexto-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { Toaster } from "@/components/ui/sonner"
import { crearClienteAccion } from "@/lib/supabase/action"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await obtenerSesion()
  if (!session) redirect("/login")

  const usuario = await obtenerUsuarioActual(session.user.id)
  if (!usuario) {
    const supabase = await crearClienteAccion()
    await supabase.auth.signOut()
    redirect("/login")
  }

  const staffMembership = usuario.membresias?.find(m => m.tipo === "staff")
  const clinicaNombre = staffMembership?.clinica_nombre ?? ""

  return (
    <ClinicProvider usuario={usuario}>
      <ContextoProvider
        clinicaId={staffMembership?.clinic_id}
        clinicaNombre={clinicaNombre}
        usuarioRol={usuario.rol}
        usuarioNombre={usuario.nombre}
        usuarioEmail={usuario.email ?? ""}
        membresias={usuario.membresias}
      >
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </ContextoProvider>
    </ClinicProvider>
  )
}
