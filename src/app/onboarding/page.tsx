import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl">¡Bienvenido a Vetyx!</CardTitle>
          <CardDescription>
            Tu clínica está lista. Ahora puedes registrar tu primer paciente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/duenos">Registrar dueño y mascota</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/inicio">Ir al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
