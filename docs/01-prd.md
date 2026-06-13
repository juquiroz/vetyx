# Vetyx.io — Product Requirements Document (PRD)

| Versión | Fecha | Autor | Estado |
|---|---|---|---|
| 1.0 | 2026-06-12 | Senior PM | Aprobado |

---

## Tabla de Contenidos

1. [Objetivo](#1-objetivo)
2. [Problema](#2-problema)
3. [Público Objetivo](#3-público-objetivo)
4. [Propuesta de Valor](#4-propuesta-de-valor)
5. [Casos de Uso](#5-casos-de-uso)
6. [Historias de Usuario](#6-historias-de-usuario)
7. [Alcance MVP](#7-alcance-mvp)
8. [Roadmap 90 Días](#8-roadmap-90-días)
9. [KPIs](#9-kpis)
10. [Decisiones Tomadas](#10-decisiones-tomadas)

---

## 1. Objetivo

Crear un SaaS web para la gestión integral de clínicas veterinarias pequeñas y medianas en Latinoamérica, que permita digitalizar el registro de pacientes, el historial clínico, las vacunas, la agenda y las métricas del negocio. El MVP debe estar listo para venderse a las primeras 10 clínicas en un plazo de 90 días.

**Meta del MVP:** Validar que clínicas dispuestas a pagar $49–$79 USD/mes adopten la plataforma como su herramienta diaria, registrando al menos 30 citas por semana y reteniendo ≥80% de las clínicas activas semanalmente.

---

## 2. Problema

Las clínicas veterinarias en Latinoamérica operan con procesos manuales o herramientas genéricas (Excel, papel, agendas físicas). Esto genera problemas estructurales que frenan su crecimiento y afectan la calidad del servicio:

| Problema | Impacto |
|---|---|
| **Pérdida de historial clínico** | Fichas extraviadas, ilegibles o incompletas. El veterinario atiende sin conocer el pasado del paciente. Riesgo de malpraxis. |
| **Mala gestión de vacunas** | No hay recordatorios al dueño. Se pierden ventas de refuerzos. Pacientes desprotegidos. |
| **Agenda caótica** | Dobles reservas, huecos muertos sin llenar, sobrecarga de urgencias. Recepcionista usa papel o Google Calendar sin control. |
| **Fuga de ingresos** | No se da seguimiento a pacientes post-consulta. No se recuerda al dueño citas de control, baños, desparasitaciones. |
| **Datos no centralizados** | El dueño de la clínica no sabe cuánto ganó ayer, qué servicios son más rentables, qué horas tienen menor ocupación. Decisiones tomadas con el instinto, no con datos. |
| **Nula inteligencia de negocio** | No hay visibilidad de: clientes que más gastan, servicios más demandados, estacionalidad, eficiencia por veterinario. |
| **Dependencia del veterinario fundador** | Si el vet dueño se enferma o toma vacaciones, la operación se detiene porque la información está en su cabeza o en su libreta personal. |

### Validación del problema

Entrevistas informales con 5 clínicas en México y Colombia confirman:
- 4/5 usan papel o Excel.
- 3/5 han perdido fichas clínicas.
- 5/5 no tienen sistema de recordatorios.
- 4/5 no saben con precisión sus ingresos mensuales.
- 3/5 han intentado usar software genérico (Google Calendar, agenda de papel) y lo abandonaron por falta de adaptación a su flujo.

---

## 3. Público Objetivo

### Segmentación por tamaño

| Segmento | Descripción | # Vets | Staff | Presupuesto | Prioridad MVP |
|---|---|---|---|---|---|
| **Clínicas pequeñas** | Dueño-veterinario que opera solo o con 1 asistente. Dueño hace de vet, recepcionista y administrativo. Presupuesto limitado. Necesita algo simple, barato, sin curva de aprendizaje. | 1–2 | 1–3 | $30–$50 USD/mes | 🟡 Alta |
| **Clínicas medianas** | Varios veterinarios con recepcionista dedicada. Requieren roles, permisos, agenda compartida y reportes. Dueño separado de la operación diaria. | 3–5 | 4–8 | $50–$100 USD/mes | 🔴 Muy alta |
| **Clínicas grandes / Hospitales** | Múltiples especialidades, internamiento, farmacia, laboratorio. Staff numeroso. Requieren facturación electrónica, integración con laboratorios, módulo de internamiento. | 6+ | 10+ | $150–$300 USD/mes | 🟢 Baja (post-MVP) |

### Perfil del early adopter ideal

- Clínica que actualmente usa papel/Excel.
- Está en crecimiento (3+ pacientes nuevos por semana).
- El dueño tiene visión digital y ha intentado adoptar tecnología antes.
- Está frustrada con su sistema actual o con la falta de él.
- Opera en México, Colombia, Argentina, Chile o Perú.
- Facturación mensual estimada ≥ $3,000 USD.

### Tamaño de mercado (TAM)

- ~60,000 clínicas veterinarias en la región objetivo (estimado conservador).
- Tasa de penetración de software veterinario: <15%.
- Mercado direccionable inicial (pequeñas + medianas): ~45,000 clínicas.
- A $50 USD/mes promedio → TAM = $27M USD/mes, $324M USD/año.

---

## 4. Propuesta de Valor

### Eslogan

> **"La plataforma más simple para que tu clínica veterinaria no pierda pacientes, citas ni dinero."**

### Mapeo dolor-solución

| Dolor del cliente | Solución Vetyx | Beneficio |
|---|---|---|
| Historial perdido | Ficha clínica digital siempre disponible en la nube | El vet abre la ficha y ve todo el historial en 5 segundos |
| Vacunas olvidadas | Recordatorios automáticos al dueño vía email (WhatsApp en fase 2) | Más vacunas aplicadas = más ingresos + pacientes saludables |
| Agenda caótica | Calendario inteligente con slots configurables, vista diaria/semanal, sin dobles reservas | La recepcionista agenda en 30 segundos sin conflictos |
| Clientes que no regresan | Dashboard con pacientes que deben volver (control, vacunas, cirugías) | Activación de clientes inactivos |
| Sin datos del negocio | Dashboard con ingresos, ocupación, top servicios | El dueño toma decisiones basadas en datos, no instinto |
| Alta fricción en registro | Registro de dueño + mascota en misma pantalla, <60 segundos | Menos tiempo administrativo, más tiempo clínico |

### Diferenciadores competitivos

| vs Competidor | Diferenciador Vetyx |
|---|---|
| **VetRecord, ezyVet** | Precio 3–5× menor. Diseñado para LatAm, no para USA/Europa. |
| **PetDesk, Vetstoria** | No solo agenda: incluye historial clínico completo y dashboard de negocio. |
| **Soluciones genéricas (Excel, Google Calendar, papel)** | Propósito específico, integración, recordatorios, reporting. |
| **Competidores locales incipientes** | UX superior, offline-first, WhatsApp nativo (fase 2). |

### Pricing sugerido (MVP)

| Plan | Precio | Ideal para |
|---|---|---|
| **Único (MVP)** | $49 USD/mes | Clínicas de 1–3 vets |
| Anual (descuento) | $49 → $39 USD/mes | Early adopters |

Se evalúa introducir planes por número de mascotas o vets en post-MVP. Por ahora, precio único para simplificar.

---

## 5. Casos de Uso

### CU-01: Registro rápido de dueño y mascota

| Atributo | Valor |
|---|---|
| **Actor primario** | Recepcionista |
| **Precondición** | Dueño presente en mostrador o llamando |
| **Flujo principal** | 1. Recepcionista abre "Nuevo dueño". 2. Ingresa nombre y teléfono del dueño. 3. En la misma pantalla, ingresa nombre, especie y raza de la mascota. 4. Guarda. |
| **Flujo alterno** | Si el dueño ya existe: lo busca por teléfono, selecciona, y registra solo la mascota nueva. |
| **Postcondición** | Dueño y mascota creados y vinculados. Ficha de mascota disponible. |
| **Métrica** | Tiempo promedio < 60 segundos |

### CU-02: Consulta con historial

| Atributo | Valor |
|---|---|
| **Actor primario** | Veterinario |
| **Precondición** | Mascota registrada, dueño presente en consultorio |
| **Flujo principal** | 1. Vet abre la ficha de la mascota. 2. Revisa línea de tiempo del historial. 3. Crea nuevo evento de consulta. 4. Ingresa diagnóstico, tratamiento y notas. 5. Guarda. |
| **Postcondición** | Evento agregado a la línea de tiempo. Fecha de última consulta actualizada. |
| **Regla** | Diagnóstico debe tener ≥10 caracteres. No se puede editar después de 24h. |

### CU-03: Aplicación y recordatorio de vacuna

| Atributo | Valor |
|---|---|
| **Actor primario** | Veterinario, Sistema |
| **Precondición** | Mascota en consulta o vacunación programada |
| **Flujo principal** | 1. Vet abre ficha de mascota → sección Vacunas. 2. Selecciona tipo de vacuna del catálogo. 3. Ingresa lote y fecha de aplicación. 4. Opcional: ingresa fecha de próxima dosis. 5. Guarda. 6. [Sistema] 7 días antes de próxima dosis, envía email al dueño. |
| **Postcondición** | Vacuna registrada. Línea de tiempo actualizada. Recordatorio programado. |
| **Nota** | Si próxima dosis vence y no se aplica, re-recordatorio cada 7 días (máx 3). |

### CU-04: Agendar cita

| Atributo | Valor |
|---|---|
| **Actor primario** | Recepcionista |
| **Precondición** | Mascota registrada, veterinarios configurados |
| **Flujo principal** | 1. Recepcionista abre Agenda. 2. Selecciona fecha y vet. 3. Ve slots disponibles. 4. Selecciona hora. 5. Busca y selecciona mascota. 6. Ingresa motivo. 7. Guarda. |
| **Flujo alterno** | Si el slot está ocupado, el sistema muestra error y sugiere slots alternativos cercanos. |
| **Postcondición** | Cita creada con estado `confirmada`. Aparece en agenda del vet. |

### CU-05: Dashboard de negocio

| Atributo | Valor |
|---|---|
| **Actor primario** | Dueño de clínica |
| **Precondición** | Al menos 1 cita completada con monto registrado |
| **Flujo principal** | 1. Dueño abre Dashboard. 2. Ve en segundos: ingresos (día/semana/mes), ocupación de agenda, top 5 servicios, pacientes activos vs atenciones, próximas citas del día. |
| **Postcondición** | Dueño toma decisión informada (ej: contratar más vets, promocionar servicio X, enviar campaña a pacientes inactivos). |
| **Métrica** | Tiempo para entender estado del negocio < 10 segundos |

---

## 6. Historias de Usuario

| ID | Epic | Historia | Criterios de Aceptación | Prioridad | Estimación |
|---|---|---|---|---|---|
| **H-01** | Dueños | Como recepcionista, quiero registrar un dueño y su mascota en una sola pantalla para no perder tiempo escribiendo los mismos datos dos veces. | • Formulario único con campos de dueño + mascota<br>• Búsqueda de dueño existente por teléfono<br>• Guardado en < 2 segundos<br>• Feedback visual de éxito/error | 🔴 Crítica | 3 pts |
| **H-02** | Historial | Como veterinario, quiero ver el historial completo de un paciente en una línea de tiempo para diagnosticar más rápido. | • Línea de tiempo cronológica descendente<br>• Eventos de consulta, cirugía y vacunas mezclados<br>• Cada evento muestra fecha, tipo, diagnóstico/resumen<br>• Scroll infinito o paginado | 🔴 Crítica | 3 pts |
| **H-03** | Historial | Como veterinario, quiero registrar una consulta con diagnóstico, tratamiento y receta para que quede documentada. | • Formulario con fecha (default hoy), diagnóstico (req.), tratamiento (opc.), notas (opc.)<br>• Validación: mínimo 10 caracteres en diagnóstico<br>• Al guardar, aparece en la línea de tiempo<br>• Solo editable primeras 24h | 🔴 Crítica | 3 pts |
| **H-04** | Vacunas | Como veterinario, quiero registrar vacunas con fecha de próxima dosis para que el sistema recuerde al dueño automáticamente. | • Selección de tipo de vacuna del catálogo<br>• Campos: lote (opc.), fecha aplicación, fecha próxima dosis (opc.)<br>• Al guardar, aparece en línea de tiempo<br>• Si próxima dosis existe → sistema programa recordatorio | 🔴 Crítica | 3 pts |
| **H-05** | Agenda | Como recepcionista, quiero ver la agenda del día con horarios disponibles para agendar citas sin conflictos. | • Vista diaria con slots de 30 min<br>• Slots ocupados mostrados con color azul + nombre mascota<br>• Slots libres clickeables<br>• Validación: no dobles reservas | 🔴 Crítica | 5 pts |
| **H-06** | Dashboard | Como dueño de clínica, quiero ver ingresos del día/semana/mes para saber si el negocio va bien. | • Gráfica de barras: ingresos diarios (semana actual vs anterior)<br>• Total ingresos del mes actual<br>• Tooltip con valor exacto al hover | 🟡 Alta | 5 pts |
| **H-07** | Dashboard | Como dueño de clínica, quiero ver qué servicios generan más ingresos para decidir qué promocionar. | • Top 5 motivos de consulta más frecuentes del mes<br>• Gráfica de barras horizontal o pastel<br>• Basado en `motivo` de citas completadas | 🟡 Alta | 3 pts |
| **H-08** | Dashboard | Como dueño de clínica, quiero ver el porcentaje de ocupación de la agenda para saber si necesito más veterinarios. | • % de ocupación calculado como: citas ocupadas / (días × slots por día por vet)<br>• Mostrar valor numérico + barra de progreso<br>• Período configurable: día/semana/mes | 🟡 Alta | 3 pts |
| **H-09** | Agenda | Como veterinario, quiero editar/cancelar una cita desde la agenda para manejar cambios de último minuto. | • Click en cita → modal con opciones Editar / Cancelar / Completar<br>• Editar: cambiar fecha, hora, vet o motivo<br>• Cancelar: pedir motivo de cancelación (opc.)<br>• Cambios reflejados en tiempo real | 🟡 Alta | 5 pts |
| **H-10** | Dueños | Como recepcionista, quiero buscar mascotas por nombre o dueño para encontrar rápidamente la ficha. | • Campo de búsqueda en header<br>• Búsqueda en dueños (nombre, teléfono) y mascotas (nombre)<br>• Resultados agrupados por tipo<br>• Máximo 10 resultados por grupo<br>• Navegación directa a la ficha | 🟡 Alta | 2 pts |
| **H-11** | Vacunas | Como dueño de mascota, quiero recibir un recordatorio de vacuna por email para no olvidar la dosis de mi perro. | • Email con: nombre de la mascota, tipo de vacuna, fecha de próxima dosis, datos de la clínica<br>• Envío automático 7 días antes<br>• Re-envío si la fecha ya pasó (máx 3 veces)<br>• El vet puede ver cuántos recordatorios se han enviado | 🟢 Media | 5 pts |
| **H-12** | Agenda | Como veterinario, quiero ver qué pacientes tienen citas hoy para prepararme antes de que lleguen. | • Vista "Mis citas de hoy" al abrir la plataforma<br>• Lista: hora, nombre mascota, nombre dueño, motivo<br>• Ordenado por hora ascendente<br>• Acceso directo a la ficha de cada mascota | 🟢 Media | 2 pts |
| **H-13** | Sistema | Como recepcionista, quiero que los datos se guarden automáticamente mientras escribo para no perder información si hay un corte de internet. | • Autoguardado cada 30 segundos en formularios largos<br>• Indicador visual de "guardando..." / "guardado"<br>• Al reconectar, sincronización automática<br>• MVP: solo autoguardado local (PWA fase 2) | 🟢 Media | 8 pts |

### Priorización

| Prioridad | Criterio |
|---|---|
| 🔴 Crítica | Sin esto, el producto no resuelve el problema core. MVP bloqueante. |
| 🟡 Alta | Diferencial importante, necesario para el valor completo del MVP. |
| 🟢 Media | Mejora la experiencia pero no bloquea el lanzamiento. Puede ir en iteración post-lanzamiento. |
| ⚪ Baja | Futuro. No incluido en MVP. |

---

## 7. Alcance MVP

### Dentro del alcance (MVP v1.0)

```
MVP Vetyx v1.0
├── Módulo Dueños
│   ├── CRUD dueños (nombre, teléfono, email, dirección)
│   ├── Búsqueda por nombre/teléfono
│   └── Desactivación lógica (no eliminación física)
│
├── Módulo Mascotas
│   ├── CRUD mascotas (nombre, especie, raza, fecha nacimiento, color, peso)
│   ├── Relación 1:N dueño → mascotas
│   ├── Búsqueda por nombre de mascota o dueño
│   └── Desactivación lógica
│
├── Módulo Historial Médico
│   ├── Línea de tiempo cronológica descendente
│   ├── Registro de consulta (fecha, diagnóstico, tratamiento, notas)
│   ├── Registro de cirugía (fecha, procedimiento, notas)
│   ├── Vacunas visibles como eventos en la línea de tiempo
│   └── Edición restringida a 24h
│
├── Módulo Vacunas
│   ├── Catálogo de vacunas precargado (semilla)
│   ├── Registro de vacuna (tipo, lote, fecha aplicación, fecha próxima dosis)
│   ├── Visualización en ficha del paciente
│   ├── Recordatorio automático por email (Resend)
│   └── Reintentos: 3 recordatorios máximo, cada 7 días
│
├── Módulo Agenda
│   ├── Vista diaria y semanal
│   ├── Crear cita (mascota, vet, fecha+hora, motivo)
│   ├── Editar y cancelar cita
│   ├── Completar cita (con monto opcional)
│   ├── Slots de 30 min fijos (no configurables en MVP)
│   ├── Validación de disponibilidad (sin dobles reservas)
│   ├── Estados: confirmada, completada, cancelada, no-show
│   └── Colores por estado (azul, verde, rojo, gris)
│
├── Módulo Dashboard
│   ├── Ingresos del día vs semana vs mes (gráfica barras)
│   ├── Ocupación de agenda (%)
│   ├── Top 5 servicios más vendidos
│   ├── Mascotas registradas vs atenciones del período
│   └── Próximas citas del día
│
└── Funcionalidades Transversales
    ├── Autenticación via email + magic link
    ├── Tenancy multi-clínica (Row Level Security)
    ├── Búsqueda global (dueños + mascotas)
    ├── Línea de tiempo unificada del paciente
    └── Staff / Usuarios con roles (admin, vet, recepcionista)
```

### Fuera del alcance (post-MVP)

| Funcionalidad | Motivo | Épica |
|---|---|---|
| Facturación electrónica / CFDI | Complejidad regulatoria varía por país | Fase 2 |
| Módulo de farmacia / inventario | No es core para el MVP | Fase 2 |
| Módulo de internamiento | Solo relevante para hospitales grandes | Fase 3 |
| Pagos en línea / pasarela | Sin integración contable aún | Fase 2 |
| App móvil nativa | PWA suficiente para MVP | Fase 3 |
| WhatsApp nativo (API oficial) | Costo y tiempo de integración | Fase 2 |
| Historial de pagos / cuentas por cobrar | No core; dueño usa contabilidad aparte | Fase 2 |
| Portal del cliente (app dueño) | Valor añadido pero no indispensable | Fase 3 |
| Integración con laboratorios | Dependencia externa, compleja | Fase 3 |
| Múltiples sucursales | Pocas clínicas MVP tienen sucursales | Fase 3 |

### Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React 18 + Next.js 14 (App Router) | SSR para landing/SEO, SPA para app, ecosistema maduro |
| UI | Tailwind CSS + shadcn/ui | Rapidez de desarrollo, componentes accesibles, personalizable |
| Estado | React Query (server state) + Zustand (client state) | React Query para caché de API, Zustand para UI state local |
| Backend | Node.js + Express o Python + FastAPI | Decisión pendiente: Node.js (mismo lenguaje que frontend) vs Python (rendimiento consistente) |
| Base de datos | PostgreSQL | Relacional, integridad referencial, JSONB para flexibilidad, RLS para tenancy |
| ORM | Prisma (Node.js) o SQLAlchemy (Python) | Tipado seguro, migraciones, seed data |
| Autenticación | Auth.js (NextAuth) + magic links | Sin contraseñas, mejor UX, seguridad |
| Email | Resend | API simple, buen deliverability, precio por uso |
| Hosting frontend | Vercel | Optimizado para Next.js, deploy automático desde GitHub |
| Hosting backend | Railway o Render | Sencillos, escalables, buen precio en etapa temprana |
| Base de datos | Neon (serverless PostgreSQL) o Supabase | Buen tier gratuito, escalabilidad |
| Storage | Supabase Storage o Uploadthing | Para fotos de mascotas (post-MVP) |

---

## 8. Roadmap 90 Días

### Resumen ejecutivo

```
Sprint 0 (W1-2)    → Fundación técnica + Dueños + Mascotas
Sprint 1 (W3-4)    → Historial Médico + Vacunas + Recordatorios
Sprint 2 (W5-6)    → Agenda completa
Sprint 3 (W7-8)    → Dashboard + Refinamiento + Bug fixing
Sprint 4 (W9-10)   → Landing page + Onboarding + Beta cerrada (3-5 clínicas)
Sprint 5 (W11-12)  → Feedback loop + Iteración + Primeras 10 ventas
```

### Sprint 0 — Semanas 1-2: Fundación

| Tarea | Descripción | Dependencia |
|---|---|---|
| S0.1 | Setup del repo monorepo, CI/CD (GitHub Actions) | — |
| S0.2 | Configurar base de datos + ORM + seed data inicial | — |
| S0.3 | Desplegar frontend (Vercel) + backend (Railway) | S0.1 |
| S0.4 | Autenticación: magic link, sesiones, RLS | S0.2 |
| S0.5 | Layout base: sidebar + header + navegación | S0.3 |
| S0.6 | Setup de usuarios/staff (CRUD admin) | S0.4, S0.5 |
| S0.7 | **Módulo Dueños:** CRUD + búsqueda + desactivación | S0.5 |
| S0.8 | **Módulo Mascotas:** CRUD + búsqueda + relación dueño | S0.7 |
| **Entregable** | **Demo interna:** registrar dueño + mascota, buscarlos, editar. | |

### Sprint 1 — Semanas 3-4: Core clínico

| Tarea | Descripción | Dependencia |
|---|---|---|
| S1.1 | Ficha del paciente: vista unificada con datos + línea de tiempo | S0.8 |
| S1.2 | **Historial Médico:** registrar consulta + cirugía | S1.1 |
| S1.3 | Línea de tiempo: mostrar eventos ordenados + vacunas | S1.2 |
| S1.4 | Edición restringida de historial (24h) | S1.2 |
| S1.5 | **Vacunas:** CRUD + catálogo semilla | S1.1 |
| S1.6 | Vacunas visibles en línea de tiempo | S1.3, S1.5 |
| S1.7 | Sistema de recordatorios: worker que revisa próximas dosis y envía email | S1.5 |
| S1.8 | Límite de re-intentos (3 recordatorios) | S1.7 |
| **Entregable** | **Demo con vet:** registrar consulta, ver línea de tiempo, aplicar vacuna, recibir recordatorio. | |

### Sprint 2 — Semanas 5-6: Agenda

| Tarea | Descripción | Dependencia |
|---|---|---|
| S2.1 | **Agenda:** modelo de datos + seed de slots | S0.3 |
| S2.2 | Vista diaria: grid de slots de 30 min | S2.1 |
| S2.3 | Vista semanal: 7 columnas | S2.2 |
| S2.4 | Crear cita: selector de fecha+hora, mascota, vet, motivo | S2.2, S0.8 |
| S2.5 | Validación de disponibilidad (sin dobles reservas) | S2.4 |
| S2.6 | Editar cita (cambiar fecha/hora/vet/motivo) | S2.5 |
| S2.7 | Cancelar cita + motivo de cancelación | S2.5 |
| S2.8 | Completar cita + registro de monto | S2.5 |
| S2.9 | Estados: confirmada, completada, cancelada, no-show | S2.6, S2.7, S2.8 |
| S2.10 | Colores por estado en agenda | S2.2, S2.9 |
| **Entregable** | **Demo con recepcionista:** agendar, editar, cancelar y completar citas sin conflictos. | |

### Sprint 3 — Semanas 7-8: Dashboard + Refinamiento

| Tarea | Descripción | Dependencia |
|---|---|---|
| S3.1 | **Dashboard:** query de agregados desde citas | S2.8, S2.9 |
| S3.2 | Gráfica de ingresos (barras, día/semana/mes) | S3.1 |
| S3.3 | Ocupación de agenda (porcentaje) | S3.1 |
| S3.4 | Top 5 servicios (agrupación por motivo) | S3.1 |
| S3.5 | Contadores: mascotas activas vs atenciones del período | S3.1 |
| S3.6 | Próximas citas del día en dashboard | S3.1 |
| S3.7 | Estados vacíos con CTAs para cada widget | S3.2–S3.6 |
| S3.8 | Bug fixing general | Todos anteriores |
| S3.9 | Refinamiento UX: micro-interacciones, loading states, errores | S3.8 |
| S3.10 | Pruebas de integración (core flows) | S3.9 |
| **Entregable** | **Producto completo MVP v1.0 estable.** | |

### Sprint 4 — Semanas 9-10: Validación comercial

| Tarea | Descripción | Dependencia |
|---|---|---|
| S4.1 | Landing page: vetyx.io con hero, features, pricing, CTAs | — |
| S4.2 | Blog / content marketing (2 artículos) | — |
| S4.3 | Onboarding flow: registro → crear primera mascota → agendar primera cita | S3.10 |
| S4.4 | Modo demo: clínica con datos precargados (10 mascotas, 5 dueños, 20 citas) | S3.10 |
| S4.5 | Reclutar 3-5 clínicas beta (outreach directo, WhatsApp, LinkedIn) | S4.3 |
| S4.6 | Sesiones de onboarding guiado con cada beta | S4.5 |
| **Entregable** | **Beta cerrada con 3-5 clínicas activas.** | |

### Sprint 5 — Semanas 11-12: Iteración + ventas

| Tarea | Descripción | Dependencia |
|---|---|---|
| S5.1 | Recopilar feedback de beta (entrevistas, analytics, NPS) | S4.6 |
| S5.2 | Priorizar y resolver bugs críticos reportados | S5.1 |
| S5.3 | Pequeñas mejoras UX basadas en feedback (quick wins) | S5.1 |
| S5.4 | Ajuste de pricing según feedback (si aplica) | S5.1 |
| S5.5 | Campaña de outreach para conseguir 10 clínicas pagando | S5.2 |
| S5.6 | Setup de Stripe / cobros recurrentes | S4.1 |
| S5.7 | **Meta: 10 clínicas pagando** | S5.5, S5.6 |
| **Entregable** | **10 clínicas activas pagando. Validación de PMF inicial.** | |

### Diagrama de dependencias entre sprints

```
Sprint 0 ──→ Sprint 1 ──→ Sprint 2 ──→ Sprint 3 ──→ Sprint 4 ──→ Sprint 5
 (base)       (core clin)   (agenda)     (dashboard)   (comercial)    (iteración)
```

---

## 9. KPIs

### North Star Metric

> **# de atenciones registradas por clínica por semana**

Si registran consultas, el producto tiene valor. Si dejan de registrar, el churn es inminente. Esta métrica es el mejor proxy de "salud del producto" porque:
- Requiere que la mascota esté registrada (OKR Dueños + Mascotas)
- Requiere que el vet use la plataforma durante la consulta (OKR Historial)
- Se correlaciona directamente con ingresos (cada atención es un cobro potencial)

### Métricas de producto (post-lanzamiento)

| KPI | Definición | Fórmula / Fuente | Target Día 90 | Target Día 180 |
|---|---|---|---|---|
| **Registros totales** | Clínicas que crearon cuenta | Tabla `clinics` | 30 | 100 |
| **Clínicas activas (WAU)** | Clínicas con ≥1 acción en los últimos 7 días | Logs de actividad | 20 | 60 |
| **Clínicas pagando** | Suscripción activa y al corriente | Stripe / tabla `subscriptions` | 10 | 40 |
| **Mascotas por clínica** | Promedio de pacientes registrados | AVG(count mascotas) por clínica activa | ≥ 100 | ≥ 200 |
| **Citas por clínica / semana** | Atenciones registradas semanalmente | COUNT(citas) / COUNT(clínicas activas) | ≥ 30 | ≥ 50 |
| **Tasa de retención semanal** | % de clínicas activas que usan la app cada semana | WAU / total clínicas activas | ≥ 80% | ≥ 85% |
| **NPS** | "¿Qué tan probable es que recomiendes Vetyx a otro colega?" (0-10) | Encuesta in-app en semana 8 | ≥ 40 | ≥ 50 |
| **Tiempo de registro** | Tiempo promedio para registrar dueño + mascota | Analytics de formulario | < 60s | < 45s |
| **Tasa de completitud de cita** | % de citas confirmadas que llegan a completadas | COUNT(completada) / COUNT(confirmada) | ≥ 70% | ≥ 75% |

### Métricas de negocio

| KPI | Definición | Target Día 90 | Target Día 180 |
|---|---|---|---|
| **MRR** | Monthly Recurring Revenue | $500 USD (10 × $50) | $2,000 USD (40 × $50) |
| **ARR** | Annual Run Rate | $6,000 USD | $24,000 USD |
| **CAC** | Customer Acquisition Cost | < $50 USD | < $40 USD |
| **Payback period** | Tiempo para recuperar CAC | < 1 mes | < 1 mes |
| **LTV estimado** | Vida útil promedio × MRR por cliente | > $600 USD (12 meses) | > $1,200 USD (24 meses) |
| **Churn mensual** | % de clínicas que cancelan por mes | < 5% | < 3% |
| **Gross margin** | (MRR - costos infraestructura) / MRR | > 80% | > 85% |

### Señales de Product-Market Fit (semana 12)

| Señal | Criterio | Cómo medirlo |
|---|---|---|
| **Uso diario** | ≥3 clínicas activas todos los días hábiles | Logs de actividad |
| **Recomendación orgánica** | ≥1 clínica que recomiende Vetyx a otro colega sin pedírselo | Entrevistas cualitativas |
| **Dolor por quitarlo** | ≥1 clínica que diga "no puedo volver a trabajar sin esto" | Entrevistas cualitativas + encuesta |
| **Retención semanal** | ≥80% de clínicas activas usan la app cada semana | WAU / clínicas activas |
| **Disposición a pagar** | 10 clínicas pagando $49+ USD/mes | Stripe |

### OKR (Objectives & Key Results) — Semana 12

**Objetivo:** Validar que clínicas veterinarias en LatAm pagan por Vetyx y lo usan como su herramienta diaria.

| Key Result | Meta | Progreso | Propietario |
|---|---|---|---|
| KR1: 10 clínicas con suscripción activa pagando ≥ $49/mes | 10 | — | Growth |
| KR2: ≥ 30 citas registradas por clínica activa por semana | 30 | — | Producto |
| KR3: ≥ 80% de clínicas activas semanalmente | 80% | — | Producto |
| KR4: NPS ≥ 40 en encuesta de satisfacción | 40 | — | Customer Success |

### Señales de alerta temprana

| Síntoma | Qué hacer |
|---|---|
| Churn > 10% en primeros 2 meses | Entrevistar a todos los que cancelaron. Posible problema de precio, UX o expectativas. |
| Mascotas por clínica < 50 | El onboarding no está migrando los datos. Mejorar importación o asistencia. |
| NPS < 20 | Hay un problema grave de UX o propuesta de valor. Re-evaluar producto. |
| CAC > $100 USD | El canal de adquisición no es rentable. Probar otros canales (WhatsApp groups, referidos, Instagram). |
| Citas/día < 5 en clínicas activas | El producto no se integró al flujo diario. Mejorar recordatorios, notificaciones, hábitos. |

---

## 10. Decisiones Tomadas

| ID | Decisión | Alternativas consideradas | Justificación | Fecha |
|---|---|---|---|---|
| **D-01** | SaaS web (responsive), no app nativa | App nativa (React Native, Flutter), PWA pura | Web app con PWA permite iterar más rápido, mismo equipo, costo inicial menor. App nativa en fase 2. | 2026-06-12 |
| **D-02** | Sin facturación electrónica en MVP | Incluir CFDI/factura desde el inicio | Complejidad regulatoria varía por país. Posponer evita retrasos de 4-8 semanas en MVP. | 2026-06-12 |
| **D-03** | Precio único ($49/mes) en MVP | Planes por vet, por mascotas, freemium | Simplifica ventas y desarrollo. Precio único permite validar disposición a pagar sin complejidad de tiers. | 2026-06-12 |
| **D-04** | Autenticación sin contraseña (magic link) | Email + password, Google OAuth, SMS | Magic link = mejor UX de registro, sin fricción de recordar contraseñas. Complementar con OAuth en fase 2. | 2026-06-12 |
| **D-05** | Recordatorios por email primero, no WhatsApp | Solo WhatsApp, ambos desde el inicio | Email via Resend es trivial. WhatsApp requiere API oficial (Meta) con costo y validación. WhatsApp en fase 2. | 2026-06-12 |
| **D-06** | Slots de 30 min fijos | Slots configurables por clínica, por vet, por día | Configurabilidad añade complejidad UI/UX + backend innecesaria para MVP. 30 min es el estándar de la industria. Post-MVP se configura. | 2026-06-12 |
| **D-07** | PostgreSQL con RLS para tenancy | Base de datos separada por clínica, schema por tenant | RLS es más simple de escalar, menor costo operativo. Aislamiento por base de datos es overkill para MVP. | 2026-06-12 |
| **D-08** | Catálogo de vacunas semilla (no editable en MVP) | Catálogo editable por clínica, catálogo abierto | Semilla cubre >90% de casos. Editar catálogo añade pantalla de configuración. Se pospone. | 2026-06-12 |
| **D-09** | Sin portal del cliente (app dueño) en MVP | Incluir portal básico | Dueño de mascota no es el comprador. El cliente es la clínica. Portal agrega valor pero no es necesario para venta inicial. | 2026-06-12 |
| **D-10** | Desactivación lógica (soft delete) en todos los módulos | Eliminación física, archivado | Soft delete permite recuperación de datos, mantiene integridad referencial, y evita pérdida accidental de historial clínico. | 2026-06-12 |
| **D-11** | Historial médico no eliminable, editable por 24h | Editable sin límite, no editable nunca, eliminable | Balance entre flexibilidad y auditoría: el vet puede corregir errores inmediatos pero no alterar el registro histórico después de 24h. | 2026-06-12 |
| **D-12** | Dashboard con datos en caché (máx 5 min de desfase) | Tiempo real (queries directas a DB) | Evitar impacto en performance transaccional por queries pesadas de agregación. Caché aceptable para dashboard que se consulta pocas veces al día. | 2026-06-12 |
| **D-13** | Next.js (App Router) como framework full-stack | React + Vite + backend separado, Remix, SPA + API | Next.js unifica frontend + API en un solo deploy. App Router permite layouts anidados, Server Components para dashboard, y SSR para landing. | 2026-06-12 |
| **D-14** | No hay soporte multi-sucursal en MVP | Incluir multi-sucursal desde el inicio | Pocas clínicas MVP operan con sucursales. Añade complejidad significativa (agenda cruzada, reportes consolidados, inventario). Post-MVP. | 2026-06-12 |
| **D-15** | Beta cerrada con 3-5 clínicas (no open beta) | Open beta, early access público | Beta cerrada permite iterar rápido con feedback concentrado, construir casos de éxito, y ajustar pricing antes de exponerse al mercado masivo. | 2026-06-12 |

### Decisiones pendientes

| ID | Decisión | A definir por | Fecha límite |
|---|---|---|---|
| **DP-01** | Node.js + Express vs Python + FastAPI para backend | Tech Lead | Semana 0 |
| **DP-02** | Neon vs Supabase para base de datos | Tech Lead | Semana 0 |
| **DP-03** | Exacto del precio final ($49 vs $59 vs $79) | PM + Founder | Semana 8 (antes de ventas) |
| **DP-04** | Modo offline: PWA + IndexedDB vs puerta trasera | Tech Lead | Semana 2 (decisión temprana afecta arquitectura) |

---

## Apéndices

### A. Glosario

| Término | Definición |
|---|---|
| **Tenant** | Clínica (cliente del SaaS). Cada tenant tiene datos aislados de otros. |
| **RLS** | Row-Level Security. Filtro automático de filas por `clinic_id`. |
| **Magic Link** | Enlace de inicio de sesión único enviado por email. No requiere contraseña. |
| **Soft Delete** | Marcado como inactivo sin eliminar físicamente el registro de la DB. |
| **PMF** | Product-Market Fit. Punto en que el producto satisface una necesidad real del mercado. |
| **MRR** | Monthly Recurring Revenue. Ingresos recurrentes mensuales. |
| **CAC** | Customer Acquisition Cost. Costo de adquirir un cliente. |
| **LTV** | Lifetime Value. Valor total que un cliente genera durante su relación con el producto. |
| **Churn** | Tasa de cancelación de clientes. |
| **NPS** | Net Promoter Score. Probabilidad de recomendación (0-10). |
| **WAU** | Weekly Active Users. Usuarios activos en los últimos 7 días. |

### B. Referencias

- **Competencia analizada:** VetRecord, ezyVet, PetDesk, Vetter, Covetrus, Vetstoria, y 3 competidores locales no nombrados por confidencialidad.
- **Entrevistas:** 5 clínicas en México (CDMX, Guadalajara, Monterrey) y 2 en Colombia (Bogotá, Medellín).
- **Documentos relacionados:** FRD MVP v1.0 (`docs/02-frd.md`), Wireframes UX (pendiente), API Contract (pendiente).

---

*Documento oficial del proyecto Vetyx.io. Este PRD es un documento vivo y será actualizado según aprendizaje del mercado y feedback de usuarios.*
