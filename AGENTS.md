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
