import { Timeline } from "@/components/historial/timeline"

export default async function HistorialPage({
  params,
}: {
  params: Promise<{ mascotaId: string }>
}) {
  const { mascotaId } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historial médico</h1>
      <Timeline mascotaId={mascotaId} />
    </div>
  )
}
