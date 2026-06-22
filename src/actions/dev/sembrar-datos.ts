"use server"

import { crearClienteAdmin } from "@/lib/supabase/admin"
import { obtenerSesion } from "@/lib/auth/get-session"
import { limpiarCacheSesion } from "@/lib/auth/get-session"

export async function sembrarDatosDemo() {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Solo disponible en desarrollo" }
  }

  const sesion = await obtenerSesion()
  if (!sesion) return { error: "No hay sesión activa" }

  const admin = crearClienteAdmin()

  const { data: usuario } = await admin
    .from("usuarios")
    .select("id, clinic_id")
    .eq("id", sesion.user.id)
    .single()

  if (!usuario) return { error: "Usuario no encontrado" }

  const cid = usuario.clinic_id
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)

  const { data: especies } = await admin.from("especies").select("id, nombre")
  const especiePerro = especies?.find((e) => e.nombre === "Perro")?.id
  const especieGato = especies?.find((e) => e.nombre === "Gato")?.id
  const especieOtro = especies?.find((e) => e.nombre === "Otro")?.id

  if (!especiePerro) return { error: "Catálogo especies no encontrado" }

  const { data: catalogo } = await admin
    .from("catalogo_vacunas")
    .select("id, nombre, especie_id")

  if (!catalogo || catalogo.length === 0) {
    return { error: "Catálogo vacunas no encontrado" }
  }

  const nombresVet = ["María García", "Carlos López"]
  const vets: { id: string; nombre: string }[] = []

  for (const nombre of nombresVet) {
    const { data } = await admin
      .from("usuarios")
      .insert({
        id: crypto.randomUUID(),
        clinic_id: cid,
        email: `${nombre.toLowerCase().replace(/\s+/g, ".")}@demo.local`,
        nombre,
        rol: "vet",
      })
      .select("id, nombre")
      .single()

    if (data) vets.push(data)
  }

  if (vets.length === 0) return { error: "No se pudieron crear veterinarios" }

  const nombresDuenos = [
    "Juan Pérez", "Ana Martínez", "Roberto Sánchez", "Laura Gómez",
    "Pedro Hernández", "Sofía Torres", "Diego Ramírez", "Valentina Flores",
    "Miguel Ángel Ruiz", "Camila Vargas",
  ]

  const duenos: { id: string; nombre: string }[] = []

  for (const nombre of nombresDuenos) {
    const { data } = await admin
      .from("duenos")
      .insert({
        clinic_id: cid,
        nombre,
        telefono: `55${String(Math.floor(10000000 + Math.random() * 90000000))}`,
        email: `${nombre.toLowerCase().replace(/\s+/g, ".")}@email.demo`,
        created_by: usuario.id,
      })
      .select("id, nombre")
      .single()

    if (data) duenos.push(data)
  }

  const nombresMascotas = [
    { nombre: "Luna", especie: especiePerro, raza: "Labrador" },
    { nombre: "Simba", especie: especieGato, raza: "Naranja" },
    { nombre: "Max", especie: especiePerro, raza: "Pastor Alemán" },
    { nombre: "Mimi", especie: especieGato, raza: "Blanco" },
    { nombre: "Toby", especie: especiePerro, raza: "Beagle" },
    { nombre: "Nala", especie: especieGato, raza: "Atigrado" },
    { nombre: "Rocky", especie: especiePerro, raza: "Bulldog" },
    { nombre: "Lola", especie: especieGato, raza: "Negro" },
    { nombre: "Bruno", especie: especiePerro, raza: "Golden Retriever" },
    { nombre: "Kiara", especie: especieGato, raza: "Café" },
    { nombre: "Coco", especie: especieOtro, raza: "Conejo" },
    { nombre: "Daisy", especie: especiePerro, raza: "Poodle" },
    { nombre: "Oliver", especie: especieGato, raza: "Gris" },
    { nombre: "Chloe", especie: especiePerro, raza: "Chihuahua" },
    { nombre: "Charlie", especie: especieOtro, raza: "Hámster" },
  ]

  const mascotas: { id: string; nombre: string }[] = []

  for (let i = 0; i < nombresMascotas.length; i++) {
    const m = nombresMascotas[i]
    const dueno = duenos[i % duenos.length]

    const fechaNac = new Date(hoy)
    fechaNac.setFullYear(fechaNac.getFullYear() - Math.floor(1 + Math.random() * 10))

    const { data } = await admin
      .from("mascotas")
      .insert({
        clinic_id: cid,
        owner_id: dueno.id,
        especie_id: m.especie ?? especiePerro,
        nombre: m.nombre,
        raza: m.raza,
        fecha_nacimiento: fechaNac.toISOString().slice(0, 10),
        sexo: i % 2 === 0 ? "macho" : "hembra",
        created_by: usuario.id,
      })
      .select("id, nombre")
      .single()

    if (data) mascotas.push(data)
  }

  const tiposCita = ["consulta", "consulta", "consulta", "control", "cirugia"]
  const estadosCita = ["completed", "completed", "completed", "scheduled", "scheduled"]

  for (let i = 0; i < 5; i++) {
    const mascota = mascotas[i % mascotas.length]
    const vet = vets[i % vets.length]

    const fecha = new Date(hoy)
    fecha.setDate(fecha.getDate() - (i < 3 ? (i + 1) * 2 : 0))
    fecha.setHours(9 + i * 2, 0, 0, 0)

    const fechaFin = new Date(fecha)
    fechaFin.setMinutes(fechaFin.getMinutes() + 30)

    await admin.from("citas").insert({
      clinic_id: cid,
      mascota_id: mascota.id,
      veterinario_id: vet.id,
      fecha_hora: fecha.toISOString(),
      duracion_minutos: 30,
      motivo: `Consulta de ${mascota.nombre}`,
      estado: estadosCita[i],
      created_by: usuario.id,
    })
  }

  const vacunasPerro = catalogo.filter((v) => v.especie_id === especiePerro)
  const vacunasGato = especieGato ? catalogo.filter((v) => v.especie_id === especieGato) : []

  for (let i = 0; i < 5; i++) {
    const mascota = mascotas[i % mascotas.length]
    const esPerro = nombresMascotas.find((m) => m.nombre === mascota.nombre)?.especie === especiePerro
    const catVacunas = esPerro && vacunasPerro.length > 0 ? vacunasPerro : vacunasGato
    if (catVacunas.length === 0) continue
    const vacuna = catVacunas[i % catVacunas.length]
    const vet = vets[i % vets.length]

    const fechaAplicacion = new Date(hoy)
    fechaAplicacion.setDate(fechaAplicacion.getDate() - (i + 1) * 15)

    const fechaProxima = new Date(fechaAplicacion)
    fechaProxima.setFullYear(fechaProxima.getFullYear() + 1)

    await admin.from("vacunas").insert({
      clinic_id: cid,
      mascota_id: mascota.id,
      tipo_vacuna_id: vacuna.id,
      lote: `LOTE-${String(1000 + i)}`,
      fecha_aplicacion: fechaAplicacion.toISOString().slice(0, 10),
      fecha_proxima_dosis: i % 2 === 0 ? fechaProxima.toISOString().slice(0, 10) : null,
      aplicado_por: vet.id,
    })
  }

  limpiarCacheSesion()

  return {
    success: true,
    resumen: {
      vets: vets.length,
      duenos: duenos.length,
      mascotas: mascotas.length,
    },
  }
}
