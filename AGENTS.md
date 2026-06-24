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
- `src/lib/validations/` — Zod schemas
- `src/types/` — database.ts + models.ts
- `src/providers/` — ClinicProvider
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
3. Permiso de rol (`verificarPermiso`)
4. Validación Zod
5. Operación con `clinic_id` del server
6. Respuesta `{ success, data?, error? }`

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

#### Pendiente (Fase 5)
- Migrar 39 queries que usan `.filter("clinic_id", ...)` a helper contextual
- Deprecar columna `usuarios.clinic_id`
- `get_user_clinic_id()` — leer de `clinic_memberships`

#### Decisiones de diseño
- Cliente no registrado: error + pedir registro (no crear auto)
- Multi-clínica UI: selector dropdown cuando >1 staff
- Mascotas personales: NO visibles al staff
- Legacy `usuarios.clinic_id`: migrar en Fase 5, no permanente
