# Vetyx.io — Architecture Document (MVP v1.0)

| Versión | Fecha | Autor | Estado |
|---|---|---|---|
| 1.0 | 2026-06-12 | Software Architect | Aprobado |

**Documentos fuente:** `docs/01-prd.md`, `docs/02-frd.md`, `docs/project-context.md`, `docs/ai-instructions.md`

---

## Tabla de Contenidos

1. [Arquitectura General](#1-arquitectura-general)
2. [Multi-Tenant](#2-multi-tenant)
3. [Autenticación](#3-autenticación)
4. [RLS (Row Level Security)](#4-rls-row-level-security)
5. [Estructura de Carpetas](#5-estructura-de-carpetas)
6. [Seguridad](#6-seguridad)
7. [Convenciones](#7-convenciones)

---

## 1. Arquitectura General

**Patrón:** Full-stack monolítico con Next.js 15 App Router + Supabase como backend-as-a-service.

```
┌─────────────────────────────────────────────────┐
│                  Vercel (Hosting)                 │
│                                                   │
│   Next.js 15 App Router                           │
│   ┌───────────────────────────────────────┐      │
│   │  Server Components (SSR)              │      │
│   │  Server Actions (mutaciones)          │      │
│   │  Route Handlers (lecturas)            │      │
│   │  Middleware (auth + redirect)          │      │
│   └──────────────┬────────────────────────┘      │
│                  │                                │
└──────────────────┼────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────┐
│                  Supabase                         │
│                                                   │
│   ┌──────────────┐  ┌──────────────┐            │
│   │  PostgreSQL   │  │   Auth       │            │
│   │  (RLS)        │  │   (magic     │            │
│   │               │  │    links)    │            │
│   └──────────────┘  └──────────────┘            │
│   ┌──────────────┐                              │
│   │  Storage      │                              │
│   │  (post-MVP)   │                              │
│   └──────────────┘                              │
└─────────────────────────────────────────────────┘
```

### Principios arquitectónicos

| Principio | Aplicación |
|---|---|
| **Server-first** | Toda lógica de negocio y acceso a datos ocurre en el servidor. El cliente solo renderiza UI. |
| **RLS como firewall de datos** | La base de datos es el guardián final. RLS garantiza aislamiento incluso si Server Actions tienen bugs. |
| **Feature-based** | El código se organiza por módulo de negocio (dueños, mascotas, citas), no por tipo técnico. |
| **Dos clientes Supabase** | Cliente de sesión (anon + JWT, respeta RLS) para 95% de operaciones. Cliente de servicio (service_role, bypass RLS) solo para registro e invitación. |

### Flujo de datos

```
Client Component
    │
    ▼
Server Action (sesión) ──→ Permisos (rol + clinic_id)
    │                           │
    ▼                           ▼
Supabase (anon key + JWT) ──→ RLS verifica clinic_id
    │
    ▼
PostgreSQL (datos aislados)
```

---

## 2. Multi-Tenant

**Modelo:** Tenant aislado por `clinic_id` en cada tabla. Base de datos compartida (un schema `public`), no bases de datos separadas.

### Estructura de tablas

```
auth.users (Supabase managed, no tocar)
  │  id: UUID
  │  email: string
  │  created_at: timestamp
  │
  ├── public.clinicas
  │     id: UUID (PK, default gen_random_uuid())
  │     nombre: string (req)
  │     slug: string (unique, autogenerado)
  │     email: string (req)
  │     telefono: string (opc)
  │     direccion: text (opc)
  │     activo: boolean (default true)
  │     fecha_registro: timestamp
  │     created_at, updated_at
  │
  └── public.usuarios
        id: UUID (PK, FK → auth.users.id)
        clinic_id: UUID (FK → public.clinicas.id, NOT NULL)
        email: string (unique por clínica)
        nombre: string
        rol: enum ('admin', 'vet', 'recepcionista')
        telefono: string (opc)
        activo: boolean (default true)
        ultimo_acceso: timestamp
        created_at, updated_at
```

### Tablas de negocio (todas heredan este patrón)

```
public.duenos
  ├── id: UUID (PK)
  ├── clinic_id: UUID (FK → clinicas, NOT NULL)   ← tenancy
  └── (campos del FRD)

public.mascotas
  ├── id: UUID (PK)
  ├── clinic_id: UUID (NOT NULL)                   ← tenancy
  ├── owner_id: UUID (FK → duenos)
  └── (campos del FRD)

public.citas
  ├── id: UUID (PK)
  ├── clinic_id: UUID (NOT NULL)                   ← tenancy
  ├── mascota_id: UUID (FK → mascotas)
  └── (campos del FRD)

public.historial_medico
  ├── id: UUID (PK)
  ├── clinic_id: UUID (NOT NULL)                   ← tenancy
  ├── mascota_id: UUID (FK → mascotas)
  └── (campos del FRD)

public.vacunas
  ├── id: UUID (PK)
  ├── clinic_id: UUID (NOT NULL)                   ← tenancy
  ├── mascota_id: UUID (FK → mascotas)
  └── (campos del FRD)
```

### Creación de tenant (flujo registro)

```
1. Server Action "registrarClinica"
   ├── Usa supabase admin client (service_role) — bypass RLS
   ├── Crea auth user: supabase.auth.admin.createUser({ email })
   ├── Crea clínica: INSERT INTO clinicas (nombre, slug, email)
   ├── Crea usuario admin: INSERT INTO usuarios (id, clinic_id, email, nombre, rol='admin')
   └── Genera magic link: supabase.auth.admin.generateLink({ type: 'magiclink', email })
```

**Regla clave:** `clinic_id` se asigna en el servidor, NUNCA viene del cliente. El usuario no puede elegir a qué clínica pertenece.

### Propagación de clinic_id

```
Middleware ──→ session guarda userId
                    │
                    ▼
Dashboard Layout (Server Component)
  │  createServerComponentClient → getSession()
  │  SELECT clinic_id FROM public.usuarios WHERE id = session.user.id
  │
  ├── ClinicProvider (contexto: clinic_id, rol, nombre)
  │       │
  │       ▼
  │   Server Actions: usan clinic_id del helper getCurrentUser()
  │   Route Handlers: mismo patrón
  │
  └── Páginas hijas heredan clinic_id del layout
```

### Helper getCurrentUser

```typescript
// Se llama en cada Server Action y en layout protegido
// Cacheado por request para evitar N+1

async function getCurrentUser(userId: string) {
  const supabase = createServerActionClient({ cookies })
  const { data } = await supabase
    .from('usuarios')
    .select('id, clinic_id, rol, nombre')
    .eq('id', userId)
    .single()
  return data  // { id, clinic_id, rol, nombre } | null
}
```

---

## 3. Autenticación

**Stack:** Supabase Auth con magic links. Sin contraseñas, sin OAuth en MVP.

### Flujo de sesión

```
CLIENTE                    SERVER                          SUPABASE
  │                          │                                │
  │   ingresa email          │                                │
  │ ──────────────────────►  │                                │
  │                          │  signInWithOtp({ email })      │
  │                          │ ────────────────────────────►  │
  │                          │                                │──► email con magic link
  │                          │                                │
  │   hace click en link     │                                │
  │ ──────────────────────►  │  callback route                 │
  │                          │  /auth/callback                │
  │                          │  exchange code por session      │
  │                          │ ◄────────────────────────────  │
  │                          │                                │
  │                          │  Setea cookies de sesión       │
  │                          │  Redirige a /dashboard         │
  │ ◄─────────────────────── │                                │
```

### Middleware

```typescript
// src/middleware.ts
// Guardián de rutas protegidas

// 1. Refresca sesión de Supabase (createMiddlewareClient)
// 2. Si no hay sesión → redirect /login
// 3. Si hay sesión pero no tiene registro en public.usuarios → redirect /onboarding
// 4. Si todo ok → next()
```

### Helpers de auth

| Helper | Ubicación | Uso |
|---|---|---|
| `getSession()` | `lib/auth/get-session.ts` | Obtiene sesión de Supabase, retorna null si no autenticado |
| `getCurrentUser(userId)` | `lib/auth/get-current-user.ts` | Obtiene { clinic_id, rol, nombre } desde public.usuarios |
| `checkPermission(rol, modulo, accion)` | `lib/auth/check-permission.ts` | Verifica si el rol tiene permiso según matriz del FRD |

### Invitación de usuarios (solo admin)

```
Admin envía email del nuevo miembro
  │
  ▼
Server Action "invitarUsuario"
  ├── Verifica: sesión existe, rol = admin
  ├── Crea auth user con service_role
  ├── INSERT INTO usuarios (id, clinic_id, email, nombre, rol)
  └── Genera magic link y lo envía al email
```

### Registro (primera vez)

```
Usuario ingresa email + nombre clínica
  │
  ▼
Server Action (pública, sin auth) — usa service_role
  ├── Crea clínica en public.clinicas
  ├── Crea auth user via supabase.auth.admin.createUser
  ├── Crea public.usuarios con clinic_id + rol='admin'
  └── Genera magic link
  │
  ▼
Usuario recibe email → click → session creada → middleware redirige a /onboarding
```

---

## 4. RLS (Row Level Security)

**Principio:** Cada política asume que el usuario está autenticado y solo permite acceder a datos de su propia clínica.

### Función reusable

```sql
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT clinic_id FROM public.usuarios WHERE id = auth.uid()
$$;
```

### Políticas por tabla

**Tablas de negocio (dueños, mascotas, citas, historial_medico, vacunas):**

```sql
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.mascotas
  FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());
```

`FOR ALL` cubre SELECT, INSERT, UPDATE, DELETE. `USING` controla visibilidad de filas existentes. `WITH CHECK` controla filas nuevas o modificadas.

**Tabla usuarios:**

```sql
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_same_clinic" ON public.usuarios
  FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "users_insert_admin" ON public.usuarios
  FOR INSERT
  WITH CHECK (
    (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin'
    AND clinic_id = public.get_user_clinic_id()
  );

CREATE POLICY "users_update_admin" ON public.usuarios
  FOR UPDATE
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (
    (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin'
    AND clinic_id = public.get_user_clinic_id()
  );
```

**Tabla clínicas:**

```sql
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinicas_select_own" ON public.clinicas
  FOR SELECT
  USING (id = public.get_user_clinic_id());

CREATE POLICY "clinicas_update_admin" ON public.clinicas
  FOR UPDATE
  USING (id = public.get_user_clinic_id())
  WITH CHECK (
    (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin'
  );
```

### Registro (excepción — sin sesión aún)

La creación inicial de clínica + usuario admin usa **service_role**, que bypass RLS. Es la única operación que no pasa por RLS.

### Clientes de Supabase

| Cliente | Key | RLS | Dónde se usa |
|---|---|---|---|
| `createBrowserClient` | anon key | ✅ | Solo suscripciones en tiempo real (no MVP) |
| `createServerComponentClient` | anon key + JWT | ✅ | Server Components (lectura inicial) |
| `createServerActionClient` | anon key + JWT | ✅ | 95% de Server Actions (CRUD negocio) |
| `createServiceRoleClient` | service_role key | ❌ | Solo registro e invitación de usuarios |

### Por qué RLS + verificación en código

| Capa | Qué previene |
|---|---|
| **Server Action (código)** | Errores de programación, clinic_id incorrecto, permisos de rol |
| **RLS (base de datos)** | Bypass accidental, bugs en código, acceso directo a DB |

Ambas capas son redundantes por diseño. Si una falla, la otra contiene el daño.

---

## 5. Estructura de Carpetas

```
src/
├── app/
│   ├── (public)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Sidebar + header + ClinicProvider
│   │   ├── page.tsx                  # redirect → /inicio
│   │   ├── inicio/page.tsx           # Dashboard de métricas
│   │   ├── agenda/
│   │   │   ├── page.tsx              # Vista diaria/semanal
│   │   │   └── components/
│   │   ├── duenos/
│   │   │   ├── page.tsx              # Lista + búsqueda
│   │   │   └── [id]/page.tsx         # Perfil del dueño + mascotas
│   │   ├── mascotas/
│   │   │   ├── page.tsx              # Búsqueda global
│   │   │   └── [id]/page.tsx         # Ficha del paciente
│   │   ├── historial/
│   │   │   └── [mascotaId]/page.tsx  # Línea de tiempo
│   │   ├── vacunas/
│   │   │   └── [mascotaId]/page.tsx  # Historial de vacunas
│   │   └── configuracion/
│   │       ├── clinica/page.tsx      # Editar datos clínica
│   │       └── usuarios/page.tsx     # Gestionar staff
│   │
│   ├── onboarding/page.tsx
│   ├── auth/callback/route.ts        # Exchange code → session
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Redirect a login
│
├── components/
│   ├── ui/                           # shadcn/ui (generado)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── search-global.tsx
│   ├── shared/
│   │   ├── empty-state.tsx
│   │   ├── data-table.tsx
│   │   └── confirm-dialog.tsx
│   └── modals/
│       └── crear-cita-modal.tsx
│
├── actions/
│   ├── auth/
│   │   ├── login.ts                  # signInWithOtp
│   │   ├── registro.ts               # Crear clínica + admin (service_role)
│   │   └── invitacion.ts            # Invitar usuario (service_role)
│   ├── duenos/
│   │   ├── crear.ts
│   │   ├── editar.ts
│   │   ├── desactivar.ts
│   │   └── buscar.ts
│   ├── mascotas/
│   │   ├── crear.ts
│   │   ├── editar.ts
│   │   ├── desactivar.ts
│   │   └── buscar.ts
│   ├── citas/
│   │   ├── crear.ts
│   │   ├── editar.ts
│   │   ├── cancelar.ts
│   │   ├── completar.ts
│   │   └── marcar-no-show.ts
│   ├── historial/
│   │   ├── crear-consulta.ts
│   │   ├── crear-cirugia.ts
│   │   └── editar-evento.ts
│   ├── vacunas/
│   │   ├── registrar.ts
│   │   └── editar.ts
│   ├── usuarios/
│   │   ├── cambiar-rol.ts
│   │   └── desactivar.ts
│   └── shared/
│       └── buscar-global.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient
│   │   ├── server.ts                 # createServerComponentClient
│   │   ├── action.ts                 # createServerActionClient
│   │   ├── admin.ts                  # createServiceRoleClient
│   │   └── middleware.ts            # createMiddlewareClient
│   ├── auth/
│   │   ├── get-session.ts
│   │   ├── get-current-user.ts
│   │   └── check-permission.ts
│   ├── validations/
│   │   ├── duenos.ts                 # Zod schemas
│   │   ├── mascotas.ts
│   │   ├── citas.ts
│   │   ├── historial.ts
│   │   └── vacunas.ts
│   └── utils.ts
│
├── types/
│   ├── database.ts                   # Tipos generados de Supabase
│   └── models.ts                     # Tipos de dominio
│
├── hooks/
│   ├── use-session.ts
│   └── use-clinic.ts
│
├── providers/
│   └── clinic-provider.tsx           # Expone clinic_id, rol, nombre
│
├── middleware.ts
└── config/
    └── constants.ts                  # Enums, slots, colores
```

### Principios de organización

| Regla | Razón |
|---|---|
| 1 Server Action = 1 archivo | Facilita testing, evita archivos gigantes |
| Zod schemas centralizados en lib/validations | Mismos schemas sirven para Server Actions y formularios |
| Helpers de auth en lib/auth | Evitan duplicar lógica de sesión en cada action |
| Tipos generados de Supabase como fuente de verdad | database.ts + models.ts para tipos de dominio |
| Provider solo para datos de sesión | No meter lógica de negocio en providers |

---

## 6. Seguridad

### Modelo de confianza (Zero Trust)

```
CLIENTE (no confiable)
  │
  ▼
Server Action (verificación 1: sesión + rol)
  │
  ▼
Supabase (verificación 2: RLS + clinic_id)
  │
  ▼
PostgreSQL (datos)
```

### Checklist obligatorio por Server Action

Toda Server Action debe seguir este orden:

```typescript
export async function algunaAccion(input: FormData) {
  // 1. Sesión
  const session = await getSession()
  if (!session) return { error: 'No autorizado' }

  // 2. Usuario actual (clinic_id + rol)
  const user = await getCurrentUser(session.user.id)
  if (!user) return { error: 'Usuario no encontrado' }

  // 3. Permiso de rol
  const permiso = checkPermission(user.rol, 'modulo', 'accion')
  if (!permiso) return { error: 'Permiso denegado' }

  // 4. Validación de datos (Zod)
  const parsed = schema.safeParse(Object.fromEntries(input))
  if (!parsed.success) return { error: parsed.error }

  // 5. Operación (clinic_id siempre del server, nunca del cliente)
  const supabase = createServerActionClient({ cookies })
  const { error } = await supabase
    .from('tabla')
    .insert({ ...parsed.data, clinic_id: user.clinic_id })

  // 6. Respuesta
  if (error) return { error: error.message }
  return { success: true }
}
```

### Matriz de permisos (código)

```typescript
// lib/auth/check-permission.ts
const PERMISSIONS = {
  admin: {
    duenos:      ['crear', 'editar', 'desactivar', 'ver'],
    mascotas:    ['crear', 'editar', 'desactivar', 'ver'],
    citas:       ['crear', 'editar', 'cancelar', 'completar', 'marcar-no-show', 'ver'],
    historial:   ['crear', 'editar', 'ver'],
    vacunas:     ['crear', 'editar', 'ver'],
    usuarios:    ['invitar', 'cambiar-rol', 'desactivar', 'ver'],
    dashboard:   ['ver-completo'],
    config:      ['editar-clinica'],
  },
  vet: {
    duenos:      ['ver'],
    mascotas:    ['crear', 'editar', 'desactivar', 'ver'],
    citas:       ['completar', 'ver'],
    historial:   ['crear', 'editar', 'ver'],
    vacunas:     ['crear', 'editar', 'ver'],
    dashboard:   ['ver-parcial'],
    usuarios:    [],
    config:      [],
  },
  recepcionista: {
    duenos:      ['crear', 'editar', 'ver'],
    mascotas:    ['crear', 'editar', 'ver'],
    citas:       ['crear', 'editar', 'cancelar', 'marcar-no-show', 'ver'],
    historial:   ['ver'],
    vacunas:     ['ver'],
    dashboard:   [],
    usuarios:    [],
    config:      [],
  },
}
```

### Capas de seguridad

| Capa | Mecanismo | Mitiga |
|---|---|---|
| 1. Transporte | HTTPS (Vercel + Supabase) | Intercepción de datos |
| 2. Autenticación | Supabase Auth + magic links | Acceso no autorizado |
| 3. Autorización | Matriz de permisos (código) + RLS (DB) | Acceso a datos de otra clínica o sin rol |
| 4. Validación de entrada | Zod schemas | Inyección, XSS, datos corruptos |
| 5. SQL Injection | Supabase client (queries parametrizadas) | Inyección SQL |
| 6. CSRF | Next.js Server Actions (protección nativa) | Ataques CSRF |

### Riesgos mitigados

| Riesgo | Mitigación |
|---|---|
| Usuario ve datos de otra clínica | RLS filtra por clinic_id. Server Action inyecta clinic_id del token, no del input. |
| Recepcionista crea historial médico | checkPermission bloquea en Server Action. |
| Inyección SQL | Supabase client sanitiza queries. No hay SQL raw en MVP. |
| Magic link interceptado | Supabase Auth maneja expiración (1 hora). Enlace de un solo uso. |
| Usuario desactivado accede | getCurrentUser retorna null si activo = false. Middleware redirige. |
| Clínica inactiva accede | getCurrentUser verifica clinicas.activo. Si inactiva, bloquea. |
| CSRF | Server Actions de Next.js tienen protección CSRF incorporada. |
| XSS | React escapa output por default. Zod rechaza strings con HTML en campos críticos. |

---

## 7. Convenciones

| Ámbito | Convención |
|---|---|
| **Idioma** | Español (variables, funciones, archivos, commits) |
| **Nombres de tablas** | Plural en español, snake_case (`duenos`, `mascotas`, `citas`) |
| **Nombres de columnas** | snake_case (`fecha_aplicacion`, `fecha_proxima_dosis`) |
| **Nombres de funciones** | camelCase (`crearCita`, `obtenerHistorial`) |
| **Nombres de archivos** | kebab-case (`crear-cita.ts`, `buscar-duenos.ts`) |
| **Types** | PascalCase (`Cita`, `Mascota`, `CreateCitaInput`) |
| **Server Actions** | export async function, retorno `{ success: boolean, data?, error? }` |
| **Primary keys** | `id` UUID con `gen_random_uuid()` |
| **Foreign keys** | `tabla_id` (ej: `mascota_id`, `clinic_id`) |
| **Timestamps** | `created_at`, `updated_at` con `now()` por defecto |
| **Soft delete** | `activo` boolean con default `true` |
| **Enums DB** | `public.tipo_cita`, `public.rol_usuario`, `public.especie`, `public.sexo` |
| **RLS** | Obligatorio en toda tabla de negocio |
| **Tipado** | `strict: true`. Evitar `any`. Usar `z.infer<typeof schema>` para inputs. |
| **Formato commits** | `módulo: acción breve` (ej: `citas: corrige validación de doble reserva`) |

---

*Documento complementario al PRD v1.0 y FRD v1.0. Para contexto completo, referirse a `docs/01-prd.md` (qué construir) y `docs/02-frd.md` (cómo debe funcionar).*
