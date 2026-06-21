# Vetyx.io — Backlog del MVP v1.0

| Versión | Fecha | Autor | Estado |
|---|---|---|---|
| 1.0 | 2026-06-12 | Senior Product Owner | Aprobado |

**Documentos fuente:** `docs/01-prd.md`, `docs/02-frd.md`, `docs/03-architecture.md`, `docs/04-database.md`, `docs/05-ui-ux.md`

---

## Tabla de Contenidos

1. [Definition of Done — Global](#1-definition-of-done--global)
2. [Épicas](#2-épicas)
3. [Mapa de Dependencias](#3-mapa-de-dependencias)
4. [Sprint 0 — Fundación Técnica](#4-sprint-0--fundación-técnica-semanas-1-2)
5. [Sprint 1 — Autenticación + Dueños + Mascotas](#5-sprint-1--autenticación--dueños--mascotas-semanas-3-4)
6. [Sprint 2 — Agenda de Citas](#6-sprint-2--agenda-de-citas-semanas-5-6)
7. [Sprint 3 — Historial Médico + Vacunas](#7-sprint-3--historial-médico--vacunas-semanas-7-8)
8. [Sprint 4 — Dashboard + Refinamiento](#8-sprint-4--dashboard--refinamiento-semanas-9-10)

---

## 1. Definition of Done — Global

| Criterio | Descripción |
|---|---|
| **DoD-01** | Server Action implementada con los 6 pasos de seguridad: sesión → usuario → permiso → validación Zod → operación con clinic_id del server → respuesta tipada `{ success, data?, error? }` |
| **DoD-02** | RLS policy verificada: query con `WHERE clinic_id = get_user_clinic_id()` funciona; sin ella falla |
| **DoD-03** | UI responsiva: funciona en desktop ≥1024px y mobile <768px, siguiendo reglas Sheet (≤6 campos) / FullScreen (≥7 campos) del diseño UX/UI |
| **DoD-04** | Empty state implementado: si no hay datos, muestra ícono 96px + heading semibold + body secondary + CTA primary |
| **DoD-05** | Loading state: skeleton shimmer mientras carga, sin layout shift |
| **DoD-06** | Error handling: errores inline en formularios (onBlur), toast para errores de servidor, formulario permanece abierto con datos intactos |
| **DoD-07** | ConfirmDialog para acciones destructivas: texto específico por entidad, botón rojo de confirmación |
| **DoD-08** | Soft delete: `UPDATE activo = false`, no DELETE físico. Verificado en pruebas |
| **DoD-09** | Permisos por rol: Server Action bloquea según matriz del FRD. Recepcionista no puede crear historial, vet no puede gestionar usuarios |
| **DoD-10** | Accesibilidad: `role`, `aria-*`, contraste ≥4.5:1, touch targets ≥44×44px, keyboard navegable, `prefers-reduced-motion` |
| **DoD-11** | Código en español: variables, funciones, archivos, commits. camelCase funciones, kebab-case archivos |
| **DoD-12** | Sin `any` en TypeScript. Strict mode. Schemas Zod como fuente de verdad de tipos de entrada |

---

## 2. Épicas

| ID | Épica | Módulos | Sprint |
|---|---|---|---|
| **E-01** | Fundación técnica | — | Sprint 0 |
| **E-02** | Autenticación y tenancy | Clínicas, Usuarios | Sprint 1 |
| **E-03** | Gestión de pacientes | Dueños, Mascotas | Sprint 1 |
| **E-04** | Agenda de citas | Citas | Sprint 2 |
| **E-05** | Historial médico | Historial Médico | Sprint 3 |
| **E-06** | Vacunas y recordatorios | Vacunas | Sprint 3 |
| **E-07** | Dashboard de negocio | Dashboard | Sprint 4 |
| **E-08** | Refinamiento y calidad | Transversal | Sprint 4 |

---

## 3. Mapa de Dependencias

```
Sprint 0 ──→ Sprint 1 ──→ Sprint 2 ──→ Sprint 3 ──→ Sprint 4
Fundación     Auth         Agenda       Historial    Dashboard
técnica       Dueños                    Vacunas      Refinamiento
              Mascotas                               UX
```

| Dependencia | Origen | Destino | ¿Qué lo bloquea? |
|---|---|---|---|
| Supabase DDL + RLS | S0 | S1–S4 | Sin DB no hay operaciones |
| Auth magic links + middleware | S0 | S1–S4 | Sin sesión no hay usuarios autenticados |
| Layout dashboard | S0 | S1–S4 | Sin sidebar no hay navegación |
| Helpers auth + permisos | S0 | S1–S4 | Sin getCurrentUser no hay clinic_id |
| CRUD Dueños | S1 | S2 | Citas necesitan dueños y mascotas |
| CRUD Mascotas | S1 | S2, S3 | Citas + historial + vacunas necesitan mascotas |
| CRUD Citas | S2 | S4 | Dashboard necesita datos de citas |
| Timeline historial | S3 | — | Independiente post-mascotas |
| Vacunas | S3 | — | Independiente post-mascotas |
| Dashboard | S4 | — | Depende de citas + mascotas |

---

## 4. Sprint 0 — Fundación Técnica (Semanas 1-2)

**Objetivo:** Establecer toda la infraestructura base: proyecto compilable, DB desplegada, auth configurada, CI/CD verde, testing listo. Sin funcionalidad de negocio.

**Dependencias de entrada:** Decisiones DP-01, DP-02, DP-04 del PRD resueltas (stack backend, DB provider, modo offline).

**Dependencias de salida:** Sprint 0 completo es prerequisito para cualquier funcionalidad de negocio.

### HU-01: Proyecto Next.js inicializado

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como desarrollador, quiero un proyecto Next.js 15 con TypeScript, Tailwind y shadcn/ui configurados para empezar a desarrollar componentes. |
| **Criterios de aceptación** | • `npm run dev` compila y abre en localhost<br>• Tailwind funciona (clases aplicadas en UI)<br>• shadcn/ui instalado con button, card, input, dialog, sheet, select, toast, skeleton, avatar, badge<br>• `tsconfig.json` en strict mode |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 3 pts |

**Tareas técnicas:**
- `create-next-app@latest` con TypeScript, App Router, Tailwind
- Instalar shadcn/ui (button, card, input, dialog, sheet, select, toast, skeleton, avatar, badge)
- Configurar `tsconfig.json` con `strict: true`
- Configurar `tailwind.config.ts` con colores del brand (azul `#3B82F6`, verde `#16A34A`, rojo `#DC2626`, gris `#6B7280`)
- Verificar build exitoso: `npm run build`

### HU-02: Supabase project configurado + DDL ejecutado

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como desarrollador, quiero la base de datos PostgreSQL con las 9 tablas, índices, RLS, funciones y seed data listos para conectar desde Next.js. |
| **Criterios de aceptación** | • Las 9 tablas existen en Supabase (clinicas, usuarios, duenos, especies, mascotas, citas, historial_medico, catalogo_vacunas, vacunas)<br>• CHECK constraints aplicados en todas las listas cerradas<br>• Índices de performance creados (12 índices del diseño)<br>• Función `get_user_clinic_id()` existe<br>• RLS activado en todas las tablas con políticas correctas<br>• Seed de especies (3) y catalogo_vacunas (8) ejecutado<br>• Trigger `set_updated_at` creado en tablas correspondientes |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Crear proyecto Supabase (plan free)
- Script DDL: `supabase/migrations/001_schema.sql` — 9 tablas con CHECK, UNIQUE, FKs
- Script RLS: `supabase/migrations/002_rls.sql` — función + políticas por tabla
- Script índices: `supabase/migrations/003_indexes.sql` — 12 índices de performance
- Script trigger: `supabase/migrations/004_triggers.sql` — `set_updated_at` por tabla
- Script seed: `supabase/migrations/005_seed.sql` — especies + catalogo_vacunas
- Verificar `supabase db push` exitoso
- Configurar connection string en `.env.local`

### HU-03: Clientes Supabase configurados

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como desarrollador, quiero los 4 clientes de Supabase (browser, server, action, admin) configurados y tipados para usarlos según el contexto. |
| **Criterios de aceptación** | • `lib/supabase/client.ts` — browser client exportado<br>• `lib/supabase/server.ts` — server component client exportado<br>• `lib/supabase/action.ts` — server action client exportado<br>• `lib/supabase/admin.ts` — service role client exportado<br>• `lib/supabase/middleware.ts` — middleware client exportado<br>• Tipos generados con `supabase gen types` en `types/database.ts`<br>• Variables de entorno validadas al arrancar |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 3 pts |

**Tareas técnicas:**
- Instalar `@supabase/supabase-js`, `@supabase/ssr`
- Crear `lib/supabase/client.ts` — `createBrowserClient`
- Crear `lib/supabase/server.ts` — `createServerComponentClient`
- Crear `lib/supabase/action.ts` — `createServerActionClient`
- Crear `lib/supabase/admin.ts` — `createClient` con service_role key
- Crear `lib/supabase/middleware.ts` — `createMiddlewareClient`
- Generar tipos: `npx supabase gen types typescript --linked > types/database.ts`
- Validar en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### HU-04: Estructura de carpetas y scaffolding

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como desarrollador, quiero la estructura de carpetas definida en la arquitectura creada para trabajar por módulo sin conflictos. |
| **Criterios de aceptación** | • Carpetas `app/(public)`, `app/(dashboard)`, `components/ui`, `components/layout`, `components/shared`, `components/modals`, `actions/` (con subcarpetas auth, duenos, mascotas, citas, historial, vacunas, usuarios, shared), `lib/supabase`, `lib/auth`, `lib/validations`, `types/`, `hooks/`, `providers/`, `config/` creadas<br>• Route groups en app/ para layouts públicos y dashboard |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 2 pts |

**Tareas técnicas:**
- Crear `src/app/(public)/layout.tsx` y `src/app/(public)/login/page.tsx` (placeholder)
- Crear `src/app/(dashboard)/layout.tsx` (placeholder con sidebar + topbar)
- Crear `src/app/(dashboard)/inicio/page.tsx` (placeholder)
- Crear `src/app/(dashboard)/duenos/page.tsx` (placeholder)
- Crear `src/app/(dashboard)/mascotas/page.tsx` (placeholder)
- Crear `src/app/(dashboard)/agenda/page.tsx` (placeholder)
- Crear `src/app/(dashboard)/configuracion/clinica/page.tsx` (placeholder)
- Crear `src/app/(dashboard)/configuracion/usuarios/page.tsx` (placeholder)
- Crear `src/app/auth/callback/route.ts` (placeholder)
- Crear `src/app/onboarding/page.tsx` (placeholder)
- Crear archivos placeholder en cada carpeta de `actions/`
- Crear `config/constants.ts` con enums, colores slots, duración

### HU-05: Layout dashboard (Sidebar + Topbar)

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como usuario, quiero ver el layout base del dashboard con sidebar colapsable y topbar para navegar entre módulos. |
| **Criterios de aceptación** | • Sidebar con 6 ítems (Inicio, Agenda, Dueños, Mascotas, Configuración, Miembros)<br>• Sidebar colapsa a 64px icon-only con tooltip en hover<br>• Estado colapsado persiste en localStorage por usuario<br>• Topbar con hamburguesa (toggle sidebar), breadcrumb (solo desktop), búsqueda global placeholder (Cmd+K), avatar con iniciales<br>• Mobile: sidebar oculto, bottom tab visible con 5 íconos (Inicio, Agenda, Dueños, Mascotas, Más)<br>• Drawer completo desde "Más" con enlaces a Configuración (admin) y Cerrar sesión<br>• El layout se renderiza con skeleton mientras carga sesión |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Crear `components/layout/sidebar.tsx` con estado expandido/colapsado (localStorage), íconos Lucide, tooltip, ARIA
- Crear `components/layout/topbar.tsx` con hamburguesa, breadcrumb dinámico, search placeholder, avatar, nombre clínica
- Crear `components/layout/bottom-tab-mobile.tsx` con 5 tabs (64px altura, ícono 24px + label 12px)
- Crear `providers/clinic-provider.tsx` (contexto con clinic_id, rol, nombre)
- Layout dashboard une sidebar + topbar + main content

### HU-06: Auth — Magic links + Middleware

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como usuario, quiero iniciar sesión con magic link (solo email) para acceder a mi clínica sin recordar contraseñas. |
| **Criterios de aceptación** | • Página `/login` con input email + botón "Enviar magic link"<br>• Al enviar: toast "Revisa tu email. El enlace expira en 1 hora."<br>• Magic link → `/auth/callback` → intercambia código por sesión → redirect a `/inicio`<br>• Middleware redirige a `/login` si no hay sesión<br>• Si hay sesión pero usuario inactivo: redirect con mensaje<br>• Si clínica inactiva: redirect con mensaje<br>• Cerrar sesión desde avatar dropdown |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Crear `actions/auth/login.ts` — `signInWithOtp({ email })`
- Crear `app/(public)/login/page.tsx` con formulario + estado "email enviado"
- Crear `app/auth/callback/route.ts` — exchange code por session
- Crear `src/middleware.ts`: refrescar sesión, validar activo, redirect según estado
- Crear `lib/auth/get-session.ts`
- Crear `lib/auth/check-permission.ts` con matriz de permisos del FRD
- Botón "Cerrar sesión" en avatar dropdown → `signOut()`

### HU-07: CI/CD pipeline

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como desarrollador, quiero que cada push a `main` ejecute lint, typecheck, build y tests automáticamente para mantener calidad. |
| **Criterios de aceptación** | • GitHub Actions corre en cada push a main y PR<br>• Jobs: lint → typecheck → build → test<br>• Pipeline verde antes de merge<br>• Deploy automático a Vercel preview en PRs<br>• Deploy automático a producción en push a main |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 3 pts |

**Tareas técnicas:**
- Crear `.github/workflows/ci.yml` con `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`
- Configurar Vercel integration con GitHub
- Crear `.github/workflows/deploy.yml`
- Configurar variables de entorno en Vercel (production + preview)

### HU-08: Testing infrastructure

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como desarrollador, quiero Vitest configurado con testing library para escribir tests de Server Actions y componentes. |
| **Criterios de aceptación** | • Vitest instalado y configurado<br>• Test de ejemplo pasa (`npm run test`)<br>• Testing library para React components configurado<br>• Mock de Supabase disponible para tests |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 2 pts |

**Tareas técnicas:**
- Instalar `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Configurar `vitest.config.ts`
- Crear `tests/setup.ts` con mocks de Supabase
- Crear test de ejemplo: `tests/actions/ejemplo.test.ts`
- Script `npm run test` en `package.json`

### HU-09: Helpers de validación (Zod schemas)

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como desarrollador, quiero los schemas de validación Zod para cada módulo listos antes de empezar Server Actions. |
| **Criterios de aceptación** | • Schemas para: dueños, mascotas, citas, historial médico, vacunas, usuarios, clínicas<br>• Cada schema refleja validaciones del FRD (longitudes, formatos, requeridos)<br>• Tipos inferidos disponibles para TypeScript |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 3 pts |

**Tareas técnicas:**
- Crear `lib/validations/duenos.ts` — nombre (1-120), teléfono (10+ dígitos), email opcional
- Crear `lib/validations/mascotas.ts` — nombre req, especie_id req, raza obligatoria si especie=otro, fecha_nac no futura, peso ≤200
- Crear `lib/validations/citas.ts` — motivo ≥5 chars, fecha_hora no pasado, monto ≥0
- Crear `lib/validations/historial.ts` — diagnóstico ≥10 chars, fecha no futura
- Crear `lib/validations/vacunas.ts` — fecha_aplicacion no futura, fecha_proxima_dosis > fecha_aplicacion
- Crear `lib/validations/usuarios.ts` — email formato, nombre 1-100, rol válido
- Exportar `z.infer<typeof schema>` como tipos `CreateDuenoInput`, `UpdateMascotaInput`, etc.

### HU-10: Auth helpers (getCurrentUser, requireAuth, requireRole)

| Atributo | Valor |
|---|---|
| **Épica** | E-01 |
| **Historia** | Como desarrollador, quiero helpers reutilizables de autenticación y autorización para usar en cada Server Action. |
| **Criterios de aceptación** | • `getCurrentUser(userId)` retorna `{id, clinic_id, rol, nombre}` o null<br>• Cacheado por request (cache de servidor de Next.js)<br>• `checkPermission(rol, modulo, accion)` retorna boolean según matriz del FRD<br>• Helper `requireRole(rol, modulo, accion)` que retorna error si no tiene permiso |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 3 pts |

**Tareas técnicas:**
- Crear `lib/auth/get-current-user.ts` con `cache()` de React
- Crear `lib/auth/check-permission.ts` con matriz de permisos del FRD
- Template de Server Action con los 6 pasos de seguridad

### Sprint 0 — Definition of Done específica

| Requisito |
|---|
| ✅ `npm run dev` funciona, `npm run build` pasa sin errores |
| ✅ Supabase project con 9 tablas, RLS, índices, seed data |
| ✅ CI/CD pipeline verde en push a main |
| ✅ Login con magic link funcional (enviar email → recibir link → sesión creada) |
| ✅ Middleware protege rutas dashboard |
| ✅ Layout dashboard visible con sidebar, topbar, bottom tab mobile |
| ✅ Helpers de auth listos para consumir en Sprint 1 |

---

## 5. Sprint 1 — Autenticación + Dueños + Mascotas (Semanas 3-4)

**Objetivo:** Implementar registro de clínica, gestión de staff, CRUD completo de dueños y mascotas con alta rápida, búsqueda global y aislamiento multi-tenant.

**Dependencias de entrada:** Sprint 0 completado.

**Dependencias de salida:** Sprint 2 (Citas) depende de Dueños + Mascotas completos.

### H-01: Registro de clínica + admin

| Atributo | Valor |
|---|---|
| **Épica** | E-02 |
| **Historia** | Como dueño de clínica, quiero registrar mi clínica con solo email y nombre para empezar a usar la plataforma en segundos. |
| **Criterios de aceptación** | • Formulario público: Email + Nombre clínica<br>• Server Action usa service_role: crea auth user + clínica + usuario admin en transacción<br>• Genera magic link y lo envía al email<br>• Toast "Revisa tu email para activar tu cuenta"<br>• Slug generado automáticamente del nombre<br>• Error si email ya registrado |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Server Action `actions/auth/registro.ts`: validar (Zod), crear auth user, INSERT clinicas, INSERT usuarios, generar magic link
- Página pública `/registro` con formulario + estado "cuenta creada, revisa tu email"
- Manejo de errores: email ya existe, slug duplicado

### H-02: Invitar usuario (staff)

| Atributo | Valor |
|---|---|
| **Épica** | E-02 |
| **Historia** | Como admin, quiero invitar miembros del staff por email con un rol específico para que se unan a mi clínica. |
| **Criterios de aceptación** | • Modal con Email*, Nombre*, Rol* (admin/vet/recepcionista)<br>• Server Action verifica sesión + rol = admin<br>• Crea auth user + INSERT en usuarios con rol, envía magic link<br>• Usuario aparece como "Pendiente" en la tabla de miembros<br>• Error si email ya existe en la clínica<br>• No se puede invitar a sí mismo |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Server Action `actions/auth/invitacion.ts` con service_role
- Página `app/(dashboard)/configuracion/usuarios/page.tsx`
- Componente `modals/invitar-usuario-modal.tsx` (Sheet mobile)
- DataTable con miembros (nombre, email, rol, estado, acciones ⋮)
- Menú ⋮: Cambiar rol, Desactivar
- Validaciones: al menos 1 admin activo, no desactivar owner ni sí mismo

### H-03: CRUD Dueños + búsqueda

| Atributo | Valor |
|---|---|
| **Épica** | E-03 |
| **Historia** | Como recepcionista, quiero registrar dueños con nombre y teléfono, buscarlos rápido y desactivarlos cuando sea necesario. |
| **Criterios de aceptación** | • Crear dueño: Nombre*, Teléfono*, Email(opc), Dirección(opc)<br>• Búsqueda por nombre o teléfono con resultados en <500ms<br>• Editar dueño (todos los campos)<br>• Ver perfil con lista de mascotas<br>• Desactivar dueño: validar que no tenga mascotas activas<br>• Teléfono único por clínica |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 8 pts |

**Tareas técnicas:**
- Server Actions: `actions/duenos/crear.ts`, `actions/duenos/editar.ts`, `actions/duenos/desactivar.ts` (con verificación mascotas activas), `actions/duenos/buscar.ts`
- Página `app/(dashboard)/duenos/page.tsx` con DataTable + búsqueda
- Página `app/(dashboard)/duenos/[id]/page.tsx` — perfil dueño + lista mascotas
- Modal/Sheet `modals/crear-dueno-modal.tsx`
- Empty state: "Aún no has registrado ningún dueño." + CTA
- Skeleton en carga de tabla. ConfirmDialog al desactivar

### H-04: CRUD Mascotas + alta rápida

| Atributo | Valor |
|---|---|
| **Épica** | E-03 |
| **Historia** | Como recepcionista, quiero registrar una mascota vinculada a su dueño, y poder registrar dueño+mascota en la misma pantalla en <60 segundos. |
| **Criterios de aceptación** | • Crear mascota: Nombre*, Especie*, Raza(opc), Color(opc), Sexo(opc), Peso(opc), Fecha nac(opc), Esterilizado(opc), Dueño*<br>• Alta rápida: dueño + mascota en misma pantalla (mascota en sección expandible)<br>• Botón "Guardar solo dueño" disponible<br>• Buscar mascotas por nombre o nombre de dueño<br>• Editar mascota con restricción por rol<br>• Desactivar mascota (no puede agendar nuevas citas)<br>• Ficha unificada con tabs: Datos, Línea tiempo, Vacunas |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 8 pts |

**Tareas técnicas:**
- Server Actions: `actions/mascotas/crear.ts`, `actions/mascotas/editar.ts`, `actions/mascotas/desactivar.ts`, `actions/mascotas/buscar.ts`
- Página `app/(dashboard)/mascotas/page.tsx` — búsqueda global de mascotas
- Página `app/(dashboard)/mascotas/[id]/page.tsx` — ficha con tabs
- Componente `modals/alta-rapida-dueno-mascota.tsx` con sección expandible
- Autocomplete para buscar dueño existente por teléfono
- Empty states por tab

### H-05: Búsqueda global

| Atributo | Valor |
|---|---|
| **Épica** | E-03 |
| **Historia** | Como recepcionista, quiero buscar dueños y mascotas desde cualquier pantalla usando Cmd+K para encontrar fichas rápido. |
| **Criterios de aceptación** | • `Cmd+K` / `Ctrl+K` abre búsqueda desde cualquier pantalla<br>• Resultados agrupados: Dueños + Mascotas<br>• Búsqueda desde 2 caracteres, máx 10 resultados por grupo<br>• Click navega a la ficha correspondiente<br>• Solo muestra registros activos<br>• Mobile: pantalla completa de búsqueda |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Server Action `actions/shared/buscar-global.ts` — busca en duenos (nombre, telefono) y mascotas (nombre) con `WHERE activo = true`
- Componente `components/layout/search-global.tsx` con overlay
- Desktop: overlay dropdown. Mobile: pantalla completa
- `Cmd+K` listener en todo el layout dashboard. ARIA: `role="search"`

### Sprint 1 — Definition of Done específica

| Requisito |
|---|
| ✅ Flujo completo: registro clínica → magic link → login → dashboard |
| ✅ Dueño + mascota registrados en <60s |
| ✅ Búsqueda por nombre/teléfono encuentra resultados |
| ✅ Staff invitado recibe email y accede con su rol |
| ✅ Soft delete en dueños y mascotas |

---

## 6. Sprint 2 — Agenda de Citas (Semanas 5-6)

**Objetivo:** Implementar la agenda con vista diaria y semanal, slots de 30 min fijos, creación en 3 clics, edición, cancelación, completado y validación de doble reserva.

**Dependencias de entrada:** Sprint 1 (Dueños + Mascotas listos para seleccionar en citas).

**Dependencias de salida:** Sprint 4 (Dashboard necesita citas completadas con monto).

### H-06: Vista de agenda (día y semana)

| Atributo | Valor |
|---|---|
| **Épica** | E-04 |
| **Historia** | Como recepcionista, quiero ver la agenda del día y la semana con slots de 30 minutos para saber qué citas hay y dónde hay espacios libres. |
| **Criterios de aceptación** | • Vista día: grid con 16 filas (09:00-13:00, 14:00-18:00) × columnas por veterinario<br>• Vista semana: 7 columnas (lun-sáb) con cards de citas<br>• Slots libres: blancos, clickeables, hover con borde punteado azul<br>• Slots ocupados: color según estado (azul/verde/rojo/gris)<br>• Altura fija 60px por slot<br>• Mobile: lista vertical ordenada por hora, sin grid<br>• Navegación entre días/semanas con flechas |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 8 pts |

**Tareas técnicas:**
- Componente `components/calendar/calendar-grid.tsx` (vista día)
- Componente `components/calendar/calendar-week.tsx` (vista semanal)
- Componente `components/calendar/empty-slot.tsx` (slot clickeable)
- Página `app/(dashboard)/agenda/page.tsx` con selector día/semana
- Mobile: componente `components/calendar/mobile-day-list.tsx`
- Colores: azul `#3B82F6`, verde `#22C55E`, rojo `#EF4444`, gris `#9CA3AF`

### H-07: Crear cita (máximo 3 clics)

| Atributo | Valor |
|---|---|
| **Épica** | E-04 |
| **Historia** | Como recepcionista, quiero crear una cita en máximo 3 clics: click en slot, seleccionar mascota, guardar. |
| **Criterios de aceptación** | • Click en slot vacío → modal crear cita<br>• Autocomplete mascota desde 2 caracteres<br>• Dropdown veterinario precargado (rol vet o admin)<br>• Fecha+hora precargadas del slot clickeado<br>• Motivo (autofocus, mínimo 5 caracteres)<br>• Guardar con Enter o clic<br>• Validación de disponibilidad en tiempo real (sin dobles reservas)<br>• Si hay conflicto: mensaje inline + sugerencia de slots alternativos<br>• Target <30s |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 8 pts |

**Tareas técnicas:**
- Server Action `actions/citas/crear.ts`: verificar disponibilidad, INSERT con clinic_id del server
- Componente `modals/crear-cita-modal.tsx`: modal desktop, Sheet mobile, autocomplete con debounce, date+time picker, validación onBlur
- Componente `components/autocomplete-mascota.tsx`
- Validación de disponibilidad inline al cambiar fecha/hora/vet

### H-08: Editar, cancelar y completar cita

| Atributo | Valor |
|---|---|
| **Épica** | E-04 |
| **Historia** | Como recepcionista, quiero editar una cita existente, cancelarla con motivo, o marcarla como completada con monto. |
| **Criterios de aceptación** | • Click en slot ocupado → modal ver/editar<br>• Editar: cambiar fecha, hora, vet o motivo<br>• Cancelar: pedir motivo (opcional), estado pasa a cancelada<br>• Completar: ingresar monto (opcional), estado pasa a completada<br>• No-show: marcar sin asistencia<br>• Transiciones de estado válidas según FRD<br>• Cita cancelada no se puede modificar ni reactivar. Cita completada es terminal |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Server Actions: `actions/citas/editar.ts` (con re-validación de disponibilidad), `actions/citas/cancelar.ts`, `actions/citas/completar.ts`, `actions/citas/marcar-no-show.ts`
- Componente `modals/ver-cita-modal.tsx` con info + botones de acción según estado
- Solo vet/admin pueden completar
- ConfirmDialog para cancelar con texto específico

### H-09: Doble reserva — validación en Server Action

| Atributo | Valor |
|---|---|
| **Épica** | E-04 |
| **Historia** | Como recepcionista, quiero que el sistema me impida agendar dos citas al mismo veterinario en el mismo horario. |
| **Criterios de aceptación** | • Al crear cita: SELECT count WHERE veterinario_id, fecha_hora, estado=confirmada<br>• Si existe conflicto: error inline + sugerencia "¿Quieres ver horarios disponibles?"<br>• Al editar cita: misma validación, excluyendo la cita actual<br>• Race condition: la validación ocurre en la misma transacción, botón deshabilitado tras primer clic |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 3 pts |

**Tareas técnicas:**
- Lógica de validación en `actions/citas/crear.ts` y `actions/citas/editar.ts`
- Query con índice `idx_citas_vet_fecha_estado`
- Sugerencia de slots alternativos: slots libres del mismo día para el mismo vet
- Deshabilitar botón Guardar después del primer clic

### Sprint 2 — Definition of Done específica

| Requisito |
|---|
| ✅ Vista día y semana funcionales con slots de 30 min |
| ✅ Crear cita en 3 clics, target <30s |
| ✅ Doble reserva rechazada con mensaje claro |
| ✅ Estados y transiciones de cita correctos |
| ✅ Agenda mobile en lista vertical |

---

## 7. Sprint 3 — Historial Médico + Vacunas (Semanas 7-8)

**Objetivo:** Implementar la línea de tiempo del historial médico, registro de consultas y cirugías con edición restringida a 24h, y registro de vacunas con catálogo semilla. Recordatorios por email movidos fuera de Sprint.

**Dependencias de entrada:** Sprint 1 (Mascotas listas para asociar historial y vacunas).

### H-10: Timeline de historial médico

| Atributo | Valor |
|---|---|
| **Épica** | E-05 |
| **Historia** | Como veterinario, quiero ver el historial completo de un paciente en una línea de tiempo cronológica para diagnosticar más rápido. |
| **Criterios de aceptación** | • Eventos ordenados del más reciente al más antiguo<br>• Muestra consultas (azul), cirugías (rojo), vacunas (verde) mezclados<br>• Cada evento: fecha, tipo, diagnóstico/resumen<br>• Cards expandibles con detalle completo al click<br>• Scroll infinito (20 eventos por carga)<br>• Solo lectura para recepcionista |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Query unificada: `UNION ALL` de `historial_medico` y `vacunas`, `ORDER BY fecha DESC`
- Componente `components/shared/timeline.tsx` con cards expandibles
- Server Action `actions/historial/obtener-timeline.ts` con paginación
- Tab de "Línea de tiempo" en ficha de mascota (`/mascotas/[id]`)
- ARIA: `aria-label="Evento de {tipo}: {resumen}"`
- Skeleton para carga de timeline (3 cards)

### H-11: Registrar consulta/cirugía + edición 24h (COMPLETADO ✅)

| Atributo | Valor |
|---|---|
| **Épica** | E-05 |
| **Historia** | Como veterinario, quiero registrar consultas y cirugías con diagnóstico y tratamiento, y poder corregir tratamiento/notas hasta 24h después, para documentar la atención manteniendo integridad del registro. |
| **Criterios de aceptación** | • Botón "Nuevo evento" en timeline con 6 tipos: consulta, cirugía, hospitalización, control, procedimiento, otro<br>• Campos: Fecha* (hoy default, no futura), Diagnóstico* (≥10 chars), Tratamiento(opc), Notas(opc)<br>• Solo vet/admin pueden crear; recepcionista ve timeline sin botón<br>• Al guardar, evento aparece en timeline inmediatamente<br>• Edición ≤24h: solo `tratamiento` y `notas` editables (inline en card expandido)<br>• `fecha`, `tipo`, `diagnóstico` son inmutables siempre<br>• Después de 24h: badge "Solo lectura" con candado, sin botón editar<br>• Comparación de fecha por string ISO (YYYY-MM-DD) para evitar bugs con hora del día |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 8 pts (H-11 + H-12 original fusionados) |

**Tareas técnicas:**
- Server Action `actions/historial/crear-evento.ts`: INSERT con validación fecha no futura, diagnóstico ≥10 chars, mascota activa
- Server Action `actions/historial/editar-evento.ts`: UPDATE solo tratamiento/notas, verificación ventana 24h
- Modal `registrar-evento-modal.tsx` (Dialog, no Sheet, por tener >4 campos)
- Edición inline en `TimelineCard` con textareas para tratamiento/notas
- Badge "Editable"/"Solo lectura" según ventana 24h + permiso
- 6 tipos con colores: consulta (azul), cirugía (rojo), hospitalización (púrpura), control (ámbar), procedimiento (naranja), otro (gris)

### H-12: Registrar vacuna

| Atributo | Valor |
|---|---|
| **Épica** | E-06 |
| **Historia** | Como veterinario, quiero registrar una vacuna aplicada seleccionando el tipo del catálogo, con lote y próxima dosis, para llevar el control de vacunación. |
| **Criterios de aceptación** | • Selector de tipo desde catálogo semilla (no texto libre)<br>• Catálogo filtrado por especie de la mascota (incluye "Otra" con especie_id=NULL)<br>• Campos: Tipo*, Lote(opc), Fecha aplicación*, Próxima dosis(opc), Aplicado por*<br>• Al guardar: aparece en ficha de vacunas y en timeline<br>• Si próxima dosis existe → sistema agenda recordatorio<br>• No fecha futura en aplicación |
| **Prioridad** | 🔴 Crítica |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Server Action `actions/vacunas/registrar.ts`
- Tab de "Vacunas" en ficha de mascota
- Componente `modals/registrar-vacuna-modal.tsx` (Sheet mobile)
- Select filtrado por especie_id de la mascota
- Autocomplete `aplicado_por` (usuarios rol vet o admin)
- Empty state: "Este paciente no tiene vacunas registradas." + CTA

### H-13: Recordatorio automático de vacunas — worker (FUERA DE SPRINT)

| Atributo | Valor |
|---|---|
| **Épica** | E-06 |
| **Historia** | Como sistema, quiero enviar recordatorios por email al dueño 7 días antes de la próxima dosis de vacuna, para que no olvide el refuerzo. |
| **Criterios de aceptación** | • Worker CRON (Vercel) revisa diario vacunas con `fecha_proxima_dosis` en 7 días<br>• Envía email vía Resend: nombre mascota, tipo vacuna, fecha próxima dosis, datos clínica<br>• Si fecha ya pasó y no hay nueva vacuna, re-envía cada 7 días (máx 3 veces)<br>• Contador `recordatorio_enviado` se incrementa<br>• Al llegar a 3, se detienen los envíos<br>• Vet puede ver contador en ficha de vacuna |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 8 pts |

**Tareas técnicas:**
- Ruta API `app/api/cron/recordatorios-vacunas/route.ts` (Vercel CRON)
- Query: JOIN vacunas + mascotas + duenos + clinicas + catalogo_vacunas, filtro por fecha_proxima_dosis
- Template email con Resend
- UPDATE `recordatorio_enviado = recordatorio_enviado + 1`
- Configurar `vercel.json` con cron schedule (`"schedule": "0 8 * * *"`)
- Mostrar contador en ficha de vacuna: "Recordatorios enviados: 2/3"

### Sprint 3 — Definition of Done específica

| Requisito |
|---|
| ✅ Timeline unificado muestra consultas, cirugías, hospitalizaciones, controles, procedimientos, otros y vacunas |
| ✅ Crear consulta/cirugía con 6 tipos, validación fecha no futura, diagnóstico ≥10 chars |
| ✅ Edición bloqueada después de 24h (solo tratamiento/notas editables) |
| ✅ Filtros de búsqueda por palabra clave + rango de fechas en timeline |
| ✅ Vacuna registrada aparece en ficha + timeline (H-12 pendiente) |
| ✅ Worker de recordatorios postergado (fuera de Sprint) |

---

## 8. Sprint 4 — Dashboard + Refinamiento (Semanas 9-10)

**Objetivo:** Implementar el dashboard con 5 widgets de métricas del negocio (ingresos, ocupación, top servicios, pacientes, próximas citas) con datos cacheados, y realizar refinamiento UX general en toda la plataforma.

**Dependencias de entrada:** Sprint 2 (citas con monto y estados) y Sprint 3 (mascotas con historial).

### H-15: Dashboard — Widget de ingresos

| Atributo | Valor |
|---|---|
| **Épica** | E-07 |
| **Historia** | Como dueño de clínica, quiero ver una gráfica de barras con los ingresos del día/semana/mes para saber si el negocio va bien. |
| **Criterios de aceptación** | • Gráfica de barras: ingresos diarios (semana actual vs anterior)<br>• Total ingresos del mes actual<br>• Tooltip con valor exacto al hover<br>• Datos cacheados (máx 5 min de desfase)<br>• Empty state si no hay ingresos<br>• Skeleton shimmer mientras carga |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Server Action `actions/dashboard/obtener-ingresos.ts`: `SELECT DATE(fecha_hora), SUM(monto) FROM citas WHERE estado='completada' GROUP BY DATE`
- Componente `components/dashboard/ingresos-widget.tsx` con gráfica de barras (recharts o SVG)
- Selector de período: día, semana, mes
- Caché de servidor con revalidation cada 5 min
- Empty state + CTA "Registrar primera cita"

### H-16: Dashboard — Ocupación de agenda

| Atributo | Valor |
|---|---|
| **Épica** | E-07 |
| **Historia** | Como dueño de clínica, quiero ver el porcentaje de ocupación de la agenda para saber si necesito más veterinarios. |
| **Criterios de aceptación** | • % ocupación = (citas completadas + confirmadas + no-show) / (días × 16 slots × n veterinarios)<br>• Barra de progreso + valor numérico<br>• Período día/semana/més<br>• Empty state si no hay citas |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 3 pts |

**Tareas técnicas:**
- Server Action `actions/dashboard/obtener-ocupacion.ts`
- Componente `components/dashboard/ocupacion-widget.tsx` con barra de progreso
- Fórmula según RN-DB-02 del FRD

### H-17: Dashboard — Top 5 servicios

| Atributo | Valor |
|---|---|
| **Épica** | E-07 |
| **Historia** | Como dueño de clínica, quiero ver qué servicios generan más ingresos para decidir qué promocionar. |
| **Criterios de aceptación** | • Top 5 motivos de cita más frecuentes del mes<br>• Gráfica de barras horizontal<br>• Basado en motivo de citas completadas<br>• Empty state |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 3 pts |

**Tareas técnicas:**
- Server Action `actions/dashboard/obtener-top-servicios.ts`
- Componente `components/dashboard/top-servicios-widget.tsx`

### H-18: Dashboard — Pacientes activos

| Atributo | Valor |
|---|---|
| **Épica** | E-07 |
| **Historia** | Como dueño de clínica, quiero ver cuántas mascotas tengo registradas vs cuántas atenciones he tenido este período. |
| **Criterios de aceptación** | • Total mascotas activas<br>• Atenciones del período (citas completadas)<br>• Tarjeta con número grande + label<br>• Empty state |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 2 pts |

**Tareas técnicas:**
- Server Action `actions/dashboard/obtener-pacientes.ts`
- Componente `components/dashboard/pacientes-widget.tsx`

### H-19: Dashboard — Próximas citas del día

| Atributo | Valor |
|---|---|
| **Épica** | E-07 |
| **Historia** | Como veterinario, quiero ver mis citas de hoy al abrir el dashboard para prepararme antes de que lleguen. |
| **Criterios de aceptación** | • Admin: todas las citas confirmadas de hoy<br>• Vet: solo sus citas (filtradas por veterinario_id)<br>• Lista: hora, nombre mascota, dueño, motivo<br>• Cada item es link a la ficha de la mascota<br>• Empty state |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 3 pts |

**Tareas técnicas:**
- Server Action `actions/dashboard/obtener-proximas-citas.ts` con filtro por rol
- Componente `components/dashboard/proximas-citas-widget.tsx`
- Recepcionista: sin acceso al widget

### H-20: Dashboard — Layout con 5 widgets

| Atributo | Valor |
|---|---|
| **Épica** | E-07 |
| **Historia** | Como admin, quiero ver los 5 widgets organizados en una cuadrícula para entender el estado del negocio en <10 segundos. |
| **Criterios de aceptación** | • Grid 3 columnas desktop, 2 tablet, 1 mobile<br>• Skeleton shimmer en cada widget mientras carga<br>• Layout se renderiza inmediatamente sin layout shift<br>• Datos cacheados 5 min<br>• Recepcionista: sin acceso al dashboard (redirect o 403) |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 5 pts |

**Tareas técnicas:**
- Página `app/(dashboard)/inicio/page.tsx` con grid CSS responsive
- Carga paralela de todos los widgets con Promise.all
- Caché de servidor con `revalidate = 300` (5 min)
- Protección por rol en el layout del dashboard
- Skeleton por cada widget (MetricCard skeleton)
- Empty state por widget con CTA específico

### H-21: Refinamiento UX general

| Atributo | Valor |
|---|---|
| **Épica** | E-08 |
| **Historia** | Como usuario, quiero que la plataforma se sienta pulida: animaciones suaves, errores claros, transiciones sin saltos. |
| **Criterios de aceptación** | • Todos los formularios tienen validación onBlur<br>• Todos los botones primarios muestran spinner en carga<br>• Todos los modales/Sheet tienen foco atrapado y cierran con Escape<br>• Todas las tablas tienen paginación o scroll infinito<br>• Todos los empty states siguen el patrón visual del UX/UI<br>• Todas las acciones destructivas tienen ConfirmDialog<br>• Keyboard shortcuts funcionan (Cmd+K, Cmd+Enter, Escape)<br>• Sin layout shift en carga (skeleton heights fijos)<br>• prefers-reduced-motion: animaciones desactivadas |
| **Prioridad** | 🟡 Alta |
| **Estimación** | 8 pts |

**Tareas técnicas:**
- Auditoría de formularios: validación onBlur, errores inline, Cmd+Enter
- Auditoría de empty states: patrón ícono 96px + heading + body + CTA
- Auditoría de modales: focus trap, Escape, ARIA attributes
- Auditoría de skeletons: match de altura con contenido final
- Agregar `prefers-reduced-motion` en CSS global
- Agregar `skip to main content` link
- Revisar contraste de colores (ratio ≥4.5:1)
- Revisar touch targets ≥44×44px en mobile
- Pruebas de integración de los core flows

### Sprint 4 — Definition of Done específica

| Requisito |
|---|
| ✅ 5 widgets del dashboard funcionales con datos reales de citas y mascotas |
| ✅ Caché de 5 min implementado |
| ✅ Empty states con CTA en cada widget |
| ✅ Recepcionista sin acceso al dashboard |
| ✅ Plataforma completa funcional: todos los módulos integrados |
| ✅ UX pulida: validaciones, skeletons, empty states, confirmaciones, accesibilidad |

---

## Resumen del Backlog

| Sprint | Duración | Historias | Puntos totales | Entregable clave |
|---|---|---|---|---|
| Sprint 0 | Semanas 1-2 | 10 (todas técnicas) | 34 pts | Fundación técnica: proyecto, DB, auth, CI/CD, layout |
| Sprint 1 | Semanas 3-4 | 5 (H-01 a H-05) | 31 pts | Auth completo + Dueños + Mascotas + Búsqueda global |
| Sprint 2 | Semanas 5-6 | 4 (H-06 a H-09) | 24 pts | Agenda funcional con slots, creación, edición, estados |
| Sprint 3 | Semanas 7-8 | 3 (H-10 a H-12) | 18 pts | Historial médico, vacunas (recordatorios postergados) |
| Sprint 4 | Semanas 9-10 | 7 (H-15 a H-21) | 29 pts | Dashboard completo + refinamiento UX |
| **Total** | **10 semanas** | **29** | **136 pts** | **MVP v1.0 listo para beta cerrada** |

---

*Documento complementario al PRD v1.0, FRD v1.0, Architecture v1.0, Database v1.0 y UX/UI v1.0. Para contexto completo, referirse a los documentos de diseño previo.*
