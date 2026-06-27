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

### Pendiente (ver sección 2026-06-25 para versión actualizada)

### Decisiones de diseño
- Contexto → Server Actions usando COOKIE (`vetyx_contexto`), nunca FormData/parámetro `_contexto`
- Cliente reutiliza `/agenda` con `soloLectura` (no ruta separada `/citas`)
- Selector agrupado por tipo, lista vertical plana (sin dropdowns por grupo en sidebar)
- Bypass manual de `verificarPermiso("citas", "ver")` para clientes (dueño no tiene permiso citas nativamente)
- Cookie: `vetyx_contexto={"tipo":"staff","clinicId":"uuid"}` con max-age 365d
- Cliente no registrado: error + pedir registro (no crear auto)
- Mascotas personales: NO visibles al staff
- Legacy `usuarios.clinic_id`: migrar en Fase 5, no permanente
- Sesión: nunca cachear en variable global del módulo (compartida entre requests en dev)
- RLS con LEFT JOIN: si tabla secundaria bloquea lectura, JOIN retorna `null` — usar admin client cuando ya hay validación previa

## Progreso — 2026-06-25

### Bugfixes — Sesión/Caché

#### Caché de sesión eliminado
- `src/lib/auth/get-session.ts` — eliminado `let cacheSession` que causaba cross-user leak (usuario B veía sesión de A). Siempre obtiene sesión fresca de Supabase.
- `src/lib/auth/get-current-user.ts` — eliminado `const cacheUsuario = new Map()`. Siempre consulta BD.
- `limpiarCacheSesion()` y `limpiarCacheUsuario()` quedan como no-op para compatibilidad.

#### RLS — duenos en personal context
- `src/actions/mascotas/crear-con-dueno.ts` — agregado `user_id: usuario.id` al INSERT de `duenos`. Sin esto, RLS policy `(clinic_id IS NULL AND user_id = auth.uid())` fallaba al no enviar `user_id`.

#### RLS — listar-clientes con usuarios de clinic_id null
- `src/actions/usuarios/listar-clientes.ts` — cambiado `crearClienteAccion()` → `crearClienteAdmin()`. El JOIN `usuario:usuarios(...)` retornaba null porque RLS bloqueaba leer clientes con `usuarios.clinic_id = NULL`.

#### Registro de clínica — faltaba clinic_memberships
- `src/actions/auth/registro.ts` — agregado INSERT en `clinic_memberships` con `tipo: "staff"`. Antes solo se creaba `usuarios.clinic_id` legacy.

#### Alta de cliente — falta dueño automático
- `src/actions/usuarios/agregar-cliente.ts` — ahora crea `duenos` con `user_id`, `clinic_id` al agregar cliente. Si ya existe, `maybeSingle` lo detecta.

### Mejora — Email en UI
- `src/providers/contexto-provider.tsx` — agregado `usuarioEmail` prop
- `src/app/(dashboard)/layout.tsx` — pasa `usuario.email ?? ""`
- `src/components/layout/sidebar.tsx` — email visible debajo del nombre
- `src/components/layout/topbar.tsx` — email visible debajo del nombre

### DB — Limpieza
- Eliminadas `clinic_memberships` huérfanas (apuntaban a clínicas inexistentes)
- Backfilled `clinic_memberships` para staff registrado antes del fix de `registro.ts`

### Tests
- 22 archivos, 178 tests — pasan
- Build — `next build` clean

## Progreso — 2026-06-25 (tarde)

### Arquitectura — Nuevo modelo de dominio (aprobado)

Decisión de producto: **las mascotas no pertenecen a una clínica**. La clínica atiende mascotas. El dueño es global.

#### Modelo de 3 capas:

```
IDENTIDAD GLOBAL (sin clinic_id):
  auth.users → usuarios → duenos → mascotas

RELACIÓN LABORAL (existe):
  usuarios → clinic_memberships (tipo='staff') → clínica

RELACIÓN COMERCIAL (NUEVA):
  duenos → clinic_clients → clínica

RELACIÓN CLÍNICA (NUEVA):
  mascotas → clinic_patients → clínica
```

#### Tablas nuevas:
- `clinic_clients` — (clinic_id, dueno_id, activo) — UNIQUE(clinic_id, dueno_id)
- `clinic_patients` — (clinic_id, mascota_id, numero_expediente, fecha_ingreso, estado, veterinario_referente, notas, activo) — UNIQUE(clinic_id, mascota_id)

#### Tablas que perderán clinic_id (Fase 5):
- `duenos` → global
- `mascotas` → global

#### Tablas que conservan clinic_id:
- `citas`, `historial_medico`, `vacunas` (inherentemente por clínica)
- `usuarios` (staff tienen clinic_id, dueños NULL)
- `clinic_memberships`, `clinic_clients`, `clinic_patients`

#### Decisiones:
- `clinic_clients` y `clinic_patients` son tablas separadas (dominios distintos)
- `clinic_clients` con `dueno_id` explícito (no inferir desde mascotas)
- `clinic_patients` almacena datos propios de la clínica (expediente, ingreso, estado, vet referente, notas)
- Historial clínico es por clínica, no compartido por defecto
- Menú "Dueños" → "Clientes" (Fase 4)

### Fase 1 implementada
- `supabase/migrations/013_clinic_clients_patients.sql` — CREATE TABLE + RLS (7 políticas por tabla) + índices
- `src/types/database.ts` — tipos `clinic_clients` + `clinic_patients`
- `src/types/models.ts` — `ClinicClient`, `ClinicPatient`, `ClinicClientConDueno`, `ClinicPatientConMascota`

### Fase 2 — RLS dual (migración 014)
- `supabase/migrations/014_rls_duenos_mascotas.sql` — RLS dual para `duenos` y `mascotas`: staff puede ver mediante `clinic_id` (legacy) O mediante `EXISTS` en `clinic_clients`/`clinic_patients`
- Aplica a todas las políticas (SELECT, INSERT, UPDATE, DELETE)

### Fase 3 — Server Actions migradas (sin filtro clinic_id explícito)

#### Lectura (RLS reemplaza filtro manual):
- `src/actions/duenos/listar.ts` (page) — quitado `.filter("clinic_id")`
- `src/actions/duenos/obtener.ts` — quitado `.filter("clinic_id")`
- `src/actions/duenos/buscar.ts` — quitado `.filter("clinic_id")`
- `src/actions/mascotas/listar.ts` — quitado `.filter("clinic_id")`
- `src/actions/mascotas/obtener.ts` — quitado `.filter("clinic_id")`
- `src/actions/mascotas/buscar.ts` — quitados 4 `.filter("clinic_id")`
- `src/actions/shared/buscar-global.ts` — quitados filtros en duenos/mascotas

#### Escritura (crea clinic_clients + clinic_patients):
- `src/actions/duenos/crear.ts` — upsert clinic_clients tras insert
- `src/actions/duenos/obtener-o-crear-dueno-personal.ts` — upsert clinic_clients tras insert
- `src/actions/mascotas/crear.ts` — upsert clinic_patients tras insert
- `src/actions/mascotas/crear-con-dueno.ts` — upsert clinic_clients + clinic_patients tras insert
- `src/actions/usuarios/agregar-cliente.ts` — ya creaba clinic_clients + clinic_patients (no cambió)

#### Validación (ownership checks → RLS):
- `src/actions/duenos/editar.ts` — quitado check `clinic_id !== usuario.clinic_id`
- `src/actions/duenos/desactivar.ts` — quitado check
- `src/actions/duenos/vincular-usuario.ts` — quitado check
- `src/actions/mascotas/editar.ts` — quitado check
- `src/actions/mascotas/desactivar.ts` — quitado check

### Build + Tests
- `next build` — clean
- 22 archivos, 178 tests — pasan

### Bugfix — Mascota de cliente no visible (post-Fase 3)

#### Issue 1 — `agregar-cliente.ts` buscaba dueno solo con `clinic_id IS NULL`
Si el cliente fue invitado con el flujo legacy (antes del refactoring), podía tener un dueno con `clinic_id` seteado y mascotas vinculadas a ESE dueno (no al personal con `clinic_id = NULL`). El lookup `.is("clinic_id", null)` no encontraba el dueno legacy, y las mascotas no se migraban a `clinic_patients`.
- **Fix**: buscar duenos por `user_id` sin filtrar por `clinic_id`, buscar mascotas en todos los duenos encontrados.

#### Issue 2 — `mascotas/crear.ts` y `crear-con-dueno.ts` usaban `usuario.clinic_id`
Para usuarios con rol `dueño` (cliente), `usuario.clinic_id` es NULL, así que el upsert de `clinic_patients` se saltaba. Esto impedía que mascotas creadas después de la invitación fueran visibles al staff.
- **Fix**: leer la cookie `vetyx_contexto` como fallback para obtener el `clinicId` del contexto activo cuando `usuario.clinic_id` es NULL.
- Helper `obtenerClinicIdContexto()` agregado en ambos archivos.

### Pendiente (Fases 4-6)
- **Fase 4**: UI — renombrar Dueños → Clientes (sidebar, breadcrumbs, títulos)
- **Fase 5**: Drop clinic_id de duenos/mascotas (migración 015)
- **Fase 6**: Simplificar RLS (eliminar paths legacy, migración 016)
- **Backfill**: Migrar datos legacy duenos/mascotas con clinic_id a clinic_clients/clinic_patients
- **vacunas/citas/historial**: Migrar chequeos de `mascota.clinic_id` a clinic_patients scope
- Fix layout/script tag (hidratación tema oscuro) — PR separado
