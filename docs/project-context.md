# Vetyx.io — Project Context

| Versión | Fecha | Autor |
|---|---|---|
| 1.0 | 2026-06-12 | Senior PM |

**Documentos fuente:** `docs/01-prd.md`, `docs/02-frd.md`, `docs/03-architecture.md`, `docs/04-database.md`, `docs/05-ui-ux.md`

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

## Arquitectura

**Documentos de referencia:** `docs/03-architecture.md`, `docs/04-database.md`

### Decisiones de Base de Datos

| Decisión | Descripción |
|---|---|
| **D-DB-01: Species como tabla catálogo** | `especies` es tabla global (sin `clinic_id`), no PostgreSQL enum. Seed: Perro, Gato, Otro. Extensible sin migración ALTER TYPE. |
| **D-DB-02: Sin FK formal a auth.users** | `usuarios.id` referencia `auth.users.id` lógicamente sin constraint FK por política de Supabase. Integridad vía service_role en registro. |
| **D-DB-03: Raza como columna TEXT** | `mascotas.raza` es `VARCHAR(80)` opcional. Sin tabla `razas` en MVP. |
| **D-DB-04: Doble reserva validada en aplicación** | Server Action verifica disponibilidad antes de INSERT. Sin exclusión constraint en DB. |
| **D-DB-05: Sin tabla de auditoría separada** | Trazabilidad vía `created_by`, `updated_at`, soft deletes y ventana de edición 24h en historial médico. |

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

### PLAN #1 — PRD y FRD (docs/01-prd.md, docs/02-frd.md) ✅
- Producto, roadmap, KPIs, decisiones estratégicas.
- Requerimientos funcionales detallados de 8 módulos.

### PLAN #2 — Arquitectura (docs/03-architecture.md) ✅
- Arquitectura full-stack, multi-tenant, estructura de carpetas, seguridad.

### PLAN #3 — Base de Datos (docs/04-database.md) ✅
- Modelo conceptual, lógico, ERD, diccionario de datos, índices, RLS, tenant isolation.

### PLAN #4 — UX/UI (docs/05-ui-ux.md) ✅
- Diseño de UX/UI: navegación, 8 user flows, wireframes desktop+mobile, 16 componentes compartidos, 12 formularios, 14 empty states, accesibilidad (teclado, ARIA, contraste, screen reader, reduced motion, touch targets).

### PLAN #5 — Pendiente ⏳
- Próximo paso por definir.

---

*Documento de restauración de contexto. Actualizar al inicio de cada sesión para continuar el trabajo.*
