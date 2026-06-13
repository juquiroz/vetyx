# Vetyx.io — Project Context

| Versión | Fecha | Autor |
|---|---|---|
| 1.0 | 2026-06-12 | Senior PM |

**Documentos fuente:** `docs/01-prd.md`, `docs/02-frd.md`

---

## Resumen Ejecutivo

**Vetyx** es un SaaS web para la gestión integral de clínicas veterinarias pequeñas y medianas en Latinoamérica. Digitaliza el registro de pacientes, historial clínico, vacunas, agenda y métricas del negocio, reemplazando procesos en papel, Excel o herramientas genéricas.

**Problema que resuelve:** Las clínicas veterinarias en LatAm pierden historiales clínicos, no gestionan recordatorios de vacunas, sufren agendas caóticas con dobles reservas, y carecen de visibilidad sobre ingresos, ocupación y rentabilidad del negocio.

---

## Objetivo del Producto

**Objetivo del MVP:** Validar que clínicas dispuestas a pagar $49–$79 USD/mes adopten la plataforma como su herramienta diaria, registrando al menos 30 citas por semana y reteniendo ≥80% de las clínicas activas semanalmente.

**Resultado esperado (Día 90):**
- 10 clínicas pagando activamente
- ≥30 citas registradas por clínica por semana
- NPS ≥40
- Churn mensual <5%

---

## Alcance Aprobado

### Funcionalidades incluidas (MVP v1.0)

| Módulo | Funcionalidades clave |
|---|---|
| **Clínicas** | Registro de tenant, edición de perfil, desactivación lógica, aislamiento multi-tenant |
| **Usuarios** | Invitación por email, roles (admin/vet/recep), matriz de permisos, desactivación |
| **Dueños** | CRUD + búsqueda por nombre/teléfono, relación 1:N con mascotas, soft delete |
| **Mascotas** | CRUD + búsqueda, especie/raza/peso/fecha nacimiento, ficha unificada con historial + vacunas |
| **Citas (Agenda)** | Agenda diaria y semanal, slots de 30 min fijos, validación sin dobles reservas, estados (confirmada/completada/cancelada/no-show), colores por estado, registro de monto |
| **Historial Médico** | Línea de tiempo cronológica, registro de consulta y cirugía, edición restringida a 24h, no eliminable, eventos de vacunas visibles en línea de tiempo |
| **Vacunas** | Catálogo semilla precargado (8 tipos), registro con lote y próxima dosis, recordatorio automático por email (3 reintentos máx, cada 7 días) |
| **Dashboard** | Ingresos (gráfica de barras), ocupación de agenda (%), top 5 servicios, pacientes activos vs atenciones, próximas citas del día, estados vacíos con CTA |

### Funcionalidades excluidas (post-MVP)

- Facturación electrónica / CFDI
- Módulo de farmacia / inventario
- Internamiento
- Pagos en línea
- App móvil nativa
- WhatsApp nativo (API oficial)
- Portal del cliente (app dueño)
- Integración con laboratorios
- Múltiples sucursales
- Roles personalizados
- Slots configurables
- Catálogo de vacunas editable

---

## Stack Tecnológico Aprobado

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Next Server Actions + Route Handlers (API Routes) |
| **Base de datos** | Supabase (PostgreSQL + RLS para tenancy) |
| **Auth** | Supabase Auth (magic links, sin contraseñas) |
| **Storage** | Supabase Storage (para fotos de mascotas, post-MVP) |
| **Estado cliente** | React Query + Zustand |
| **Email** | Resend (recordatorios de vacunas) |
| **Hosting** | Vercel |

**Decisiones de stack (documentadas en PRD D-13, D-07, D-04):**
- Next.js App Router unifica frontend + API en un solo deploy
- PostgreSQL con RLS para aislamiento multi-tenant
- Magic links sin contraseñas para mejor UX de registro
- Email primero; WhatsApp en fase 2 (D-05)

---

## Arquitectura (pendiente)

La arquitectura del sistema (estructura de carpetas, organización de módulos, patrón de componentes, esquema de base de datos) **aún no está definida**. Será documentada en un plan de arquitectura posterior.

---

## Restricciones del MVP

1. **MVP pequeño y enfocado** — No agregar funcionalidades fuera del alcance aprobado en `docs/01-prd.md` y `docs/02-frd.md`.
2. **Sin IA** — No incluir modelos de lenguaje, clasificación automática, ni funcionalidades basadas en inteligencia artificial.
3. **Sin integraciones externas** — No conectar con APIs de terceros (laboratorios, pasarelas de pago, WhatsApp, etc.). Solo email (Resend) para recordatorios.
4. **Sin app móvil nativa** — PWA responsive es suficiente para MVP.
5. **Sin facturación electrónica** — Complejidad regulatoria varía por país; se pospone a fase 2.
6. **Sin portal del cliente** — El comprador es la clínica, no el dueño de la mascota.
7. **Sin multi-sucursal** — Pocas clínicas MVP operan con sucursales.

---

## Estado Actual

### PLAN #1 — Completado ✅
- Definición de producto (PRD) — `docs/01-prd.md`
- Requerimientos funcionales (FRD) — `docs/02-frd.md`

### PLAN #2 — Pendiente ⏳
- Próximo paso por definir

---

*Documento de restauración de contexto. Actualizar al inicio de cada sesión para continuar el trabajo.*
