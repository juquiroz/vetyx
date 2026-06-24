export function filtrarPorClinica<T>(query: T, clinicId: string | null): T {
  if (clinicId === null) {
    return (query as any).is("clinic_id", null)
  }
  return (query as any).eq("clinic_id", clinicId)
}
