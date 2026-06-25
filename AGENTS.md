# Vetyx.io — Guía para Agentes de IA

## Stack
- Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL + Auth + RLS)
- Server Actions + Route Handlers
- Resend (email)
- Vitest + Testing Library
- Zod (validación)

## Restricciones clave
- Código en español (variables, funciones, archivos, commits)
- TypeScript strict mode (`strict: true` en tsconfig)
- Magic links (sin contraseñas, sin OAuth)
- Multi-tenant por `clinic_id`
- Soft deletes (UPDATE activo = false, nunca DELETE)
- Slots de 30 min fijos
- Sin IA, sin integraciones externas, sin app móvil
- Sin enums PostgreSQL (VARCHAR + CHECK)

## Convenciones
- Archivos: kebab-case (`crear-cita.ts`)
- Funciones: camelCase (`obtenerHistorial`)
- Tipos: PascalCase (`CrearCitaInput`)
- Server Actions: `export async function`, retorno `{ success, data?, error? }`
- 1 Server Action = 1 archivo
- RLS en toda tabla de negocio
- Componentes shadcn/ui en `src/components/ui/`

## Estructura
- `src/app/` — App Router (páginas y layouts)
- `src/app/(public)/` — Rutas públicas (login, registro)
- `src/app/(dashboard)/` — Rutas protegidas con sidebar
- `src/components/ui/` — Componentes shadcn/ui
- `src/components/layout/` — Sidebar, topbar, search
- `src/components/shared/` — EmptyState, DataTable, ConfirmDialog
- `src/actions/` — Server Actions por módulo
- `src/lib/supabase/` — Clientes Supabase (4)
- `src/lib/auth/` — Helpers de autenticación
- `src/lib/context/` — Helpers de contexto activo (getActiveContext)
- `src/lib/validations/` — Zod schemas
- `src/types/` — database.ts + models.ts
- `src/providers/` — ClinicProvider, ContextoProvider
- `src/hooks/` — useSession, useClinic
- `src/config/constants.ts` — Constantes del dominio

## Antes de escribir código
1. Leer `docs/02-frd.md` para reglas de negocio
2. Leer `docs/04-database.md` para schema DB
3. Leer `docs/05-ui-ux.md` para wireframes y UX
4. Seguir el checklist de 6 pasos en cada Server Action

## Checklist Server Action
1. Sesión (`obtenerSesion`)
2. Usuario actual (`obtenerUsuarioActual`)
3. Contexto activo (`getActiveContext()`)
4. Permiso de rol (`verificarPermiso`)
5. Validación Zod
6. Operación con `clinic_id` del contexto
7. Respuesta `{ success, data?, error? }`

## Progreso — 2026-06-23

### Implementado (Fases 1-4 de clinic_memberships)

#### Fase 1 — Migración + Tipos
- `supabase/migrations/011_clinic_memberships.sql` — tabla, RLS (5 políticas), trigger, índices, backfill staff existente
- `src/types/database.ts` — tipo `clinic_memberships` agregado
- `src/types/models.ts` — `ClinicMembership` + `ClinicMembershipConClinica`
- `src/lib/auth/get-current-user.ts` — `UsuarioActual.membresias?` (opcional)

#### Fase 2 — Server Actions
- `src/actions/usuarios/agregar-cliente.ts` (nuevo) — busca email global, inserta membership cliente
- `src/actions/usuarios/invitar.ts` (refactor) — busca email global, usa clinic_memberships
- `src/actions/usuarios/listar-miembros.ts` (refactor) — consulta clinic_memberships + join usuarios
- `src/actions/usuarios/cambiar-rol.ts` (refactor) — valida/actualiza clinic_memberships
- `src/actions/usuarios/desactivar.ts` (refactor) — desactiva clinic_memberships
- `src/lib/auth/check-permission.ts` — módulo `clientes` para admin

#### Fase 3 — UI Clientes
- `src/actions/usuarios/listar-clientes.ts` (nuevo) — lista clientes de la clínica
- `src/app/(dashboard)/configuracion/clientes/page.tsx` (nuevo)
- `src/app/(dashboard)/configuracion/clientes/client.tsx` (nuevo) — tabla + modal agregar
- `src/components/layout/sidebar.tsx` — enlace "Clientes" en configuración

#### Fase 4 — Contexto multi-clínica
- `src/lib/auth/get-current-user.ts` — `obtenerUsuarioActual()` ahora retorna `membresias[]`
- `src/providers/contexto-provider.tsx` — acepta membresías, expone clinicasStaff
- `src/components/layout/sidebar.tsx` — dropdown selector cuando >1 clínica staff
- `src/app/(dashboard)/layout.tsx` — pasa membresías, elimina query separada a clinicas

#### Bugfix — Historial (pre-existente, no relacionado a memberships)
- `supabase/migrations/012_historial_tipos.sql` — CHECK constraint en `historial_medico.tipo` solo aceptaba `consulta`/`cirugia`, pero Zod+UI usan 6 tipos. Error: `new row violates check constraint "historial_medico_tipo_check"`.
- `src/actions/historial/crear-evento.ts` — error message ahora muestra el error real de Supabase en vez de "Error al crear el evento" genérico.

## Progreso — 2026-06-24

### Implementado — Contexto Cliente (Personal / Cliente / Staff)

#### Fase 1 — Helper getActiveContext
- `src/lib/context/get-active-context.ts` (nuevo) — helper server: lee cookie `vetyx_contexto`, valida contra `clinic_memberships`, retorna `{ tipo, clinicId?, clinicNombre? }`. Fallback: staff → cliente → personal.
- Exporta `serializarContexto()` helper.

#### Fase 2 — Modelo + Provider
- `src/types/models.ts` — `ContextoOrigen` expandido a `"personal" | "cliente" | "staff"`
- `src/providers/contexto-provider.tsx` — `ContextoActivo.tipo` expandido, derivación `clinicasCliente`, inicialización multi-contexto, setter escribe cookie `vetyx_contexto` + localStorage JSON, expone `clinicasCliente`

#### Fase 3 — Selector UX (sidebar + topbar)
- `src/components/layout/sidebar.tsx` — selector agrupado plano visible (PERSONAL / CLIENTE / STAFF), cada opción es botón, activo resaltado. Nav items filtrados por contexto. Config section solo en `staff`.
- `src/components/layout/topbar.tsx` — dropdown multi-contexto (Personal + Clientes + Staff), badge muestra tipo real (`"Personal" | "Cliente" | "Staff"`)

#### Fase 4 — Agenda contextual
- `src/actions/citas/obtener-citas-rango.ts` — usa `getActiveContext()`; para `cliente`: filtra citas por mascotas del dueño en esa clínica (3 queries: dueños → mascotas → citas). Staff: comportamiento actual.
- `src/components/agenda/agenda-grid.tsx` — nueva prop `soloLectura`: oculta toolbar, slots no clickeables, empty state sin botón
- `src/app/(dashboard)/agenda/page.tsx` — render condicional: `personal` → empty state, `cliente` → "Mis Citas" + soloLectura, `staff` → completo con toolbar + crear cita

#### Tests
- 22 archivos, 178 tests — pasan
- Mock de `getActiveContext` en `obtener-citas-rango.test.ts`

#### Build
- `next build` — clean, sin errores

### Pendiente
- Migrar ~36 server actions restantes a `getActiveContext()` con helper `resolverClinicId()` (ver `docs/06-memberships.md` para lista completa)
- Reemplazar `usuario.clinic_id` por `getActiveContext().clinicId` en todas las acciones (Fase 5 original: deprecar columna `usuarios.clinic_id`)
- `get_user_clinic_id()` — leer de `clinic_memberships`
- Fix layout/script tag (hidratación tema oscuro) — PR separado

### Decisiones de diseño
- Contexto → Server Actions usando COOKIE (`vetyx_contexto`), nunca FormData/parámetro `_contexto`
- Cliente reutiliza `/agenda` con `soloLectura` (no ruta separada `/citas`)
- Selector agrupado por tipo, lista vertical plana (sin dropdowns por grupo en sidebar)
- Bypass manual de `verificarPermiso("citas", "ver")` para clientes (dueño no tiene permiso citas nativamente)
- Cookie: `vetyx_contexto={"tipo":"staff","clinicId":"uuid"}` con max-age 365d
- Cliente no registrado: error + pedir registro (no crear auto)
- Mascotas personales: NO visibles al staff
- Legacy `usuarios.clinic_id`: migrar en Fase 5, no permanente
