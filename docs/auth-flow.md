# Vetyx.io — Flujo de Autenticación + Multi-Tenant

| Versión | Fecha | Autor | Estado |
|---|---|---|---|
| 1.0 | 2026-06-16 | System Architect | Aprobado |

---

## 1. Diagrama de Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE REGISTRO                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Usuario                    Servidor (Next.js)            Supabase      │
│    │                            │                          │            │
│    │  POST /registro           │                          │            │
│    │  (email + nombreClinica)  │                          │            │
│    ├─────────────────────────► │                          │            │
│    │                           │  crearClienteAdmin()     │            │
│    │                           ├─────────────────────────►│            │
│    │                           │  admin.createUser(email) │            │
│    │                           │◄─────────────────────────┤            │
│    │                           │  { user.id }             │            │
│    │                           │                          │            │
│    │                           │  INSERT clinicas         │            │
│    │                           │  (slug, nombre, email)   │            │
│    │                           ├─────────────────────────►│            │
│    │                           │◄─────────────────────────┤            │
│    │                           │  { clinica.id }          │            │
│    │                           │                          │            │
│    │                           │  INSERT usuarios         │            │
│    │                           │  (id=user.id,            │            │
│    │                           │   clinic_id, rol=admin)  │            │
│    │                           ├─────────────────────────►│            │
│    │                           │                          │            │
│    │                           │  admin.generateLink      │            │
│    │                           │  (type=magiclink)        │            │
│    │                           ├─────────────────────────►│            │
│    │                           │◄─────────────────────────┤            │
│    │                           │  { action_link }         │            │
│    │                           │                          │            │
│    │  { success, magicLink }   │                          │            │
│    │◄─────────────────────────┤                          │            │
│    │                           │                          │            │
│    │  [Click en magic link]    │                          │            │
│    │                           │                          │            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE LOGIN (MAGIC LINK)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Usuario              Navegador              Supabase Auth              │
│    │                       │                      │                     │
│    │  Ingresa email        │                      │                     │
│    ├──────────────────────►│                      │                     │
│    │                       │  signInWithOtp()     │                     │
│    │                       │  (email, redirectTo) │                     │
│    │                       ├─────────────────────►│                     │
│    │                       │◄─────────────────────┤                     │
│    │                       │  Email enviado       │                     │
│    │                       │                      │                     │
│    │  [Revisa email]       │                      │                     │
│    │                       │                      │                     │
│    │  Click en magic link  │                      │                     │
│    │                       │                      │                     │
│    │                       │  GET /auth/callback  │                     │
│    │                       │  ?code=xxx           │                     │
│    │                       ├─────────────────────►│                     │
│    │                       │                      │                     │
│    │                       │  exchangeCodeForSession()                  │
│    │                       │                      │                     │
│    │                       │◄─────────────────────┤                     │
│    │                       │  redirect /inicio    │                     │
│    │                       │                      │                     │
│    │                       │  Middleware:          │                     │
│    │                       │  ✔ Sesión JWT válida │                     │
│    │                       │  ✔ Usuario autenticado                     │
│    │                       │                      │                     │
│    │  Dashboard            │                      │                     │
│    │◄─────────────────────┤                      │                     │
│    │                       │                      │                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUJO DE MULTI-TENANT (CLINIC_ID)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Usuario logueado        Server Action               Base de Datos     │
│    │                          │                          │              │
│    │  Acción CRUD             │                          │              │
│    ├─────────────────────────►│                          │              │
│    │                          │                          │              │
│    │  ── Sesión ──            │                          │              │
│    │  1. obtenerSesion()      │                          │              │
│    │     → session.user.id    │                          │              │
│    │                          │                          │              │
│    │  ── Usuario Actual ──    │                          │              │
│    │  2. obtenerUsuarioActual(userId)                    │              │
│    │     → { id, clinic_id,   │                          │              │
│    │       rol, nombre }      │                          │              │
│    │                          │                          │              │
│    │  ── Permiso ──           │                          │              │
│    │  3. verificarPermiso(    │                          │              │
│    │       rol, módulo, acción)                          │              │
│    │                          │                          │              │
│    │  ── Operación ──         │                          │              │
│    │  4. INSERT con           │                          │              │
│    │     clinic_id del server │                          │              │
│    │     (nunca del cliente)  │                          │              │
│    ├─────────────────────────►│                          │              │
│    │                          │  RLS verifica:           │              │
│    │                          │  clinic_id =             │              │
│    │                          │  get_user_clinic_id()    │              │
│    │                          ├─────────────────────────►│              │
│    │                          │◄─────────────────────────┤              │
│    │◄─────────────────────────┤                          │              │
│    │                          │                          │              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Diagrama de Flujo de Sesión

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CICLO DE VIDA DE LA SESIÓN                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ ANÓNIMO  │───►│ ENVIADO  │───►│ LOGUEADO │───►│ CERRADO  │      │
│  │          │    │          │    │          │    │          │      │
│  │ Sin      │    │ Magic    │    │ JWT      │    │ signOut  │      │
│  │ sesión   │    │ link     │    │ válido   │    │ manual   │      │
│  │          │    │ enviado  │    │          │    │          │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│       │               │               │               │            │
│       │               │               │               │            │
│       ▼               ▼               ▼               ▼            │
│  /login          /login          /inicio         /login            │
│  (form email)    (estado         (dashboard      (nuevo login)     │
│                   "enviado")      layout)                           │
│                                                                     │
│  Transiciones:                                                      │
│  ANÓNIMO  → ENVIADO:  signInWithOtp(email)                          │
│  ENVIADO  → LOGUEADO: exchangeCodeForSession(code)                  │
│  LOGUEADO → CERRADO:  supabase.auth.signOut()                       │
│  LOGUEADO → (auto):   token expira → middleware redirige a /login   │
│  CERRADO  → ANÓNIMO:  sesión terminada                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MAPA DE RUTAS Y PROTECCIÓN                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    MIDDLEWARE (src/middleware.ts)             │    │
│  │                                                              │    │
│  │  ¿Ruta protegida?                                            │    │
│  │  ├── Sí → ¿Usuario autenticado?                              │    │
│  │  │        ├── Sí → ✅ Continuar                              │    │
│  │  │        └── No → 🔀 Redirect /login                       │    │
│  │  │                                                             │    │
│  │  ¿Ruta pública?                                               │    │
│  │  ├── Sí → ¿Usuario autenticado?                               │    │
│  │  │        ├── Sí → 🔀 Redirect /inicio                       │    │
│  │  │        └── No → ✅ Continuar                              │    │
│  │                                                              │    │
│  │  ¿Auth callback?                                             │    │
│  │  └── Sí → ✅ Pass-through (code exchange)                    │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Rutas Protegidas:      /inicio, /agenda, /duenos, /mascotas,      │
│                         /historial, /vacunas, /configuracion,       │
│                         /onboarding                                 │
│                                                                     │
│  Rutas Públicas:        /login, /registro                           │
│                                                                     │
│  Sin protección:        /auth/callback                              │
│                         /_next/*, /favicon.ico, assets estáticos    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Arquitectura de Componentes

```
Request HTTP
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│                    MIDDLEWARE                             │
│  src/middleware.ts                                        │
│  - actualizarSesion(request)                              │
│  - Protege rutas privadas                                 │
│  - Redirige auth → inbox                                  │
│  - Pass-through auth/callback                             │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│               DASHBOARD LAYOUT (Server Component)         │
│  src/app/(dashboard)/layout.tsx                          │
│  - Obtiene sesión del servidor                           │
│  - Obtiene usuarioActual (clinic_id + rol)               │
│  - Envuelve children en ClinicProvider                   │
│  - Si no hay sesión → redirect /login                    │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              CLINIC PROVIDER (Client Context)             │
│  src/providers/clinic-provider.tsx                       │
│  - Expone { usuario } con id, clinic_id, rol, nombre     │
│  - Accesible via useClinic() hook                        │
│  - Lanza error si se usa fuera del provider              │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              SERVER ACTION (6-step checklist)             │
│  src/actions/**/*.ts                                     │
│  1. obtenerSesion()        → session.user.id             │
│  2. obtenerUsuarioActual() → { clinic_id, rol }          │
│  3. verificarPermiso()     → boolean                     │
│  4. Validación Zod         → parsed data                 │
│  5. Operación con clinic_id del server                   │
│  6. Respuesta { success, data?, error? }                 │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              SUPABASE + RLS                               │
│  - Anon key + JWT del usuario                             │
│  - RLS policy: clinic_id = get_user_clinic_id()           │
│  - get_user_clinic_id() usa SECURITY DEFINER              │
│    para evitar recursión infinita                         │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Clientes Supabase

| Cliente | Archivo | Key | RLS | Uso |
|---|---|---|---|---|
| `crearClienteNavegador` | `client.ts` | anon + JWT | ✅ | Componentes cliente (login, logout) |
| `crearClienteServidor` | `server.ts` | anon + JWT | ✅ | Server Components (lectura inicial) |
| `crearClienteAccion` | `action.ts` | anon + JWT | ✅ | Server Actions (95% CRUD) |
| `actualizarSesion` | `middleware.ts` | anon + JWT | ✅ | Middleware (protección rutas) |
| `crearClienteAdmin` | `admin.ts` | service_role | ❌ | Solo registro e invitación |

---

## 5. Checklist de Validación por Server Action

### 5.1 Plantilla (6 pasos)

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: SESIÓN                                             │
│  ✔ ¿Session existe? → continuar                             │
│  ✘ No → return { error: "No autorizado" }                  │
├─────────────────────────────────────────────────────────────┤
│  PASO 2: USUARIO ACTUAL                                     │
│  ✔ ¿usuario existe? → { clinic_id, rol }                   │
│  ✘ No → return { error: "Usuario no encontrado" }          │
├─────────────────────────────────────────────────────────────┤
│  PASO 3: PERMISO DE ROL                                     │
│  ✔ ¿rol tiene permiso? → continuar                          │
│  ✘ No → return { error: "Permiso denegado" }               │
├─────────────────────────────────────────────────────────────┤
│  PASO 4: VALIDACIÓN DE DATOS                                │
│  ✔ Zod schema pasa → parsed data                            │
│  ✘ Falla → return { error: "Datos inválidos", detalles }   │
├─────────────────────────────────────────────────────────────┤
│  PASO 5: OPERACIÓN CON CLINIC_ID                            │
│  ✔ Usar clinic_id del server (nunca del input cliente)      │
│  ✔ Incluir en WHERE/INSERT obligatoriamente                 │
├─────────────────────────────────────────────────────────────┤
│  PASO 6: RESPUESTA                                          │
│  ✔ Éxito → return { success: true, data? }                 │
│  ✘ Error → return { error: "mensaje" }                     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Excepciones conocidas

| Server Action | Pasos que omite | Motivo |
|---|---|---|
| `registrarClinica` | 1, 2, 3 | Usuario no existe aún. Usa service_role. |
| `invitarUsuario` | (ninguno) | Flujo completo: sesión, usuario, permiso, admin client. |

---

## 6. Seguridad

### 6.1 Doble capa

| Capa | Responsabilidad | Previene |
|---|---|---|
| Server Action (código) | Verifica sesión, usuario, rol, inyecta clinic_id | Errores de programación, clinic_id incorrecto |
| RLS (base de datos) | `clinic_id = get_user_clinic_id()` | Bypass accidental, bugs en código, acceso directo |

### 6.2 Reglas críticas

- `clinic_id` siempre del servidor (`obtenerUsuarioActual().clinic_id`)
- `clinic_id` nunca del input del cliente (FormData, query params, etc.)
- Magic links expiran en 1 hora (configuración por defecto de Supabase)
- Tokens JWT se refrescan automáticamente por `@supabase/ssr`
- Sin contraseñas en MVP (solo magic links)
- Sin OAuth en MVP

---

## 7. Archivos del Sistema

| Archivo | Rol |
|---|---|
| `src/lib/supabase/client.ts` | Cliente browser para login/logout |
| `src/lib/supabase/action.ts` | Cliente Server Action (con RLS) |
| `src/lib/supabase/middleware.ts` | Cliente middleware (cookies request/response) |
| `src/lib/supabase/admin.ts` | Cliente service_role (sin RLS) |
| `src/lib/auth/get-session.ts` | Cache de sesión del servidor |
| `src/lib/auth/get-current-user.ts` | Cache de usuario + clinic_id |
| `src/lib/auth/check-permission.ts` | Matriz de permisos por rol |
| `src/middleware.ts` | Protección de rutas |
| `src/app/auth/callback/route.ts` | Intercambio de código por sesión |
| `src/app/(public)/login/page.tsx` | Página de login (magic link) |
| `src/app/(public)/registro/page.tsx` | Página de registro de clínica |
| `src/app/(dashboard)/layout.tsx` | Layout protegido con ClinicProvider |
| `src/providers/clinic-provider.tsx` | Contexto de usuario actual |
| `src/hooks/use-session.ts` | Hook cliente de sesión |
| `supabase/migrations/002_fix_rls_function.sql` | Fix RLS: SECURITY DEFINER |
