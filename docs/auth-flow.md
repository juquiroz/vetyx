# Vetyx.io — Flujo de Autenticación + Multi-Tenant

| Versión | Fecha | Autor | Estado |
|---|---|---|---|
| 2.0 | 2026-06-17 | System Architect | Actualizado |

---

## 1. Diagrama de Flujo de Registro (dev, sin email)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE REGISTRO (DEV)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Usuario              Servidor Action                Supabase               │
│    │                       │                            │                   │
│    │  POST /registro       │                            │                   │
│    │  (email + clínica)    │                            │                   │
│    ├──────────────────────►│                            │                   │
│    │                       │  admin.createUser(email)   │                   │
│    │                       ├───────────────────────────►│                   │
│    │                       │◄───────────────────────────┤                   │
│    │                       │  { user.id }               │                   │
│    │                       │                            │                   │
│    │                       │  INSERT clinicas           │                   │
│    │                       ├───────────────────────────►│                   │
│    │                       │◄───────────────────────────┤                   │
│    │                       │  { clinica.id }            │                   │
│    │                       │                            │                   │
│    │                       │  INSERT usuarios           │                   │
│    │                       │  (id=user.id, clinic_id,   │                   │
│    │                       │   rol=admin)               │                   │
│    │                       ├───────────────────────────►│                   │
│    │                       │                            │                   │
│    │                       │  admin.generateLink        │                   │
│    │                       │  (type=magiclink)          │                   │
│    │                       ├───────────────────────────►│                   │
│    │                       │◄───────────────────────────┤                   │
│    │                       │  { email_otp }             │                   │
│    │                       │                            │                   │
│    │                       │  POST /auth/v1/verify      │                   │
│    │                       │  (type=magiclink,          │                   │
│    │                       │   token=otp, email)        │                   │
│    │                       ├───────────────────────────►│                   │
│    │                       │◄───────────────────────────┤                   │
│    │                       │  { access_token,           │                   │
│    │                       │    refresh_token }         │                   │
│    │                       │                            │                   │
│    │  { accessToken,       │                            │                   │
│    │    refreshToken }     │                            │                   │
│    │◄──────────────────────┤                            │                   │
│    │                       │                            │                   │
│    │  setSession(          │                            │                   │
│    │   access_token,       │                            │                   │
│    │   refresh_token)      │                            │                   │
│    │  ───► Dashboard /inicio                            │                   │
│    │                       │                            │                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Diagrama de Flujo de Login (dev, sin email)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE LOGIN (DEV)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Usuario              Servidor Action                Supabase               │
│    │                       │                            │                   │
│    │  Click en usuario     │                            │                   │
│    │  de la lista          │                            │                   │
│    ├──────────────────────►│                            │                   │
│    │                       │  admin.generateLink        │                   │
│    │                       │  (type=magiclink, email)   │                   │
│    │                       ├───────────────────────────►│                   │
│    │                       │◄───────────────────────────┤                   │
│    │                       │  { email_otp }             │                   │
│    │                       │                            │                   │
│    │                       │  POST /auth/v1/verify      │                   │
│    │                       │  (type=magiclink,          │                   │
│    │                       │   token=otp, email)        │                   │
│    │                       ├───────────────────────────►│                   │
│    │                       │◄───────────────────────────┤                   │
│    │                       │  { access_token,           │                   │
│    │                       │    refresh_token }         │                   │
│    │                       │                            │                   │
│    │  { accessToken,       │                            │                   │
│    │    refreshToken }     │                            │                   │
│    │◄──────────────────────┤                            │                   │
│    │                       │                            │                   │
│    │  setSession(          │                            │                   │
│    │   access_token,       │                            │                   │
│    │   refresh_token)      │                            │                   │
│    │  ───► Dashboard /inicio                            │                   │
│    │                       │                            │                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. Diagrama de Flujo de Multi-Tenant

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUJO DE MULTI-TENANT (CLINIC_ID)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Usuario logueado        Server Action               Base de Datos         │
│    │                          │                          │                  │
│    │  Acción CRUD             │                          │                  │
│    ├─────────────────────────►│                          │                  │
│    │                          │                          │                  │
│    │  ── Sesión ──            │                          │                  │
│    │  1. obtenerSesion()      │                          │                  │
│    │     → getUser() server   │                          │                  │
│    │     → session.user.id    │                          │                  │
│    │                          │                          │                  │
│    │  ── Usuario Actual ──    │                          │                  │
│    │  2. obtenerUsuarioActual(userId)                    │                  │
│    │     → { id, clinic_id,   │                          │                  │
│    │       rol, nombre }      │                          │                  │
│    │                          │                          │                  │
│    │  ── Permiso ──           │                          │                  │
│    │  3. verificarPermiso(    │                          │                  │
│    │       rol, módulo, acción)                          │                  │
│    │                          │                          │                  │
│    │  ── Operación ──         │                          │                  │
│    │  4. INSERT con           │                          │                  │
│    │     clinic_id del server │                          │                  │
│    │     (nunca del cliente)  │                          │                  │
│    ├─────────────────────────►│                          │                  │
│    │                          │  RLS verifica:           │                  │
│    │                          │  clinic_id =             │                  │
│    │                          │  get_user_clinic_id()    │                  │
│    │                          ├─────────────────────────►│                  │
│    │                          │◄─────────────────────────┤                  │
│    │◄─────────────────────────┤                          │                  │
│    │                          │                          │                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Ciclo de Vida de la Sesión

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CICLO DE VIDA DE LA SESIÓN                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐          │
│  │ ANÓNIMO  │───►│ AUTENTICANDO │───►│ LOGUEADO │───►│ CERRADO  │          │
│  │          │    │              │    │          │    │          │          │
│  │ Sin      │    │ Server       │    │ JWT      │    │ signOut  │          │
│  │ sesión   │    │ verifica OTP │    │ válido   │    │ manual   │          │
│  │          │    │ + setSession │    │          │    │          │          │
│  └──────────┘    └──────────────┘    └──────────┘    └──────────┘          │
│       │               │               │               │                    │
│       ▼               ▼               ▼               ▼                    │
│  /login          /login (spinner) /inicio         /login                   │
│  (lista de       (esperando      (dashboard      (nuevo login)             │
│   usuarios)       respuesta)      layout)                                   │
│                                                                             │
│  Transiciones:                                                              │
│  ANÓNIMO → AUTENTICANDO: generarLinkDev(email)                             │
│  AUTENTICANDO → LOGUEADO: setSession(access_token, refresh_token)          │
│  LOGUEADO → CERRADO: supabase.auth.signOut()                               │
│  LOGUEADO → (auto): token expira → middleware redirige a /login            │
│  CERRADO → ANÓNIMO: sesión terminada                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Mapa de Rutas y Protección

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MAPA DE RUTAS Y PROTECCIÓN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    MIDDLEWARE (src/middleware.ts)                     │    │
│  │                                                                      │    │
│  │  ¿Ruta protegida?                                                    │    │
│  │  ├── Sí → ¿Usuario autenticado?                                      │    │
│  │  │        ├── Sí → ✅ Continuar                                      │    │
│  │  │        └── No → 🔀 Redirect /login                               │    │
│  │  │                                                                     │    │
│  │  ¿Ruta pública?                                                       │    │
│  │  ├── Sí → ¿Usuario autenticado?                                       │    │
│  │  │        ├── Sí → 🔀 Redirect /inicio                               │    │
│  │  │        └── No → ✅ Continuar                                      │    │
│  │                                                                      │    │
│  │  ¿Auth callback?                                                     │    │
│  │  └── Sí → ✅ Pass-through (code exchange, no usado en dev)           │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Rutas Protegidas:      /inicio, /agenda, /duenos, /mascotas,              │
│                         /historial, /vacunas, /configuracion,               │
│                         /onboarding                                         │
│                                                                             │
│  Rutas Públicas:        /login, /registro                                   │
│                                                                             │
│  Sin protección:        /auth/callback                                      │
│                         /_next/*, /favicon.ico, assets estáticos            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Arquitectura de Componentes

```
Request HTTP
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│                    MIDDLEWARE                             │
│  src/middleware.ts                                        │
│  - actualizarSesion(request) → getUser()                  │
│  - Protege rutas privadas                                 │
│  - Redirige auth → inbox                                  │
│  - Pass-through auth/callback                             │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│               DASHBOARD LAYOUT (Server Component)         │
│  src/app/(dashboard)/layout.tsx                          │
│  - Obtiene sesión del servidor (getUser())               │
│  - Obtiene usuarioActual (clinic_id + rol)               │
│  - Si usuario no existe en DB → signOut + redirect       │
│  - Envuelve children en ClinicProvider                   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              CLINIC PROVIDER (Client Context)             │
│  src/providers/clinic-provider.tsx                       │
│  - Expone { usuario } con id, clinic_id, rol, nombre     │
│  - Accesible via useClinic() hook                        │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              SERVER ACTION (6-step checklist)             │
│  src/actions/**/*.ts                                     │
│  1. obtenerSesion()    → getUser() autenticado           │
│  2. obtenerUsuarioActual() → { clinic_id, rol }          │
│  3. verificarPermiso() → boolean                         │
│  4. Validación Zod     → parsed data                     │
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
└──────────────────────────────────────────────────────────┘
```

---

## 7. Clientes Supabase

| Cliente | Archivo | Key | RLS | Uso |
|---|---|---|---|---|
| `crearClienteNavegador` | `client.ts` | anon + JWT | ✅ | Componentes cliente (login, setSession, logout) |
| `crearClienteServidor` | `server.ts` | anon + JWT | ✅ | Server Components (lectura inicial) |
| `crearClienteAccion` | `action.ts` | anon + JWT | ✅ | Server Actions (95% CRUD) |
| `actualizarSesion` | `middleware.ts` | anon + JWT | ✅ | Middleware (protección rutas) |
| `crearClienteAdmin` | `admin.ts` | service_role | ❌ | Solo registro, invitación, dev login |

---

## 8. Checklist de Validación por Server Action

### 8.1 Plantilla (6 pasos)

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: SESIÓN                                             │
│  ✔ ¿Session existe? → continuar                             │
│  ✘ No → return { error: "No autorizado" }                  │
│                                                             │
│  NOTA: obtenerSesion() usa getUser() (no getSession())      │
│  para evitar inconsistencias entre cookies y server.        │
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

### 8.2 Excepciones conocidas

| Server Action | Pasos que omite | Motivo |
|---|---|---|
| `registrarClinica` | 1, 2, 3 | Usuario no existe aún. Usa service_role. |
| `invitarUsuario` | (ninguno) | Flujo completo: sesión, usuario, permiso, admin client. |
| `generarLinkDev` | 1, 2, 3 | Dev only. Usa service_role para generar sesión directa. |

---

## 9. Modo Desarrollo — Auth Bypass

En desarrollo (`pnpm dev`), el envío de email está deshabilitado. En su lugar:

### Registro
1. `registrarClinica()` crea usuario en `auth.users` + `public.clinicas` + `public.usuarios`
2. `admin.generateLink()` genera un OTP de 8 dígitos
3. `POST /auth/v1/verify` intercambia el OTP por `access_token` + `refresh_token`
4. El cliente llama `supabase.auth.setSession()` con esos tokens
5. Redirección a `/inicio`

### Login
1. `listarUsuariosDev()` retorna todos los `usuarios` activos (service_role)
2. Usuario hace click en su nombre
3. `generarLinkDev(email)` ejecuta el mismo flujo OTP → verify → setSession
4. Redirección a `/inicio`

### Archivos involucrados

| Archivo | Rol |
|---|---|
| `src/actions/auth/generar-link-dev.ts` | Genera link + verify OTP server-side |
| `src/actions/auth/listar-usuarios-dev.ts` | Lista usuarios para login (dev) |
| `src/actions/auth/registro.ts` | Crea clínica + usuario + genera sesión |

### Nota para producción
Reemplazar con `signInWithOtp()` (PKCE flow) + email vía Resend SMTP. El callback `/auth/callback` con `exchangeCodeForSession()` está preparado para ese flujo.

---

## 10. Seguridad

### 10.1 Doble capa

| Capa | Responsabilidad | Previene |
|---|---|---|
| Server Action (código) | Verifica sesión, usuario, rol, inyecta clinic_id | Errores de programación, clinic_id incorrecto |
| RLS (base de datos) | `clinic_id = get_user_clinic_id()` | Bypass accidental, bugs en código, acceso directo |

### 10.2 Reglas críticas

- `clinic_id` siempre del servidor (`obtenerUsuarioActual().clinic_id`)
- `clinic_id` nunca del input del cliente (FormData, query params, etc.)
- `obtenerSesion()` usa `getUser()` (autenticación server-side) en vez de `getSession()` (cookies locales)
- Si un usuario existe en `auth.users` pero no en `public.usuarios`, el dashboard hace `signOut()` automático para evitar loop infinito
- Tokens JWT se refrescan automáticamente por `@supabase/ssr`
- Sin contraseñas en MVP (solo magic links)
- Sin OAuth en MVP

---

## 11. Archivos del Sistema

| Archivo | Rol |
|---|---|
| `src/lib/supabase/client.ts` | Cliente browser para login, setSession, logout |
| `src/lib/supabase/action.ts` | Cliente Server Action (con RLS) |
| `src/lib/supabase/middleware.ts` | Cliente middleware (cookies request/response) |
| `src/lib/supabase/admin.ts` | Cliente service_role (sin RLS) |
| `src/lib/auth/get-session.ts` | Cache de sesión del servidor (usa getUser) |
| `src/lib/auth/get-current-user.ts` | Cache de usuario + clinic_id |
| `src/lib/auth/check-permission.ts` | Matriz de permisos por rol |
| `src/middleware.ts` | Protección de rutas |
| `src/app/auth/callback/route.ts` | Intercambio de código por sesión (producción) |
| `src/app/(public)/login/page.tsx` | Página de login (lista usuarios dev + form email) |
| `src/app/(public)/registro/page.tsx` | Página de registro de clínica |
| `src/app/(dashboard)/layout.tsx` | Layout protegido con ClinicProvider |
| `src/providers/clinic-provider.tsx` | Contexto de usuario actual |
| `src/hooks/use-session.ts` | Hook cliente de sesión |
| `src/actions/auth/generar-link-dev.ts` | Dev: genera sesión via OTP verify |
| `src/actions/auth/listar-usuarios-dev.ts` | Dev: lista usuarios para login |
| `supabase/migrations/001_schema.sql` | DDL completo: 9 tablas, RLS, índices, seed |
| `supabase/migrations/002_fix_rls_function.sql` | Fix RLS: SECURITY DEFINER |
