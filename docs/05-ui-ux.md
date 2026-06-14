# Vetyx.io — UX/UI Design (MVP v1.0)

| Versión | Fecha | Autor | Estado |
|---|---|---|---|
| 1.0 | 2026-06-12 | Product Designer | Aprobado |

**Documentos fuente:** `docs/01-prd.md`, `docs/02-frd.md`, `docs/03-architecture.md`, `docs/04-database.md`

---

## Tabla de Contenidos

1. [Navegación Principal](#1-navegación-principal)
2. [User Flows](#2-user-flows)
3. [Wireframes por Módulo](#3-wireframes-por-módulo)
4. [Desktop vs Mobile](#4-desktop-vs-mobile)
5. [Componentes Compartidos](#5-componentes-compartidos)
6. [Estados Vacíos](#6-estados-vacíos)
7. [Formularios](#7-formularios)
8. [Acciones Rápidas y Confirmaciones](#8-acciones-rápidas-y-confirmaciones)
9. [Accesibilidad](#9-accesibilidad)
10. [Navegación Mobile Bottom Tab](#10-navegación-mobile-bottom-tab)

---

## 1. Navegación Principal

### Layout base

```
┌──────────────┬──────────────────────────────────────────────┐
│              │  Topbar                                       │
│   Sidebar    │  [Breadcrumb]    [Search Cmd+K]    [👤 User]  │
│   (iconos)   ├──────────────────────────────────────────────┤
│              │                                              │
│              │              Main Content                    │
│              │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Sidebar (Desktop)

| Estado | Ancho | Comportamiento |
|---|---|---|
| Expandido | 240px | Ícono + texto. Estado persistido por usuario vía `localStorage`. |
| Colapsado | 64px | Solo íconos. Tooltip en hover. Se expande al hacer clic en el ícono de hamburguesa. |

**Ítems (expandido):**

| Orden | Ítem | Ícono (Lucide) | Visible para |
|---|---|---|---|
| 1 | Inicio | `LayoutDashboard` | Admin, Vet |
| 2 | Agenda | `Calendar` | Admin, Vet, Recepcionista |
| 3 | Dueños | `Users` | Admin, Vet, Recepcionista |
| 4 | Mascotas | `PawPrint` | Admin, Vet, Recepcionista |
| — | — | Separador | — |
| 5 | Configuración | `Settings` | Admin |
| 6 | Miembros | `UserCog` | Admin |

**Estado colapsado:** Mismos ítems, solo íconos. Al hover sobre un ícono, tooltip con nombre del módulo. Al hacer clic, navega.

### Topbar (Desktop y Mobile)

| Elemento | Descripción |
|---|---|
| **Hamburguesa** | En mobile: abre drawer de navegación. En desktop: colapsa/expande sidebar. |
| **Breadcrumb** | Ruta actual. Ej: `Dueños > Juan Pérez`. No mostrar en mobile. |
| **Búsqueda Global** | Input con lupa + placeholder "Buscar dueño o mascota..." + `Cmd+K`/`Ctrl+K`. Overlay al enfocar. |
| **Nombre clínica** | Texto small con ícono `Building2`. Solo en desktop. |
| **Avatar usuario** | Iniciales del nombre (sin foto en MVP). Dropdown: "Cerrar sesión". |

---

## 2. User Flows

### F1: Login (Magic Link)

```
/login
  │
  ├── Usuario ingresa email
  ├── Sistema envía magic link via Resend
  ├── Toast: "Revisa tu email. El enlace expira en 1 hora."
  │
  └── Usuario hace clic en link
        │
        ├── /auth/callback (intercambia código por sesión)
        ├── Middleware: redirige a /inicio
        └── Dashboard visible
```

Pantallas: `/login` → estado email enviado → callback → `/inicio`.

### F2: Registro Primera Clínica

```
/registro
  │
  ├── Formulario: Email + Nombre de la clínica
  ├── Server Action usa service_role
  ├── Crea auth user + clínica + usuario admin
  ├── Genera magic link
  └── Toast: "Revisa tu email para activar tu cuenta"
        │
        └── Magic link → callback → /onboarding
              │
              ├── Pantalla de bienvenida: "Registra tu primer paciente"
              └── CTA: "Registrar dueño y mascota"
```

### F3: Alta Rápida Dueño + Mascota (target < 60s)

```
/duenos → clic "Nuevo dueño"
  │
  └── Modal/Drawer: formulario Dueño
        │
        ├── Campos: Nombre*, Teléfono*, Email (opc), Dirección (opc)
        │
        ├── Sección expandible "Agregar primera mascota" (opcional)
        │     ├── Nombre*, Especie*, Raza, Color, Sexo
        │     └── Switch "Agregar más datos" (peso, fecha nac, esterilizado)
        │
        ├── [Cancelar] │ [Guardar solo dueño] │ [Guardar dueño + mascota]
        │
        └── Éxito → toast + redirige a perfil del dueño o ficha de mascota
```

**Reglas de este flujo:**
- Guardar solo dueño es válido y explícito (botón etiquetado).
- Si agrega mascota, ambos se guardan en una transacción.
- Sin navegación adicional entre pasos: misma pantalla.
- Target: dueño + mascota < 60 segundos.

### F4: Agendar Cita (máximo 3 clics)

```
Vista agenda → Click en slot vacío
  │
  ├── [CLIC 1] Click en slot vacío → abre modal crear cita
  │
  ├── [CLIC 2] Seleccionar mascota (autocomplete escribe 2+ caracteres)
  │
  ├── Seleccionar veterinario (dropdown precargado)
  │
  ├── Motivo (autofocus, texto libre, mínimo 5 caracteres)
  │
  └── [CLIC 3] Guardar (Enter o clic)
        │
        ├── Éxito → slot se pinta azul con nombre mascota
        └── Error → mensaje inline (doble reserva, campo inválido)
```

Campos opcionales después del guardado rápido: notas internas.

### F5: Consulta con Historial

```
/mascotas/[id] → Tab "Línea de tiempo"
  │
  ├── Vet revisa timeline descendente
  ├── Clic "Nuevo evento"
  │
  └── Modal: selector tipo (consulta / cirugía)
        │
        ├── Consulta: Fecha (default hoy), Diagnóstico*, Tratamiento, Notas
        ├── Cirugía: Fecha (default hoy), Diagnóstico*, Procedimiento*, Notas
        │
        └── Guardar → evento aparece en timeline + toast éxito
```

### F6: Aplicar Vacuna

```
/mascotas/[id] → Tab "Vacunas"
  │
  ├── Clic "Registrar vacuna"
  │
  └── Modal: Tipo (select catálogo), Lote (opc), Fecha aplicación*, Próxima dosis (opc), Aplicado por* (autocomplete vet)
        │
        └── Guardar → vacuna en tabla + evento verde en timeline + toast
```

### F7: Invitar Miembro Staff

```
/configuracion/usuarios → Clic "Invitar miembro"
  │
  └── Modal: Email*, Nombre*, Rol* (select: admin / vet / recepcionista)
        │
        └── Guardar → toast: "Invitación enviada a email@ejemplo.com" + fila en tabla con estado "Pendiente"
```

### F8: Dashboard de Negocio

```
/inicio
  │
  ├── Admin ve 5 widgets con métricas
  ├── Vet ve solo "Próximas citas" (filtradas por vet_id) + "Pacientes activos"
  └── Recepcionista: redirect o 403 (sin acceso)
```

---

## 3. Wireframes por Módulo

### 3.1 Login

**Desktop:**
```
┌──────────────────────────────────────────────┐
│                                              │
│              ┌──────────────────┐            │
│              │   [Logo Vetyx]   │            │
│              │                  │            │
│              │  Inicia sesión   │            │
│              │                  │            │
│              │  Email           │            │
│              │  [______________]│            │
│              │                  │            │
│              │  [Enviar magic   │            │
│              │   link       ➜  ]│            │
│              │                  │            │
│              │  ¿Eres nuevo?    │            │
│              │  Registrar clínica            │
│              └──────────────────┘            │
│                                              │
│         Beta cerrada — 2026                  │
└──────────────────────────────────────────────┘
```

**Mobile:** Mismo contenido, centrado vertical, padding 24px. Sheet no aplica (es página completa).

**Estados:** inicial, enviando (spinner en botón), éxito ("Revisa tu email"), error (email inválido inline).

### 3.2 Dashboard (`/inicio`)

**Layout:** Grid CSS 3 columnas desktop, 2 tablet, 1 mobile.

```
┌──────────────────┬──────────────────┬──────────────────┐
│   Ingresos        │  Ocupación       │  Top Servicios    │
│   ┌──────────┐    │  ┌──────────┐    │  ┌──────────┐    │
│   │ ██ ██    │    │  │ ████████░│    │  │ 1. Consulta│   │
│   │ ██ ██ ██ │    │  │  75%     │    │  │ 2. Vacuna │   │
│   │ ██ ██ ██ │    │  └──────────┘    │  │ 3. Cirugía │   │
│   └──────────┘    │                  │  └──────────┘    │
│   $12,430 este mes│                  │                  │
├──────────────────┴──────────────────┼──────────────────┤
│   Pacientes Activos                  │  Próximas Citas   │
│   ┌─────────────────────────┐       │  ┌───────────────┐│
│   │  230 mascotas            │       │  │09:00 Max →    ││
│   │  45 atenciones esta sem  │       │  │    Vacuna     ││
│   └─────────────────────────┘       │  │10:00 Luna →   ││
│                                     │  │    Consulta   ││
│                                     │  └───────────────┘│
└─────────────────────────────────────┴──────────────────┘
```

**Estados de carga (skeleton):** Cada widget muestra un skeleton con animación shimmer mientras carga. El layout se renderiza inmediatamente con skeletons, sin layout shift.

**Estados vacíos:** Ver sección 6.

### 3.3 Agenda (`/agenda`)

**Desktop vista día:**

```
┌──────────────────────────────────────────────────────┐
│  <  lun 12 jun 2026  >    [Día] [Semana]             │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┤
│ Hora │      │      │      │      │      │      │
│      │ Vet1 │ Vet2 │ Vet3 │      │      │      │
├──────┼──────┼──────┼──────┤      │      │      │
│09:00 │      │      │      │      │      │      │
│      │      │      │      │      │      │      │
├──────┼──────┼──────┼──────┤      │      │      │
│09:30 │ Cita │      │      │      │      │      │
│      │ Max  │      │      │      │      │      │
│      │ Azul │      │      │      │      │      │
├──────┼──────┼──────┼──────┤      │      │      │
│10:00 │      │ Cita │      │      │      │      │
│      │      │ Luna │      │      │      │      │
│      │      │ Verde│      │      │      │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

**Slots:** 09:00–13:00, 14:00–18:00. 16 filas de 30 min. Altura fija 60px por slot.

**Colores por estado:**
| Estado | Color | Hex sugerido |
|---|---|---|
| Confirmada | Azul | `#3B82F6` |
| Completada | Verde | `#22C55E` |
| Cancelada | Rojo | `#EF4444` |
| No-show | Gris | `#9CA3AF` |

**Vista semanal:** Misma grid con 7 columnas (lun–sáb). Cards más pequeñas dentro de cada columna.

**Click slot vacío:** Modal crear cita. Slot se marca temporalmente como "seleccionado" con borde punteado.

**Click slot ocupado:** Modal ver/editar cita con acciones según estado.

**Mobile vista día:** Lista vertical ordenada por hora. Sin grid. Cada cita es una card: hora, mascota, motivo, vet, color de estado.

### 3.4 Dueños

**Lista (`/duenos`):**

```
┌─────────────────────────────────────────────────────────┐
│  Dueños                             [+ Nuevo dueño]      │
│                                                          │
│  [ Buscar por nombre o teléfono... ]                     │
│                                                          │
│  ┌────┬──────────┬────────────┬──────┬────────┬────────┐ │
│  │    │ Nombre   │ Teléfono   │ Email│ Mascot│ Estado │ │
│  ├────┼──────────┼────────────┼──────┼───────┼────────┤ │
│  │    │ Juan     │ 55-1234-   │ j@   │ 3     │ Activo │ │
│  │    │ Pérez    │ 5678       │ m.c. │       │ 🟢    │ │
│  │    │ ...      │ ...        │ ...  │ ...   │ ...    │ │
│  └────┴──────────┴────────────┴──────┴───────┴────────┘ │
│  Mostrando 1-10 de 45                          [1] [2]   │
└─────────────────────────────────────────────────────────┘
```

**Estados de carga:** DataTable con 5 filas skeleton (shimmer) + skeleton en contador de página.

**Estados vacíos:** "Aún no has registrado ningún dueño." + CTA "Registrar primer dueño".

**Búsqueda sin resultados:** "No encontramos dueños con ese nombre o teléfono." + "Limpiar filtros".

**Perfil dueño (`/duenos/[id]`):**

```
┌─────────────────────────────────────────────────────────┐
│  Dueños > Juan Pérez                   [Editar] [⋮]      │
│                                                          │
│  ┌────────────────────────────────┐                     │
│  │ Juan Pérez                     │                     │
│  │ 📞 55-1234-5678                │                     │
│  │ ✉ juan@mail.com               │                     │
│  │ 📍 Calle 123, CDMX             │                     │
│  │ Registrado por: Ana Admin      │                     │
│  └────────────────────────────────┘                     │
│                                                          │
│  Mascotas (3)                    [+ Agregar mascota]     │
│  ┌──────────┬────────┬────────┬──────────┐              │
│  │ Nombre   │ Especie│ Raza   │ Estado   │              │
│  ├──────────┼────────┼────────┼──────────┤              │
│  │ Max      │ Perro  │ Pastor │ Activo   │              │
│  │ Luna     │ Gato   │ —      │ Activo   │              │
│  └──────────┴────────┴────────┴──────────┘              │
│                                                          │
│  [Desactivar dueño] (solo admin, si no tiene mascotas activas) │
└─────────────────────────────────────────────────────────┘
```

### 3.5 Mascotas

**Ficha mascota (`/mascotas/[id]`):**

```
┌─────────────────────────────────────────────────────────┐
│  Mascotas > Max                          [Editar] [⋮]    │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  [🐾] Max  │  Perro  │  Pastor Alemán  │  🟢 Activo │ │
│  │  Dueño: Juan Pérez →                                │ │
│  │  Peso: 32.5 kg │ Sexo: Macho │ Esterilizado: Sí    │ │
│  │  Nac: 12/03/2021 │ Color: Negro y café             │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────┬────────────────────┬──────────────┐   │
│  │ [📋 Datos]   │ [📜 Línea tiempo]  │ [💉 Vacunas] │   │
│  ├──────────────┴────────────────────┴──────────────┤   │
│  │                                                    │   │
│  │  Contenido según tab activa                       │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Estados de carga:** Skeleton con forma de card de datos + skeleton tabs + skeleton timeline.

**Línea de tiempo:**

```
┌─────────────────────────────────────────────────────────┐
│  [+ Nuevo evento]                                       │
│                                                          │
│  🟢  10 jun 2026 — Vacuna                               │
│      Antirrábica canina (Lote: A123)                    │
│      Próxima dosis: 10 jun 2027                         │
│      Aplicó: Dr. García                                 │
│                                                          │
│  🔴  05 jun 2026 — Cirugía                              │
│      Diagnóstico: Fractura tibia derecha                │
│      Procedimiento: Osteosíntesis con placa              │
│                                                          │
│  🔵  01 jun 2026 — Consulta                             │
│      Diagnóstico: Otitis externa                        │
│      Tratamiento: Limpieza + gotas óticas               │
│      Notas: Paciente inquieto, recomendar reconsulta     │
│      [Editar] (si < 24h)                                 │
│                                                          │
│  [ Cargar más eventos ↓ ]                                │
└─────────────────────────────────────────────────────────┘
```

**Card expandido:** Por defecto muestra resumen (fecha, tipo, título). Click expande a detalle completo. Transición suave de altura.

**Edición:** Ícono lápiz visible solo si `created_at > now() - 24h`. Edita en el mismo card (inline edit) o modal pequeño. Solo tratamiento y notas editables.

### 3.6 Citas

**Modal crear cita:**

```
┌────────────────────────────────────────────────┐
│  Nueva cita                        [Cerrar ✕]   │
│                                                  │
│  Mascota *                                      │
│  [Buscar mascota...     ▼]  autocomplete         │
│                                                  │
│  Veterinario *                                  │
│  [Dr. García            ▼]  dropdown             │
│                                                  │
│  Fecha *           Hora *                       │
│  [12/06/2026  ▼]   [10:00 ▼]  date + time picker│
│                                                  │
│  Motivo *                                       │
│  [________________________________]  textarea    │
│                                                  │
│  Notas internas (opcional)                      │
│  [________________________________]              │
│                                                  │
│  [Cancelar]             [Guardar cita]           │
└────────────────────────────────────────────────┘
```

**Validación en tiempo real:** Al seleccionar fecha+hora+vet, el sistema verifica disponibilidad. Si hay conflicto, mensaje inline rojo debajo del campo hora: "El Dr. García ya tiene una cita a las 10:00. ¿Quieres ver horarios disponibles?"

**Modal editar/ver cita:**

```
┌────────────────────────────────────────────────┐
│  Cita: Max — Dr. García          [Cerrar ✕]     │
│                                                  │
│  Estado: 🟢 Confirmada                          │
│                                                  │
│  Mascota: Max (→ ficha)                         │
│  Dueño: Juan Pérez (→ perfil)                   │
│  Fecha: 12/06/2026  10:00                       │
│  Motivo: Vacunación anual                       │
│                                                  │
│  ─── Acciones ───                               │
│  [Editar]  [Completar]  [No-show]  [Cancelar]   │
│                                                  │
│  (acciones visibles según estado actual)         │
└────────────────────────────────────────────────┘
```

### 3.7 Configuración

**Datos clínica (`/configuracion/clinica`):**

```
┌─────────────────────────────────────────────────────────┐
│  Configuración > Clínica                                │
│                                                          │
│  Nombre *           [Veterinaria Patitas Felices    ]    │
│  Slug               [veterinaria-patitas-felices] (ro)   │
│  Email contacto *   [contacto@patitas.com           ]    │
│  Teléfono           [55-1234-5678                  ]    │
│  Dirección          [Calle 123, Colonia Centro     ]    │
│                      [CDMX, México                 ]    │
│                                                          │
│  [Cancelar]                    [Guardar cambios]         │
└─────────────────────────────────────────────────────────┘
```

**Miembros (`/configuracion/usuarios`):**

```
┌─────────────────────────────────────────────────────────┐
│  Miembros del staff             [+ Invitar miembro]      │
│                                                          │
│  ┌────┬──────────┬────────────┬──────┬────────┬────────┐ │
│  │    │ Nombre   │ Email      │ Rol  │ Estado │ Acción │ │
│  ├────┼──────────┼────────────┼──────┼───────┼────────┤ │
│  │    │ Ana Admin│ ana@       │ Admin│ 🟢    │ [⋮]   │ │
│  │    │ Dr.García│ garcia@    │ Vet  │ 🟢    │ [⋮]   │ │
│  │    │ Luisa    │ luisa@     │ Recep│ 🟢    │ [⋮]   │ │
│  │    │ Pedro    │ pedro@     │ Vet  │ 🔴    │ [⋮]   │ │
│  │    │ ...      │ ...        │ ...  │ ...   │ ...   │ │
│  └────┴──────────┴────────────┴──────┴───────┴────────┘ │
│  Mostrando 1-10 de 12                         [1] [2]   │
└─────────────────────────────────────────────────────────┘
```

**Menú [⋮] por fila:** Editar rol, Desactivar (no aplica al propio usuario ni al owner).

---

## 4. Desktop vs Mobile

| Elemento | Desktop (≥1024px) | Mobile (<768px) |
|---|---|---|
| **Sidebar** | Visible, 240px o 64px colapsado. Estado persistido. | Oculto. Bottom tab + drawer hamburguesa. |
| **Breadcrumb** | Visible en topbar | Oculto |
| **Agenda** | Grid con slots + columnas por vet | Lista vertical, vista día únicamente |
| **Dashboard** | Grid 3 columnas | Stack vertical 1 columna |
| **Modales** | Modal centrado (max 600px) | Sheet desde abajo o pantalla completa |
| **Formularios ≤ 6 campos** | Modal o slide | Sheet desde abajo con acciones fijas |
| **Formularios ≥ 7 campos** | Modal centrado | Pantalla completa con acciones fijas |
| **DataTable** | Tabla completa con columnas | Cards verticales + filtros |
| **Timeline** | Cards con padding amplio | Cards full width, sin padding lateral |
| **Búsqueda global** | Input en topbar + overlay dropdown | Pantalla completa de búsqueda |
| **Confirmaciones** | Modal pequeño centrado | Sheet desde abajo |
| **Perfil dueño/mascota** | Layout 2 columnas (datos + lista) | Layout 1 columna (scroll) |

---

## 5. Componentes Compartidos

| # | Componente | Propósito | Variantes |
|---|---|---|---|
| 1 | `Sidebar` | Navegación principal desktop | Expandida (240px), colapsada (64px icon-only) |
| 2 | `Topbar` | Header global | Desktop (breadcrumb + search + avatar), mobile (hamburguesa + título + search icon) |
| 3 | `SearchGlobal` | Búsqueda concurrente dueños + mascotas | Desktop (overlay con resultados agrupados), mobile (pantalla completa) |
| 4 | `DataTable` | Listas con ordenamiento y paginación | Con/sin búsqueda, con/sin selección múltiple |
| 5 | `EmptyState` | Estado sin datos | Widget dashboard, lista vacía, búsqueda sin resultados |
| 6 | `Modal` | Formularios y confirmaciones | Small (confirm 400px), Medium (form 600px), Sheet mobile, FullScreen mobile |
| 7 | `ConfirmDialog` | Confirmación de acciones destructivas | Con texto de advertencia + botón confirmar rojo + cancelar |
| 8 | `Timeline` | Línea de tiempo del historial médico | Con scroll infinito, filtro por tipo evento, cards expandibles |
| 9 | `CalendarGrid` | Grid de slots de agenda | Día (1 columna × 16 slots), Semana (7 columnas × 16 slots) |
| 10 | `MetricCard` | Widget de dashboard | Con gráfica (ingresos), con lista (top servicios), con número grande (pacientes), con barra (ocupación) |
| 11 | `Autocomplete` | Búsqueda rápida con selección | Dueños, mascotas, veterinarios. Resultados a partir de 2 caracteres. |
| 12 | `Avatar` | Foto perfil usuario | Iniciales + color asignado por nombre (sin foto en MVP) |
| 13 | `StatusBadge` | Indicador de estado | Colores: activo/verde, inactivo/rojo, pendiente/amarillo, baja/gris |
| 14 | `Toast` | Notificaciones de acción | Éxito (verde + check), error (rojo + x), advertencia (amarillo + alert) |
| 15 | `EmptySlot` | Slot de agenda disponible | Clickeable, hover con borde azul punteado |
| 16 | `Skeleton` | Estado de carga | Card, row, text, circle. Con animación shimmer. |

---

## 6. Estados Vacíos

| Ubicación | Texto vacío | CTA |
|---|---|---|
| Dashboard — Ingresos | "No hay ingresos registrados este período." | "Registrar primera cita" → `/agenda` |
| Dashboard — Ocupación | "No hay citas programadas." | "Agendar primera cita" → `/agenda` |
| Dashboard — Top servicios | "No hay consultas completadas este mes." | "Completar primera consulta" → `/mascotas` |
| Dashboard — Pacientes activos | "No hay pacientes registrados." | "Registrar primera mascota" → `/duenos` |
| Dashboard — Próximas citas | "No hay citas para hoy." | "Agendar cita" → `/agenda` |
| Lista de dueños | "Aún no has registrado ningún dueño." | "Registrar primer dueño" |
| Búsqueda de dueños | "No encontramos dueños con ese nombre o teléfono." | "Limpiar filtros" |
| Perfil dueño — sin mascotas | "Este dueño aún no tiene mascotas registradas." | "Agregar primera mascota" |
| Ficha mascota — Timeline | "Este paciente no tiene eventos registrados." | "Registrar primera consulta" |
| Ficha mascota — Vacunas | "Este paciente no tiene vacunas registradas." | "Registrar primera vacuna" |
| Agenda — día sin citas | "No hay citas programadas para este día." | "Agendar cita" |
| Agenda — semana sin citas | "No hay citas programadas esta semana." | "Agendar cita" |
| Staff — sin miembros | "Aún no has invitado a nadie a tu clínica." | "Invitar miembro" |
| Búsqueda global | "No encontramos resultados para «término»." | — |

**Patrón visual de cada EmptyState:** Ícono grande (96px) representativo + text heading (semibold) + text body (secondary) + botón CTA primary.

---

## 7. Formularios

### 7.1 Tabla de formularios

| Formulario | Campos | Tipo | Notas |
|---|---|---|---|
| **Login** | Email | 1 input | Pantalla completa. Sin validación extra. |
| **Registro clínica** | Email, Nombre clínica | 2 inputs | Pantalla completa. |
| **Dueño** | Nombre, Teléfono, Email (opc), Dirección (opc) | 4 campos | Sheet mobile (≤ 6 campos). + sección expandible opcional para primera mascota. |
| **Dueño + Mascota rápida** | Dueño (4) + Mascota (nombre, especie, raza opc, color opc, sexo opc) | 4 + 5 campos | Misma pantalla. Mascota en sección expandible. "Guardar solo dueño" disponible. |
| **Mascota completa** | Nombre, Especie, Raza, Fecha nac, Color, Peso, Sexo, Esterilizado, Dueño | 9 campos | Pantalla completa mobile (≥ 7 campos). |
| **Cita** | Mascota, Veterinario, Fecha, Hora, Motivo, Notas (opc) | 6 campos | Modal desktop / Sheet mobile. |
| **Historial — Consulta** | Fecha, Diagnóstico, Tratamiento (opc), Notas (opc) | 4 campos | Sheet mobile. |
| **Historial — Cirugía** | Fecha, Diagnóstico, Procedimiento, Notas (opc) | 4 campos | Sheet mobile. |
| **Vacuna** | Tipo (catálogo), Lote (opc), Fecha aplicación, Próxima dosis (opc), Aplicado por | 5 campos | Sheet mobile. |
| **Invitar usuario** | Email, Nombre, Rol (select) | 3 campos | Sheet mobile. |
| **Editar clínica** | Nombre, Email, Teléfono, Dirección | 4 campos | Página completa. |
| **Editar usuario** | Rol (select) | 1 campo | Modal pequeño. |

### 7.2 Mobile: Drawer/Sheet vs Pantalla Completa

| Condición | Comportamiento | Ejemplos |
|---|---|---|
| ≤ 6 campos, sin relaciones complejas | Sheet desde abajo (50-80% altura) + acciones fijas abajo | Login, dueño, invitar, vacuna, consulta, cirugía |
| ≥ 7 campos o requiere búsqueda + selección | Pantalla completa con scroll + acciones fijas abajo | Mascota completa, cita (tiene autocomplete + date + time) |
| Confirmaciones | Sheet pequeño desde abajo (30% altura) | Desactivar, cancelar cita |

**Barra fija inferior en ambos casos:**
```
┌────────────────────────┐
│  [Cancelar]  [Guardar] │
└────────────────────────┘
```

Cancelar siempre secundario/ghost, Guardar siempre primary.

### 7.3 Optimización para Recepcionistas

| Práctica | Implementación |
|---|---|
| **Autofocus** | Primer campo del formulario recibe focus al abrir. |
| **Tab index secuencial** | Enter avanza al siguiente campo natural (orden lógico de lectura). |
| **Teléfono con formato** | Input type tel + mask `+52 55 1234 5678`. Sin validar formato exacto en MVP, solo 10 dígitos mínimos. |
| **Autocomplete temprano** | Resultados aparecen a partir de 2 caracteres en búsquedas de dueño/mascota. |
| **Shortcut Guardar** | `Cmd+Enter` / `Ctrl+Enter` guarda desde cualquier campo. |
| **Validación visible** | Todos los campos requeridos marcados con `*`. Errores inline debajo del campo inmediatamente después de perder el foco (onBlur). Sin errores sorpresa al hacer submit. |
| **Formularios sin recarga** | Todo vía Server Action con respuesta asíncrona. Sin page reload. |
| **Persistencia local** | Si el usuario cierra el modal sin guardar, los datos escritos se preservan en estado local (no se pierden). |
| **Tiempo target** | Dueño + mascota < 60 segundos. Cita < 30 segundos. |

### 7.4 Estados de formulario

| Estado | Comportamiento visual |
|---|---|
| **Inicial** | Campos vacíos o con defaults. Botón Guardar deshabilitado si hay required vacíos. |
| **Escribiendo** | Validación onBlur. Errores inline. Contador de caracteres en textarea (motivo, diagnóstico). |
| **Enviando** | Botón Guardar muestra spinner + texto "Guardando..." Todos los campos deshabilitados. |
| **Error de validación** | Borde rojo en campo + texto error debajo. Primer campo con error recibe focus. Toast no reemplaza error inline. |
| **Error de servidor** | Toast error en esquina superior derecha. Formulario permanece abierto con datos intactos. |
| **Éxito** | Toast verde. Modal se cierra automáticamente después de 1.5s. Tabla/lista se actualiza. |

---

## 8. Acciones Rápidas y Confirmaciones

### 8.1 Acciones Rápidas

| Ubicación | Acción | Mecanismo |
|---|---|---|
| Sidebar (fondo) | Nuevo paciente (dueño + mascota) | Botón primary fijo |
| Header | Búsqueda global | `Cmd+K` / `Ctrl+K` |
| Agenda — slot vacío | Crear cita | Click → modal |
| Agenda (mobile) | Crear cita | FAB `+` |
| Ficha mascota — Timeline | Nuevo evento | Botón "Nuevo evento" |
| Ficha mascota — Vacunas | Registrar vacuna | Botón "Registrar vacuna" |
| Dashboard — widget | Ver detalle | Click en widget |
| DataTable — fila | Acciones | Menú `⋮` (editar, desactivar) |
| Perfil dueño | Agregar mascota | Botón "Agregar mascota" |
| Cita — modal ver | Cambiar estado | Botones según estado actual |

### 8.2 Confirmaciones antes de desactivar

**Desactivar dueño (con mascotas activas):**
```
┌─────────────────────────────────────┐
│  ⚠ No se puede desactivar           │
│                                      │
│  Juan Pérez tiene 2 mascotas         │
│  activas. Desactívalas primero       │
│  o asígnalas a otro dueño.          │
│                                      │
│  [Entendido]                         │
└─────────────────────────────────────┘
```
Modal sin acción destructiva. Solo informativo + botón para cerrar.

**Desactivar dueño (sin mascotas activas):**
```
┌─────────────────────────────────────┐
│  ⚠ Desactivar dueño                 │
│                                      │
│  Juan Pérez quedará inactivo.        │
│  No aparecerá en búsquedas.          │
│  Puedes reactivarlo después.         │
│                                      │
│  [Cancelar]    [Sí, desactivar] 🔴   │
└─────────────────────────────────────┘
```

**Desactivar mascota:**
```
┌─────────────────────────────────────┐
│  ⚠ Desactivar mascota               │
│                                      │
│  Max quedará inactivo.               │
│  No podrá agendar nuevas citas.     │
│  Su historial médico se conserva.    │
│  Puedes reactivarlo después.         │
│                                      │
│  [Cancelar]    [Sí, desactivar] 🔴   │
└─────────────────────────────────────┘
```

**Desactivar usuario (admin no puede auto-desactivarse ni desactivar al owner):**
```
┌─────────────────────────────────────┐
│  ⚠ No se puede desactivar           │
│                                      │
│  No puedes desactivar tu propia      │
│  cuenta ni al usuario owner.         │
│                                      │
│  [Entendido]                         │
└─────────────────────────────────────┘
```

Si es otro admin/vet/recep, confirmación normal:
```
┌─────────────────────────────────────┐
│  ⚠ Desactivar usuario               │
│                                      │
│  Pedro Vet perderá acceso a la       │
│  plataforma. Sus citas futuras       │
│  se mostrarán sin asignación.        │
│                                      │
│  [Cancelar]    [Sí, desactivar] 🔴   │
└─────────────────────────────────────┘
```

**Cancelar cita:**
```
┌─────────────────────────────────────┐
│  ⚠ Cancelar cita                    │
│                                      │
│  Cita: Max — Dr. García              │
│  12 jun 2026 — 10:00                 │
│                                      │
│  Motivo de cancelación (opcional):   │
│  [Dueño canceló                  ]   │
│                                      │
│  [No cancelar]   [Sí, cancelar] 🔴   │
└─────────────────────────────────────┘
```

**Desactivar clínica (admin dueño):**
```
┌─────────────────────────────────────┐
│  ⚠ Desactivar clínica               │
│                                      │
│  Todos los usuarios perderán         │
│  acceso inmediato. Los datos se      │
│  conservan para posible              │
│  reactivación.                       │
│                                      │
│  Esta acción no se puede             │
│  deshacer fácilmente.               │
│                                      │
│  [Cancelar]    [Desactivar clínica] 🔴│
└─────────────────────────────────────┘
```

### 8.3 Estados de Carga Globales

| Situación | Componente | Comportamiento |
|---|---|---|
| Carga inicial de página | Skeleton de la página específica | Sin layout shift. Misma estructura que el contenido final. |
| Carga de tabla | DataTable skeleton (5 filas + header) | Shimmer animation. |
| Carga de dashboard | MetricCard skeleton (cada widget) | Shimmer + forma rectangular sin texto. |
| Carga de timeline | Timeline skeleton (3 cards) | Shimmer + alturas variables simulando contenido. |
| Server Action en progreso | Spinner en botón + campos disabled | Botón cambia texto a "Guardando..." + ícono giratorio. |
| Error de red | Toast + botón reintentar | Toast "Error de conexión. Reintentando..." con retry automático. |
| Submit exitoso | Toast verde + cierre automático | Modal se cierra tras 1.5s. |

---

## 9. Accesibilidad

### 9.1 Teclado

| Acción | Atajo |
|---|---|
| Buscar (global) | `Cmd+K` / `Ctrl+K` |
| Guardar formulario | `Cmd+Enter` / `Ctrl+Enter` |
| Cerrar modal | `Escape` |
| Navegar sidebar | `Tab` + flechas (cuando sidebar tiene focus) |
| Navegar agenda | Flechas izquierda/derecha para cambiar día |
| Confirmar acción | `Enter` en botón primary |
| Cancelar acción | `Escape` cierra modal (equivale a cancelar) |

### 9.2 ARIA

| Elemento | Atributo |
|---|---|
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"` |
| Sidebar | `role="navigation"`, `aria-label="Navegación principal"` |
| Sidebar colapsado | `aria-expanded="false"` en botón toggle |
| Tab actual en navegación | `aria-current="page"` |
| DataTable | `<caption>` con descripción de la tabla |
| StatusBadge | `aria-label="Estado: {texto}"` (ej: "Estado: Activo") |
| Gráfica dashboard | Descripción textual alternativa (datos numéricos subyacentes) |
| EmptyState | `role="status"` |
| Timeline eventos | `aria-label="Evento de {tipo}: {resumen}"` |
| Iconos sin texto | `aria-hidden="true"` + tooltip o label visible |
| Errores de formulario | `aria-describedby="{error-id}"` vinculado al campo |

### 9.3 Contraste y Color

- Estados de cita no dependen exclusivamente del color: incluyen ícono + texto de estado.
- Ratio de contraste ≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande.
- Colores de estado accesibles con fondo blanco:
  - Azul `#2563EB` (confirmada)
  - Verde `#16A34A` (completada)
  - Rojo `#DC2626` (cancelada)
  - Gris `#6B7280` (no-show)

### 9.4 Screen Reader

- Tablas con `<caption>` descriptivo.
- Navegación con `skip to main content` link al inicio de cada página.
- Modales con `focus trap` (focus no sale del modal mientras está abierto).
- Al cerrar modal, focus regresa al elemento que lo abrió.
- Al cambiar estado de cita, anuncio via `aria-live="polite"`.
- Estados de carga con `aria-busy="true"` en contenedor + texto visible "Cargando...".

### 9.5 Reducir Movimiento

- `@media (prefers-reduced-motion: reduce)` → animaciones desactivadas, transiciones instantáneas (0ms).
- Skeleton shimmer reemplazado por opacidad estática si `prefers-reduced-motion`.
- Acordeones sin animación de altura.

### 9.6 Touch Targets

- Botones y elementos clickeables ≥ 44×44px en mobile.
- Slots de agenda con padding interno suficiente para toque preciso.
- Bottom tab items con área clickeable completa (icono + label, 48px altura).

---

## 10. Navegación Mobile Bottom Tab

### Ítems visibles

| Ícono | Label | Ruta | Visible para |
|---|---|---|---|
| `LayoutDashboard` | Inicio | `/inicio` | Admin, Vet |
| `Calendar` | Agenda | `/agenda` | Admin, Vet, Recepcionista |
| `Users` | Dueños | `/duenos` | Admin, Vet, Recepcionista |
| `PawPrint` | Mascotas | `/mascotas` | Admin, Vet, Recepcionista |
| `Menu` | Más | — | Todos (drawer) |

### Bottom Tab bar

- Altura: 64px.
- Ícono 24px + label 12px.
- Tab activo con color primary + ícono filled.
- Fondo blanco con top border sutil.

### Drawer de navegación completa (desde "Más" o hamburguesa)

```
┌──────────────────────────────────┐
│  ✕                              │
│                                  │
│  ┌──┐                           │
│  │  │ Nombre de la clínica       │
│  └──┘                           │
│  ─────────────────────           │
│                                  │
│  🏠 Inicio                       │
│  📅 Agenda                       │
│  👥 Dueños                       │
│  🐾 Mascotas                     │
│                                  │
│  ─── Configuración ───           │
│  ⚙️ Clínica (admin only)        │
│  👤 Miembros (admin only)        │
│                                  │
│  ─── Cuenta ───                  │
│  🚪 Cerrar sesión                │
└──────────────────────────────────┘
```

- Overlay oscuro semi-transparente detrás del drawer.
- Drawer ocupa 80% del ancho en mobile, 360px max en tablet.
- Cierra con swipe derecho o clic en overlay o botón ✕.

---

*Documento complementario al PRD v1.0, FRD v1.0, Architecture v1.0 y Database v1.0. Para contexto completo, referirse a los documentos de diseño previo.*
