export function haySolapamiento(
  a: { inicio: Date; fin: Date },
  b: { inicio: Date; fin: Date }
): boolean {
  return a.inicio < b.fin && a.fin > b.inicio
}

export function sumarMinutos(fecha: Date, minutos: number): Date {
  return new Date(fecha.getTime() + minutos * 60 * 1000)
}
