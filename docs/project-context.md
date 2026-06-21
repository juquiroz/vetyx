# Vetyx.io — Project Context

| Versión | Fecha | Autor |
|---|---|---|
| 2.0 | 2026-06-17 | Senior PM |

**Documentos fuente:** `docs/01-prd.md`, `docs/02-frd.md`, `docs/03-architecture.md`, `docs/04-database.md`, `docs/05-ui-ux.md`, `docs/06-backlog.md`

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
| **Frontend** | Next.js 16.2.9, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Backend** | Next Server Actions + Route Handlers (API Routes) |
| **Base de datos** | Supabase (PostgreSQL + RLS para tenancy) |
| **Auth** | Supabase Auth (magic links, sin contraseñas) |
| **Storage** | Supabase Storage (para fotos de mascotas, post-MVP) |
| **Email** | Resend (recordatorios de vacunas + SMTP supabase) |
| **Hosting** | Vercel |

**Decisiones de stack (documentadas en PRD D-13, D-07, D-04):**
- Next.js App Router unifica frontend + API en un solo deploy
- PostgreSQL con RLS para aislamiento multi-tenant
- Magic links sin contraseñas para mejor UX de registro
- Email primero; WhatsApp en fase 2 (D-05)

---

## Arquitectura

**Documentos de referencia:** `docs/03-architecture.md`, `docs/04-database.md`

### Decisiones de Base de Datos (ver sección completa arriba)

### Decisiones de Desarrollo

| Decisión | Descripción |
|---|---|
| **D-DB-01: Species como tabla catálogo** | `especies` es tabla global (sin `clinic_id`), no PostgreSQL enum. Seed: Perro, Gato, Otro. |
| **D-DB-02: Sin FK formal a auth.users** | `usuarios.id` referencia `auth.users.id` lógicamente sin constraint FK. Integridad vía service_role en registro. |
| **D-DB-03: Raza como columna TEXT** | `mascotas.raza` es `VARCHAR(80)` opcional. Sin tabla `razas` en MVP. |
| **D-DB-04: Doble reserva con exclusión constraint + validación en app** | Doble capa: (1) Server Action verifica disponibilidad antes de INSERT, (2) PostgreSQL exclusion constraint `excl_citas_solapamiento` con `btree_gist` + `tstzrange` en citas (estados `confirmed`, `in_progress`). Trigger `actualizar_rango_horario` setea `rango_horario` desde `fecha_hora + duracion_minutos`. |
| **D-DB-05: Sin tabla de auditoría separada** | Trazabilidad vía `created_by`, `updated_at`, soft deletes y ventana de edición 24h en historial. |
| **D-DEV-01: Dev auth bypass** | En desarrollo, el auth usa OTP verify server-side + `setSession()` en vez de email. `registrarClinica` y `generarLinkDev` generan sesión directa sin SMTP. Para producción, reemplazar con `signInWithOtp()` + Resend SMTP. |
| **D-DEV-02: obtenerSesion usa getUser()** | `getSession()` (cookies locales) puede devolver null aunque `getUser()` (server) retorne el usuario. Se usa `getUser()` en toda la app para consistencia. |

### Tenant Isolation y clinic_id

- `clinic_id UUID NOT NULL REFERENCES clinicas(id)` en 6 tablas de operación: `usuarios`, `duenos`, `mascotas`, `citas`, `historial_medico`, `vacunas`.
- Catálogos globales sin `clinic_id`: `especies`, `catalogo_vacunas`.
- Asignación siempre desde servidor vía `getCurrentUser().clinic_id`, nunca del input del cliente.
- Doble capa de validación: Server Action + RLS.

### Estrategia RLS

- Función base: `get_user_clinic_id()` retorna `usuarios.clinic_id` para `auth.uid()`.
- Tablas de operación: `FOR ALL` con `clinic_id = get_user_clinic_id()`.
- Tablas core (`clinicas`, `usuarios`): políticas específicas por rol (admin gestiona usuarios).
- Catálogos globales: `FOR SELECT` a cualquier usuario autenticado.
- Excepción: registro de clínica + invitación usan `service_role` (bypass RLS).

### Soft Delete

- `activo boolean DEFAULT true` en: `clinicas`, `usuarios`, `duenos`, `mascotas`.
- Sin soft delete en: `citas` (estados terminales), `historial_medico` (inmutable), `vacunas` (inmutable).

### Convenciones de Datos

| Ámbito | Convención | Ejemplo |
|---|---|---|
| Tablas | Plural español, snake_case | `historial_medico`, `catalogo_vacunas` |
| Columnas | snake_case | `fecha_proxima_dosis` |
| PK | `id UUID DEFAULT gen_random_uuid()` | `id` |
| FK | `tabla_origen_id` | `especie_id`, `mascota_id` |
| Listas cerradas | VARCHAR + CHECK (sin enums PostgreSQL) | `rol`: admin/vet/recepcionista |
| Booleanos | Sin prefijo `es_` | `activo`, `esterilizado` |

---

## UX/UI Design

**Documento de referencia:** `docs/05-ui-ux.md`

### Decisiones UX/UI

| Decisión | Descripción |
|---|---|
| **UX-01: Sidebar colapsable** | Desktop: 240px / 64px icon-only, estado persistido vía localStorage. Mobile: oculto, reemplazado por bottom tab + drawer. |
| **UX-02: Formularios mobile** | ≤6 campos → Sheet desde abajo (50-80% altura). ≥7 campos → pantalla completa con scroll. Ambos con action bar fija (Cancelar + Guardar). |
| **UX-03: Alta rápida dueño+mascota** | Mismo flujo, mascota en sección expandible. Botón "Guardar solo dueño" disponible. Target <60s. |
| **UX-04: Cita en 3 clics** | (1) Click slot vacío, (2) seleccionar mascota, (3) guardar. Target <30s. |
| **UX-05: Empty states** | Cada módulo/lista/búsqueda con ícono 96px + heading semibold + body secondary + CTA primary. |
| **UX-06: Skeleton loading** | Shimmer loading en widgets, tablas, timelines y perfiles. Sin layout shift. |
| **UX-07: Confirmaciones específicas** | Diálogo por entidad con texto contextual. Modal bloqueante si dueño tiene mascotas activas. |

### Navegación

- **Desktop:** Sidebar izquierdo (240px expandido / 64px colapsado) + Topbar superior con breadcrumb, búsqueda global (Cmd+K), nombre clínica y avatar con iniciales (sin foto MVP).
- **Mobile:** Bottom tab con 5 íconos (Inicio, Agenda, Dueños, Mascotas, Más). Drawer completo (80% ancho) desde hamburguesa o "Más" con enlaces a perfil, configuración (admin) y cerrar sesión.
- **Ítems sidebar:** Inicio, Agenda, Dueños, Mascotas, Configuración (admin solo), Miembros (admin solo).
- **Topbar:** Hamburguesa (toggle sidebar desktop / drawer mobile), breadcrumb (solo desktop), búsqueda global (overlay dropdown desktop / pantalla completa mobile), nombre clínica (solo desktop), avatar con dropdown "Cerrar sesión".
- **Búsqueda global:** `Cmd+K` / `Ctrl+K`. Resultados agrupados (dueños + mascotas) a partir de 2 caracteres.

### Desktop vs Mobile

| Elemento | Desktop (≥1024px) | Mobile (<768px) |
|---|---|---|
| Sidebar | Visible, 240px o 64px colapsado | Oculto. Bottom tab + drawer |
| Breadcrumb | Visible en topbar | Oculto |
| Agenda | Grid con slots + columnas por vet | Lista vertical, vista día |
| Dashboard | Grid 3 columnas | Stack vertical 1 columna |
| Modales | Modal centrado (max 600px) | Sheet o pantalla completa |
| DataTable | Tabla completa con columnas | Cards verticales + filtros |
| Timeline | Cards con padding amplio | Cards full width |
| Confirmaciones | Modal pequeño centrado | Sheet desde abajo |
| Perfil dueño/mascota | Layout 2 columnas | Layout 1 columna (scroll) |
| Búsqueda global | Input topbar + overlay dropdown | Pantalla completa |

### Formularios

- **Sheet mobile:** ≤6 campos, sin relaciones complejas. Sheet 50-80% altura con barra de acciones fija inferior.
- **FullScreen mobile:** ≥7 campos o requiere búsqueda+selección. Pantalla completa con scroll y barra de acciones fija.
- **Action bar:** Cancelar (ghost/left) + Guardar (primary/right) en toda instancia mobile.
- **12 formularios** mapeados: login (1 campo), registro clínica (2), dueño (4), dueño+mascota (9, sección expandible), mascota completa (9), cita (6), consulta (4), cirugía (4), vacuna (5), invitar usuario (3), editar clínica (4), editar usuario (1).
- **Optimizaciones recepcionista:** Autofocus al abrir, tab index secuencial, teléfono con mask +52, autocomplete desde 2 caracteres, Cmd+Enter para guardar, validación onBlur con errores inline, persistencia local al cerrar sin guardar, sin recarga de página (Server Action asíncrona).

### Restricciones UX

- Sin fotos de perfil en MVP — avatar usa iniciales + color asignado.
- Agenda mobile en lista vertical, no grid. Sin vista semanal en mobile.
- Dashboard por rol: admin ve 5 widgets, vet ve solo "Próximas citas" filtradas + "Pacientes activos", recepcionista sin acceso (redirect/403).
- Estados de cita no dependen exclusivamente de color — incluyen ícono + texto de estado.
- Touch targets ≥44×44px en mobile. Bottom tab con 48px de altura.
- Soporte `prefers-reduced-motion`: animaciones desactivadas, shimmer reemplazado por opacidad estática.
- Timeline de historial médico con cards expandibles y edición inline solo si `created_at < now() - 24h`.
- Validación de disponibilidad en tiempo real al seleccionar fecha+hora+vet en agenda.
- 14 ubicaciones con empty state documentadas, cada una con CTA específico.

---

## Roadmap de Ejecución

**Documento de referencia:** `docs/06-backlog.md`

**Backlog aprobado:** 31 historias de usuario organizadas en 5 sprints (Sprint 0–4), 144 puntos de estimación, 10 semanas de desarrollo.

| Sprint | Semanas | Enfoque | Historias | Puntos | Entregable |
|---|---|---|---|---|---|
| **Sprint 0** | 1–2 | Fundación técnica: proyecto, DB, auth, CI/CD, layout | 10 | 34 pts | Infraestructura base funcional |
| **Sprint 1** | 3–4 | Auth + Dueños + Mascotas + Búsqueda global | 5 | 31 pts | Registro clínica, staff, dueños, mascotas |
| **Sprint 2** | 5–6 | Agenda de citas | 4 | 24 pts | Vista día/semana, crear/editar/cancelar citas |
| **Sprint 3** | 7–8 | Historial médico + Vacunas + Recordatorios | 5 | 26 pts | Timeline, consultas, cirugías, vacunas, emails |
| **Sprint 4** | 9–10 | Dashboard + Refinamiento UX | 7 | 29 pts | 5 widgets dashboard, accesibilidad, pulido |

**Dependencias entre sprints:**

```
Sprint 0 ──→ Sprint 1 ──→ Sprint 2 ──→ Sprint 3 ──→ Sprint 4
Fundación     Auth         Agenda       Historial    Dashboard
técnica       Dueños                    Vacunas      Refinamiento
              Mascotas                               UX
```

- Sprint 0 es prerequisito de todos los demás (DB, auth, layout).
- Sprint 1 (Dueños + Mascotas) es prerequisito de Sprint 2 (Citas) y Sprint 3 (Historial + Vacunas).
- Sprint 2 (Citas) es prerequisito de Sprint 4 (Dashboard).
- Sprint 3 es independiente post-mascotas.

**Objetivo beta cerrada:** Al completar Sprint 4, el MVP v1.0 está listo para ser utilizado por las primeras 3–5 clínicas beta. El producto cubre los 8 módulos definidos en el alcance aprobado. La fase de beta cerrada y ventas (Sprint 5 del roadmap original del PRD) se ejecutará post-construcción con outreach directo, onboarding guiado y recolección de feedback.

**Definition of Done global:** 12 criterios obligatorios por historia (seguridad 6 pasos, RLS, responsive, empty states, skeletons, errores, confirmaciones, soft delete, permisos, accesibilidad, convenciones código, tipado estricto).

---

## Restricciones del MVP

1. **MVP pequeño y enfocado** — No agregar funcionalidades fuera del alcance aprobado en `docs/01-prd.md` y `docs/02-frd.md`.
2. **Sin IA** — No incluir modelos de lenguaje, clasificación automática, ni funcionalidades basadas en inteligencia artificial.
3. **Sin integraciones externas** — No conectar con APIs de terceros (laboratorios, pasarelas de pago, WhatsApp, etc.). Solo email (Resend) para recordatorios.
4. **Sin app móvil nativa** — PWA responsive es suficiente para MVP.
5. **Sin facturación electrónica** — Complejidad regulatoria varía por país; se pospone a fase 2.
6. **Sin portal del cliente** — El comprador es la clínica, no el dueño de la mascota.
7. **Sin multi-sucursal** — Pocas clínicas MVP operan con sucursales.
8. **Sin enums PostgreSQL** — Listas cerradas usan VARCHAR + CHECK. `especies` es tabla catálogo, no enum. Agregar especies post-MVP = INSERT, no ALTER TYPE.

---

## Estado Actual

### PLANs de diseño (docs/01-prd.md → docs/06-backlog.md) ✅
Los 6 documentos de diseño están completos y aprobados.

### BUILD — Sprint 0: Fundación Técnica
| Componente | Estado |
|---|---|
| Scaffold Next.js 16 + Tailwind v4 + shadcn/ui | ✅ |
| 5 clientes Supabase (browser, server, action, admin, middleware) | ✅ |
| Database types + domain models | ✅ |
| Dashboard layout (sidebar + topbar + ClinicProvider) | ✅ |
| Auth pages (login + registro) + callback | ✅ |
| Middleware con protección de rutas | ✅ |
| Auth helpers (obtenerSesion, obtenerUsuarioActual, verificarPermiso) | ✅ |
| Template Server Action (6-step checklist) | ✅ |
| Migration 001: 9 tablas + RLS + índices + seed | ✅ Aplicada |
| Migration 002: fix RLS function SECURITY DEFINER | ✅ Aplicada |
| Zod schemas para todos los módulos | ✅ |
| shadcn/ui components + Shared components | ✅ |
| Placeholder pages para todos los módulos | ✅ |
| Vitest + Testing Library configurado | ✅ |
| Dev auth bypass (OTP verify + setSession, sin email) | ✅ |
| Fix infinite redirect loop (getSession → getUser) | ✅ |
| `pnpm build` 0 errores, `pnpm tsc --noEmit` 0 errores, `pnpm lint` 0 errores | ✅ |

### Sprint 1 — Auth + Dueños + Mascotas
| Historia | Estado |
|---|---|
| H-01: Registro de clínica | ✅ Funcional (auto-login sin email) |
| H-02: Invitar staff | ✅ CRUD miembros + roles (DataTable + modales + Sonner) |
| H-03: CRUD dueños | ✅ Incluye cédula (migración 004) en todo el flujo |
| H-04: CRUD mascotas + alta rápida | ✅ Editar/Desactivar en ficha, alta rápida con cédula |
| H-05: Búsqueda global Cmd+K | ✅ Overlay con resultados agrupados, navegación por flechas |

### Sprint 2 — Agenda (Citas)
| Historia | Estado |
|---|---|---|
| H-09: Prevención doble reserva | ✅ Exclusion constraint + 25 tests + migraciones 005/006 |
| H-07 Fase A: Server Action crear cita | ✅ 8 tests |
| H-07 Fase B: Modal crear cita | ✅ 6 tests |
| H-06 Fase A: Motor agenda (mapear-dia, mapear-semana, obtener-citas-rango) | ✅ 18 tests |
| H-06 Fase B: UI Grid (agenda-grid, toolbar, column, slot, event-card) | ✅ Integrado en página agenda |
| H-08: UI editar/cancelar/completar cita | ✅ 23 tests (obtener, editar, cancelar, completar, marcar-no-show, transicionar-estado + modal detalle) |

### Sprint 3 — H-10: Timeline de historial médico
| Componente | Estado |
|---|---|
| `EventoTimeline` type (`src/types/timeline.ts`) | ✅ 8 tipos con ETIQUETAS_TIPO |
| Server Action `obtenerTimeline` (`src/actions/historial/obtener-timeline.ts`) | ✅ Merge historial_medico + vacunas, paginado, editable flag, filtros búsqueda + rango fechas |
| Componente `Timeline` (`src/components/historial/timeline.tsx`) | ✅ Client component con infinite scroll (IntersectionObserver) + barra de filtros |
| Componente `TimelineCard` (`src/components/historial/timeline-card.tsx`) | ✅ Expandible, colores por tipo (solo borde izquierdo), badge editable/solo-lectura, edición inline |
| Integración en ficha mascota (`mascotas/[id]/page.tsx`) | ✅ Tab Historial reemplazado con Timeline |
| Tests (16 tests) | ✅ |

### Sprint 3 — H-11: Registrar consulta/cirugía + edición 24h
| Componente | Estado |
|---|---|
| Server Action `crear-evento.ts` (`src/actions/historial/crear-evento.ts`) | ✅ INSERT con validación fecha no futura, diagnóstico ≥10 chars, mascota activa |
| Server Action `editar-evento.ts` (`src/actions/historial/editar-evento.ts`) | ✅ UPDATE solo tratamiento/notas, verificación ventana 24h |
| Modal `RegistrarEventoModal` (`src/components/historial/registrar-evento-modal.tsx`) | ✅ Dialog con 6 tipos + fecha + diagnóstico + tratamiento + notas |
| Edición inline en `TimelineCard` | ✅ Textareas para tratamiento/notas, botones guardar/cancelar |
| Página `/historial/[mascotaId]` | ✅ Página standalone con Timeline |
| Tests (19 tests: 9 crear + 10 editar) | ✅ |
| `src/lib/validations/historial.ts` | ✅ Esquemas actualizados con nuevos tipos |

### Decisiones técnicas (Sprint 3)
| Decisión | Descripción |
|---|---|
| **H-11-FECHA**: Comparación de fecha no futura con strings ISO | `fecha > hoy` se compara con `new Date().toISOString().slice(0, 10)` en vez de `new Date(fecha) > new Date()`, para que eventos del día de hoy no sean marcados como futuros cuando se ejecutan antes del mediodía. |
| **H-11-MOCK**: Mocks thenable retornan `this` | Los mocks encadenables (from/select/eq/order) deben retornar `this` (mismo objeto) para que `mockResolvedValueOnce` funcione. `vi.fn(() => crearCadena())` crea objetos nuevos y rompe las expectativas. |
| **H-11-TIPOS**: 6 tipos de evento | consulta, cirugía, hospitalizacion, control, procedimiento, otro. Cada uno con color de borde distinto (azul, rojo, púrpura, ámbar, naranja, slate). |
| **H-11-CARD**: Cards sin bg color | Se eliminaron `bg-*-50/50` porque eran invisibles en dark mode. Solo borde izquierdo coloreado como indicador. El fondo lo da `bg-card` de shadcn. |
| **H-11-TIMELINE**: Timeline autónomo | El componente maneja su propio header ("Línea de tiempo" + botón "Nuevo evento") y estado del modal, simplificando integración en páginas. |

### Bloqueos conocidos
- **SMTP/Resend**: El sender `onboarding@resend.dev` solo puede enviar al email del dueño de la cuenta Resend. Para producción se requiere un dominio verificado en Resend. Mientras tanto, el dev auth bypass funciona sin email.
- **Next.js 16 deprecation**: Middleware → Proxy. Advertencia presente en build, migrar cuando sea estable.

### Próximos pasos
1. **H-12 (Vacunas)**: CRUD vacunas + catálogo semilla. Server Actions `registrar-vacuna.ts`, `editar-vacuna.ts`, `obtener-catalogo.ts`. Modal `RegistrarVacunaModal` con catálogo filtrado por especie. Reemplazar lista inline en ficha mascota.

---

### Decisiones UX (Sprint 2)
| Decisión | Descripción |
|---|---|
| **UX-08: Slot vacío → Crear cita** | Click en slot de 30 min abre `CrearCitaModal` con fecha/hora prellenadas. No requiere seleccionar hora manualmente. |
| **UX-09: Slot ocupado → Detalle cita** | Click en evento existente abre `DetalleCitaModal` con info completa, edición inline, y acciones según estado. |
| **UX-10: Estados de cita con transiciones** | `scheduled → confirmed → in_progress → completed`. `scheduled/confirmed → cancelled`. `confirmed → no_show`. Estados terminales (completed, cancelled, no_show) son solo lectura. |
| **UX-11: Toolbar con toggle día/semana** | Tabs para cambiar vista. Select de veterinario (Todos + individual). Navegación por flechas (día: ±1 día, semana: ±7 días). |
| **UX-12: Colores por estado en grid** | Borde izquierdo + fondo suave por estado: blue (scheduled/confirmed), amber (in_progress), green (completed), red (cancelled), gray (no_show). |

### Deuda técnica (Sprint 2)
- `obtener-citas-rango.ts` excluye citas canceladas (`.neq("estado", "cancelled")`). Para detalle de cita cancelada, debería mostrarse pero no ser editable — el filtro está en el server action, no en el grid.
- `agenda-grid.tsx` no tiene tests de UI. El motor de agenda (mapear-dia, mapear-semana) sí tiene 13 tests.
- `DetalleCitaModal` no tiene tests. Depende de 6 Server Actions con 23 tests unitarios.
- Las sugerencias de horario alternativo en edición no se muestran en el modal (solo en creación). Puede agregarse en iteración futura.
- `esquemaEditarCita` no permite cambiar `estado`; `transicionar-estado.ts` maneja las transiciones simples por separado.

### Deuda técnica (Sprint 3)
- `cita_id` y `adjuntos` en modelo `EventoTimeline` son placeholders — no hay FK ni tabla de adjuntos implementada en DB.
- `obtener-timeline.ts` mergea historial + vacunas en JS (no UNION ALL en SQL). Suficiente para MVP pero no escala si una mascota tiene miles de eventos.
- Sin tests UI para Timeline, TimelineCard, RegistrarEventoModal. Solo tests de Server Actions.
- Los filtros de búsqueda en timeline recargan desde el server (no hay filtrado client-side en caché). Con el fetch actual (todo en memoria) es equivalente.
- El debounce de 300ms en filtros puede sentirse lento en conexiones lentas. Considerar filtrado client-side si se introduce SWR/React Query.

*Documento de restauración de contexto. Leer `docs/resume-next-session.md` al inicio de cada sesión.*
