# Vetyx.io — Functional Requirements Document (FRD) MVP v1.0

| Versión | Fecha | Autor | Estado |
|---|---|---|---|
| 1.0 | 2026-06-12 | Senior PM | Borrador |

**Documento fuente:** `docs/01-prd.md`
**Alcance:** MVP v1.0 — 8 módulos funcionales

---

## Tabla de Contenidos

1. [Módulo: Clínicas](#módulo-clínicas)
2. [Módulo: Usuarios](#módulo-usuarios)
3. [Módulo: Dueños](#módulo-dueños)
4. [Módulo: Mascotas](#módulo-mascotas)
5. [Módulo: Citas](#módulo-citas)
6. [Módulo: Historial Médico](#módulo-historial-médico)
7. [Módulo: Vacunas](#módulo-vacunas)
8. [Módulo: Dashboard](#módulo-dashboard)
9. [Tabla de Dependencias](#tabla-de-dependencias)
10. [Funcionalidades Transversales](#funcionalidades-transversales)

---

## Módulo: Clínicas

### Objetivo

Gestionar el registro y configuración básica de cada tenant (clínica) en la plataforma SaaS. Cada clínica es una entidad aislada con sus propios datos, usuarios y configuración.

### Actores

- **Sistema** — creación automática durante el registro
- **Admin de clínica** — primer usuario que se registra (dueño de la clínica)

### Casos de Uso

| ID | Caso de Uso | Actor | Descripción |
|---|---|---|---|
| FRD-CL-01 | Registrar clínica | Sistema | Crea una nueva clínica durante el flujo de registro del admin |
| FRD-CL-02 | Ver datos de la clínica | Admin | Visualiza nombre, dirección, teléfono y datos de contacto |
| FRD-CL-03 | Editar perfil de clínica | Admin | Modifica nombre, dirección o teléfono de la clínica |
| FRD-CL-04 | Desactivar clínica | Admin | Desactiva la cuenta de la clínica (baja del servicio) |

### Reglas de Negocio

- **RN-CL-01:** Cada clínica es un tenant aislado. Ningún dato es visible entre clínicas.
- **RN-CL-02:** El `slug` se genera automáticamente a partir del nombre (`veterinaria-patitas-felices`), debe ser único.
- **RN-CL-03:** No se permite eliminar físicamente una clínica. Solo se marca como `inactiva`.
- **RN-CL-04:** Una clínica inactiva no permite login de ninguno de sus usuarios.
- **RN-CL-05:** `plan` es un campo informativo en MVP. No hay restricciones por plan aún.

### Validaciones

| Campo | Regla |
|---|---|
| `nombre` | Requerido, máximo 120 caracteres |
| `slug` | Generado automáticamente, único, máximo 80 caracteres |
| `email` | Requerido, formato email válido |
| `telefono` | Opcional, formato +52 o 10 dígitos |
| `direccion` | Opcional, máximo 250 caracteres |

### Campos

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | UUID | auto | Identificador único |
| `nombre` | string | sí | Nombre comercial de la clínica |
| `slug` | string | auto | Identificador URL amigable, único |
| `email` | string | sí | Email de contacto de la clínica |
| `telefono` | string | no | Teléfono de contacto |
| `direccion` | text | no | Dirección física |
| `plan` | enum | default: `mvp` | Plan de suscripción (reservado para futuro) |
| `activo` | boolean | default: true | Estado del tenant |
| `fecha_registro` | timestamp | auto | Fecha de creación |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

### Estados

`Activa` → `Inactiva` (baja del servicio)

### Dependencias

- Ninguna (módulo raíz de tenancy).
- Todos los demás módulos dependen de `clinic_id`.

### Criterios de Aceptación

| ID | Criterio |
|---|---|
| CA-CL-01 | Al registrarse el primer usuario, se crea la clínica con slug único automático |
| CA-CL-02 | Admin puede editar nombre, teléfono y dirección desde configuración |
| CA-CL-03 | Al desactivar la clínica, todos los usuarios asociados pierden acceso inmediato |
| CA-CL-04 | El `clinic_id` se propaga automáticamente en todas las tablas hijas |

---

## Módulo: Usuarios (Staff)

### Objetivo

Gestionar el equipo de trabajo de cada clínica, con roles y permisos diferenciados para controlar el acceso a cada funcionalidad.

### Actores

- **Admin** — CRUD completo de usuarios, asignación de roles
- **Veterinario** — solo lectura de su perfil
- **Recepcionista** — solo lectura de su perfil

### Casos de Uso

| ID | Caso de Uso | Actor | Descripción |
|---|---|---|---|
| FRD-US-01 | Invitar usuario | Admin | Envía invitación por email a un nuevo miembro del staff |
| FRD-US-02 | Aceptar invitación | Nuevo usuario | Acepta la invitación y crea su cuenta con magic link |
| FRD-US-03 | Listar staff | Admin | Ve todos los miembros de la clínica con su rol y estado |
| FRD-US-04 | Cambiar rol | Admin | Modifica el rol de un usuario existente |
| FRD-US-05 | Desactivar usuario | Admin | Revoca el acceso de un miembro del staff |
| FRD-US-06 | Ver mi perfil | Todos | Cada usuario ve sus propios datos |

### Reglas de Negocio

- **RN-US-01:** Cada clínica debe tener al menos 1 usuario con rol `admin` en todo momento.
- **RN-US-02:** Roles disponibles: `admin`, `vet`, `recepcionista`. No se pueden crear roles personalizados en MVP.
- **RN-US-03:** Solo el admin puede invitar, cambiar roles o desactivar usuarios.
- **RN-US-04:** Un email puede estar asociado a una sola clínica (no hay usuarios multi-tenant en MVP).
- **RN-US-05:** El usuario que creó la clínica (`owner`) tiene rol `admin` y no puede ser degradado ni desactivado por otro admin.
- **RN-US-06:** Al desactivar un usuario, sus citas futuras se mantienen pero se muestran sin asignación de vet.

### Permisos por rol

| Acción | Admin | Vet | Recepcionista |
|---|---|---|---|
| Gestionar usuarios | ✅ | ❌ | ❌ |
| CRUD Dueños | ✅ | ✅ (lectura) | ✅ |
| CRUD Mascotas | ✅ | ✅ | ✅ (excepto peso/alergias) |
| CRUD Historial Médico | ✅ | ✅ | ❌ |
| CRUD Vacunas | ✅ | ✅ | ❌ |
| CRUD Citas | ✅ | ✅ | ✅ |
| Completar cita | ✅ | ✅ | ❌ |
| Dashboard (completo) | ✅ | ✅ (parcial) | ❌ |
| Configuración clínica | ✅ | ❌ | ❌ |

### Validaciones

| Campo | Regla |
|---|---|
| `email` | Requerido, formato email, único por clínica |
| `nombre` | Requerido, máximo 100 caracteres |
| `rol` | Requerido, enum: `admin`, `vet`, `recepcionista` |
| `telefono` | Opcional, máximo 20 caracteres |

### Campos

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | UUID | auto | Identificador único |
| `clinic_id` | UUID | auto | Tenant |
| `email` | string | sí | Email de inicio de sesión |
| `nombre` | string | sí | Nombre completo |
| `rol` | enum | sí | admin / vet / recepcionista |
| `telefono` | string | no | Teléfono de contacto |
| `activo` | boolean | default: true | Estado del usuario |
| `ultimo_acceso` | timestamp | no | Último inicio de sesión |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

### Estados

`Pendiente` (invitación enviada, no aceptada) → `Activo` → `Inactivo`

### Dependencias

- **Módulo Clínicas** — `clinic_id` FK.

### Criterios de Aceptación

| ID | Criterio |
|---|---|
| CA-US-01 | Admin puede invitar usuarios por email y estos reciben un magic link |
| CA-US-02 | Cada rol solo puede realizar las acciones según matriz de permisos |
| CA-US-03 | Admin no puede desactivar al owner de la clínica |
| CA-US-04 | Al menos 1 admin siempre activo en la clínica |
| CA-US-05 | Usuario desactivado no puede iniciar sesión |

---

## Módulo: Dueños

### Objetivo

Registrar y gestionar los datos de contacto de los dueños de mascotas, permitiendo búsqueda rápida y vinculación con sus pacientes.

### Actores

- **Recepcionista** — CRUD completo
- **Veterinario** — solo lectura
- **Admin** — CRUD completo

### Casos de Uso

| ID | Caso de Uso | Actor | Descripción |
|---|---|---|---|
| FRD-DU-01 | Registrar dueño | Recepcionista, Admin | Crea un nuevo dueño con datos básicos de contacto |
| FRD-DU-02 | Buscar dueños | Recepcionista, Vet, Admin | Busca por nombre o teléfono con autocompletado |
| FRD-DU-03 | Editar dueño | Recepcionista, Admin | Modifica datos del dueño existente |
| FRD-DU-04 | Ver perfil del dueño | Recepcionista, Vet, Admin | Visualiza datos del dueño y lista de sus mascotas |
| FRD-DU-05 | Desactivar dueño | Admin | Marca como inactivo (no se elimina físicamente) |

### Reglas de Negocio

- **RN-DU-01:** Un dueño puede tener N mascotas (1:N).
- **RN-DU-02:** El teléfono debe ser único dentro de la misma clínica.
- **RN-DU-03:** Un dueño no se elimina físicamente; se marca como inactivo.
- **RN-DU-04:** No se puede desactivar un dueño que tenga mascotas activas. Primero deben desactivarse o reasignarse sus mascotas.
- **RN-DU-05:** `email` es opcional. Si se ingresa, se usa para enviar recordatorios de vacunas.

### Validaciones

| Campo | Regla |
|---|---|
| `nombre` | Requerido, máximo 120 caracteres |
| `telefono` | Requerido, formato +521234567890 o 10 dígitos, único por clínica |
| `email` | Opcional, formato email válido |
| `direccion` | Opcional, máximo 250 caracteres |

### Campos

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | UUID | auto | Identificador único |
| `clinic_id` | UUID | auto | Tenant |
| `nombre` | string | sí | Nombre completo del dueño |
| `telefono` | string | sí | Teléfono de contacto principal |
| `email` | string | no | Correo electrónico (para recordatorios) |
| `direccion` | text | no | Dirección física |
| `activo` | boolean | default: true | Estado del registro |
| `created_by` | UUID | auto | Usuario que registró |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

### Estados

`Activo` → `Inactivo` (desactivación manual por admin)

### Dependencias

- **Módulo Clínicas** — `clinic_id`.
- **Módulo Usuarios** — `created_by` FK.

### Criterios de Aceptación

| ID | Criterio |
|---|---|
| CA-DU-01 | Registro de dueño + mascota en misma pantalla en < 60 segundos |
| CA-DU-02 | Búsqueda por nombre o teléfono con resultados en < 500ms |
| CA-DU-03 | No se permite duplicar teléfono dentro de la misma clínica |
| CA-DU-04 | Al desactivar dueño con mascotas activas, el sistema rechaza la operación con mensaje claro |
| CA-DU-05 | Dueño inactivo no aparece en búsquedas globales ni en autocompletado de citas |

---

## Módulo: Mascotas (Pacientes)

### Objetivo

Registrar y gestionar los datos clínicos básicos de cada paciente, vinculándolo a su dueño y a su historial médico completo.

### Actores

- **Recepcionista** — CRUD de datos básicos (nombre, especie, raza, color)
- **Veterinario** — CRUD completo (incluye peso, alergias)
- **Admin** — CRUD completo

### Casos de Uso

| ID | Caso de Uso | Actor | Descripción |
|---|---|---|---|
| FRD-MA-01 | Registrar mascota | Recepcionista, Admin | Crea mascota vinculada a un dueño existente |
| FRD-MA-02 | Buscar mascotas | Recepcionista, Vet, Admin | Busca por nombre de mascota o nombre del dueño |
| FRD-MA-03 | Editar mascota | Recepcionista*, Vet, Admin | Modifica datos generales de la mascota |
| FRD-MA-04 | Ver ficha de mascota | Recepcionista, Vet, Admin | Vista unificada: datos fijos + historial médico + vacunas |
| FRD-MA-05 | Ver línea de tiempo | Vet, Admin | Historial cronológico completo del paciente |
| FRD-MA-06 | Desactivar mascota | Vet, Admin | Marca como inactiva (fallecimiento, pérdida, dueño se fue) |

\*Recepcionista solo puede editar datos no clínicos (nombre, raza, color).

### Reglas de Negocio

- **RN-MA-01:** Toda mascota debe pertenecer a un dueño activo.
- **RN-MA-02:** `especie` se limita a un catálogo inicial: `perro`, `gato`, `otro`.
- **RN-MA-03:** Si `especie = otro`, el campo `raza` se vuelve obligatorio (texto libre descriptivo).
- **RN-MA-04:** `peso` se almacena en kg con 1 decimal.
- **RN-MA-05:** `fecha_nacimiento` puede ser aproximada (solo año o año+mes si se desconoce el día exacto).
- **RN-MA-06:** `esterilizado` es campo informativo. No tiene impacto en reglas de negocio del MVP.
- **RN-MA-07:** Una mascota inactiva no puede agendarse a nuevas citas ni recibir vacunas.

### Validaciones

| Campo | Regla |
|---|---|
| `nombre` | Requerido, máximo 80 caracteres |
| `especie` | Requerido, enum: `perro`, `gato`, `otro` |
| `raza` | Opcional (obligatorio si especie = otro), máximo 80 caracteres |
| `fecha_nacimiento` | Opcional, no puede ser futura |
| `color` | Opcional, máximo 80 caracteres |
| `peso` | Opcional, decimal positivo ≤ 200 kg |
| `owner_id` | Requerido, debe existir en tabla dueños y estar activo |
| `sexo` | Opcional, enum: `macho`, `hembra`, `no_especificado` |

### Campos

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | UUID | auto | Identificador único |
| `clinic_id` | UUID | auto | Tenant |
| `owner_id` | UUID | sí | Dueño responsable |
| `nombre` | string | sí | Nombre de la mascota |
| `especie` | enum | sí | perro / gato / otro |
| `raza` | string | no | Raza o descripción |
| `fecha_nacimiento` | date | no | Fecha de nacimiento |
| `color` | string | no | Color o señas particulares |
| `peso` | decimal(5,1) | no | Peso en kg |
| `sexo` | enum | no | macho / hembra / no_especificado |
| `esterilizado` | boolean | default: false | Estado de esterilización |
| `activo` | boolean | default: true | Estado del registro |
| `created_by` | UUID | auto | Usuario que registró |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

### Estados

`Activo` → `Inactivo`

### Dependencias

- **Módulo Dueños** — `owner_id` FK.
- **Módulo Clínicas** — `clinic_id`.

### Criterios de Aceptación

| ID | Criterio |
|---|---|
| CA-MA-01 | Registro de mascota vinculado a dueño existente en < 30 segundos |
| CA-MA-02 | Búsqueda por nombre de mascota o nombre de dueño combinado |
| CA-MA-03 | Recepcionista NO puede modificar peso ni datos clínicos |
| CA-MA-04 | Mascota inactiva no aparece en el selector de citas nuevas |
| CA-MA-05 | Ficha de mascota consolida datos + historial + vacunas en una sola vista |

---

## Módulo: Citas (Agenda)

### Objetivo

Gestionar la programación de citas médicas, evitando conflictos de horario, permitiendo visibilidad diaria y semanal del flujo de trabajo, y registrando el monto de cada atención completada.

### Actores

- **Recepcionista** — CRUD completo de citas
- **Veterinario** — lectura, puede cambiar estado a completada
- **Admin** — CRUD completo, puede completar citas

### Casos de Uso

| ID | Caso de Uso | Actor | Descripción |
|---|---|---|---|
| FRD-CI-01 | Crear cita | Recepcionista, Admin | Agenda nueva cita con mascota, vet, fecha, hora y motivo |
| FRD-CI-02 | Ver agenda diaria | Recepcionista, Vet, Admin | Lista de citas del día ordenadas por hora |
| FRD-CI-03 | Ver agenda semanal | Recepcionista, Vet, Admin | Grid de 7 días con slots ocupados/disponibles |
| FRD-CI-04 | Editar cita | Recepcionista, Admin | Cambia fecha, hora, vet o motivo de cita existente |
| FRD-CI-05 | Cancelar cita | Recepcionista, Admin | Cambia estado a cancelada (con motivo de cancelación opcional) |
| FRD-CI-06 | Completar cita | Vet, Admin | Marca cita como atendida y registra monto |
| FRD-CI-07 | Marcar no-show | Recepcionista, Admin | Marca cita como no asistió el paciente |

### Reglas de Negocio

- **RN-CI-01:** No puede haber dos citas para el mismo `veterinario_id` en el mismo `fecha_hora` con estado `confirmada`. Se valida al crear y al editar.
- **RN-CI-02:** La duración por defecto de toda cita es 30 minutos. No configurable en MVP.
- **RN-CI-03:** No se puede crear/editar una cita con `fecha_hora` en el pasado (excepto para marcarla como completada, con tolerancia de 5 min).
- **RN-CI-04:** Solo se puede cancelar una cita si su estado es `confirmada`.
- **RN-CI-05:** Solo se puede completar una cita si su estado es `confirmada`.
- **RN-CI-06:** Una cita cancelada no se puede reactivar. Se crea una nueva.
- **RN-CI-07:** `motivo` debe ser un texto descriptivo (no catálogo en MVP).
- **RN-CI-08:** `monto` es opcional al completar la cita. Si no se ingresa, no se contabiliza en ingresos del dashboard.
- **RN-CI-09:** Colores por estado: `confirmada` (azul), `completada` (verde), `cancelada` (rojo), `no-show` (gris).

### Validaciones

| Campo | Regla |
|---|---|
| `mascota_id` | Requerido, mascota activa |
| `veterinario_id` | Requerido, usuario en clínica con rol `vet` o `admin` |
| `fecha_hora` | Requerido, datetime, no pasado (> now con 5 min de tolerancia) |
| `motivo` | Requerido, mínimo 5 caracteres, máximo 200 caracteres |
| `duracion_minutos` | default: 30, no modificable en MVP |
| `monto` | Opcional, decimal ≥ 0, solo al completar |
| `motivo_cancelacion` | Opcional, máximo 200 caracteres |

### Campos

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | UUID | auto | |
| `clinic_id` | UUID | auto | |
| `mascota_id` | UUID | sí | Paciente |
| `veterinario_id` | UUID | sí | Vet asignado |
| `fecha_hora` | timestamp | sí | Día y hora de la cita |
| `duracion_minutos` | int | default: 30 | Duración del slot |
| `motivo` | string | sí | Motivo de la consulta |
| `estado` | enum | default: confirmada | confirmada / completada / cancelada / no-show |
| `monto` | decimal(10,2) | no | Monto cobrado (se llena al completar) |
| `notas_internas` | text | no | Notas de la recepcionista |
| `motivo_cancelacion` | text | no | Motivo si estado = cancelada |
| `created_by` | UUID | sí | Quién agendó |
| `completed_by` | UUID | no | Vet que completó la cita |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

### Estados

```
Confirmada ──→ Completada
Confirmada ──→ Cancelada
Confirmada ──→ No-show
No-show ──→ Cancelada (solo si se aclara después)
```

Transiciones permitidas exclusivamente:

| Estado actual | Estado destino | Permitido |
|---|---|---|
| confirmada | completada | ✅ |
| confirmada | cancelada | ✅ |
| confirmada | no-show | ✅ |
| no-show | cancelada | ✅ |
| completada | *ninguno* | ❌ (terminal) |
| cancelada | *ninguno* | ❌ (terminal) |

### Dependencias

- **Módulo Mascotas** — `mascota_id` FK.
- **Módulo Usuarios** — `veterinario_id` FK, `created_by` FK.
- **Módulo Dashboard** — `monto` y `estado` alimentan métricas de ingresos y ocupación.

### Criterios de Aceptación

| ID | Criterio |
|---|---|
| CA-CI-01 | Al crear cita, el sistema valida disponibilidad y rechaza dobles reservas con mensaje de error |
| CA-CI-02 | Vista diaria muestra slots ocupados (azul) y libres (blanco) |
| CA-CI-03 | Vista semanal muestra 7 columnas con resumen de citas por día |
| CA-CI-04 | Solo vet/admin pueden cambiar estado a `completada` |
| CA-CI-05 | Al completar cita, se solicita `monto` como campo opcional |
| CA-CI-06 | Cita cancelada no se puede modificar ni reactivar |
| CA-CI-07 | Colores visibles y consistentes en todas las vistas de agenda |

---

## Módulo: Historial Médico

### Objetivo

Mantener un registro cronológico e inmutable de todos los eventos médicos de cada paciente (consultas, cirugías), accesible desde la ficha del paciente y entrelazado con el módulo de vacunas.

### Actores

- **Veterinario** — CRUD (solo él puede crear/editar registros clínicos)
- **Admin** — CRUD (hereda permisos de vet)
- **Recepcionista** — solo lectura

### Casos de Uso

| ID | Caso de Uso | Actor | Descripción |
|---|---|---|---|
| FRD-HM-01 | Registrar consulta | Vet, Admin | Agrega un evento de consulta con diagnóstico, tratamiento y notas |
| FRD-HM-02 | Registrar cirugía | Vet, Admin | Agrega un evento quirúrgico con procedimiento y notas |
| FRD-HM-03 | Ver línea de tiempo | Vet, Admin, Recepcionista | Visualiza eventos ordenados del más reciente al más antiguo |
| FRD-HM-04 | Editar registro | Vet, Admin | Modifica notas o tratamiento de un evento existente (con restricción de tiempo) |
| FRD-HM-05 | Ver ficha completa | Vet, Admin, Recepcionista | Datos de mascota + todas las vacunas + historial médico |

### Reglas de Negocio

- **RN-HM-01:** El historial es cronológico descendente (más reciente primero).
- **RN-HM-02:** El campo `tipo` es enum: `consulta`, `cirugia`. Las vacunas tienen su propio módulo pero se muestran en la misma línea de tiempo como eventos de solo lectura.
- **RN-HM-03:** Un registro de historial no se puede eliminar físicamente (pista de auditoría médica).
- **RN-HM-04:** Edición permitida solo dentro de las 24h posteriores a la creación, y únicamente en los campos `tratamiento` y `notas`. `diagnostico` y `tipo` son inmutables.
- **RN-HM-05:** `diagnostico` es requerido y debe tener al menos 10 caracteres.
- **RN-HM-06:** No se puede registrar un evento con fecha futura.
- **RN-HM-07:** La línea de tiempo debe mostrar también las vacunas como eventos entrelazados (solo lectura desde este módulo), visualmente diferenciadas por ícono y color.

### Validaciones

| Campo | Regla |
|---|---|
| `mascota_id` | Requerido, debe existir y estar activa |
| `tipo` | Requerido, enum: `consulta`, `cirugia` |
| `fecha` | Requerido, date, no futura |
| `diagnostico` | Requerido, mínimo 10 caracteres, máximo 500 |
| `tratamiento` | Opcional, máximo 1000 caracteres |
| `notas` | Opcional, máximo 2000 caracteres |

### Campos

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | UUID | auto | |
| `clinic_id` | UUID | auto | |
| `mascota_id` | UUID | sí | Paciente |
| `tipo` | enum | sí | consulta / cirugia |
| `fecha` | date | sí | Fecha del evento |
| `diagnostico` | text | sí | Diagnóstico (inmutable post 24h) |
| `tratamiento` | text | no | Tratamiento recetado (editable 24h) |
| `notas` | text | no | Notas internas del vet (editable 24h) |
| `created_by` | UUID | auto | Veterinario que registró |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

### Estados

Los eventos son inmutables (no tienen máquina de estados). Para el frontend, distinción visual por `tipo`:

- `consulta` → ícono azul
- `cirugia` → ícono rojo
- (vacunas desde módulo externo → ícono verde)

### Dependencias

- **Módulo Mascotas** — `mascota_id` FK.
- **Módulo Vacunas** — se muestra en la misma línea de tiempo (solo lectura).
- **Módulo Usuarios** — `created_by` vincula al vet.

### Criterios de Aceptación

| ID | Criterio |
|---|---|
| CA-HM-01 | Línea de tiempo muestra eventos ordenados del más reciente al más antiguo |
| CA-HM-02 | Eventos de consulta, cirugía y vacunas aparecen mezclados con diferenciación visual |
| CA-HM-03 | Edición de `tratamiento` y `notas` permitida solo dentro de 24h; después, campos de solo lectura |
| CA-HM-04 | `diagnostico` no se puede editar nunca después de guardado |
| CA-HM-05 | No existe opción de eliminar un evento de historial |
| CA-HM-06 | Recepcionista puede ver la línea de tiempo pero no crear ni editar eventos |

---

## Módulo: Vacunas

### Objetivo

Registrar la aplicación de vacunas, calcular próximas dosis y notificar automáticamente al dueño para asegurar el cumplimiento del esquema de vacunación.

### Actores

- **Veterinario** — CRUD de registros de vacunación
- **Admin** — CRUD de registros de vacunación
- **Sistema** — envío automático de recordatorios por email

### Casos de Uso

| ID | Caso de Uso | Actor | Descripción |
|---|---|---|---|
| FRD-VA-01 | Registrar vacuna | Vet, Admin | Aplica y registra vacuna con lote y fecha de próxima dosis |
| FRD-VA-02 | Ver historial de vacunas | Vet, Admin, Recepcionista | Lista de vacunas aplicadas + próximas dosis |
| FRD-VA-03 | Editar registro de vacuna | Vet, Admin | Corrige datos de una vacuna registrada (hasta 24h) |
| FRD-VA-04 | Recibir recordatorio automático | Sistema | Envía email al dueño 7 días antes de próxima dosis |

### Reglas de Negocio

- **RN-VA-01:** `tipo_vacuna` usa un catálogo semilla precargado. No editable por la clínica en MVP.
- **RN-VA-02:** `fecha_proxima_dosis` es opcional (vacunas de dosis única o refuerzo no programado).
- **RN-VA-03:** Si `fecha_proxima_dosis` tiene valor, el sistema envía un recordatorio 7 días antes. Si la fecha ya pasó y no se registró nueva vacuna cubriendo esa dosis, se reenvía cada 7 días (máximo 3 recordatorios totales).
- **RN-VA-04:** `lote` es opcional; si se ingresa, máximo 50 caracteres.
- **RN-VA-05:** Una vacuna registrada aparece automáticamente en la línea de tiempo del historial médico (solo lectura desde ese módulo).
- **RN-VA-06:** No se puede registrar una vacuna con fecha futura (debe ser aplicada para registrarse).
- **RN-VA-07:** El contador `recordatorio_enviado` se incrementa cada vez que el worker envía un recordatorio. Al llegar a 3, se detienen los envíos.

### Validaciones

| Campo | Regla |
|---|---|
| `mascota_id` | Requerido, mascota activa |
| `tipo_vacuna` | Requerido, selección de catálogo semilla |
| `lote` | Opcional, máximo 50 caracteres |
| `fecha_aplicacion` | Requerido, date, no futura |
| `fecha_proxima_dosis` | Opcional, date, debe ser posterior a `fecha_aplicacion` |
| `aplicado_por` | Requerido, usuario activo con rol vet o admin |

### Campos

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | UUID | auto | |
| `clinic_id` | UUID | auto | |
| `mascota_id` | UUID | sí | Paciente |
| `tipo_vacuna_id` | UUID | sí | Del catálogo de vacunas |
| `lote` | string | no | Número de lote |
| `fecha_aplicacion` | date | sí | Día en que se aplicó |
| `fecha_proxima_dosis` | date | no | Fecha del próximo refuerzo |
| `recordatorio_enviado` | int | default: 0 | Contador 0-3 |
| `aplicado_por` | UUID | sí | Vet que aplicó |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

### Catálogo de Vacunas (Semilla)

| ID | Nombre | Especie | Dosis típica |
|---|---|---|---|
| V01 | Múltiple canina (quíntuple séxtuple) | perro | 3 dosis + refuerzo anual |
| V02 | Antirrábica canina | perro | 1 dosis + refuerzo anual |
| V03 | Tos de las perreras (Bordetella) | perro | 1 dosis + refuerzo anual |
| V04 | Leptospirosis canina | perro | 2 dosis + refuerzo anual |
| V05 | Triple felina | gato | 2 dosis + refuerzo anual |
| V06 | Antirrábica felina | gato | 1 dosis + refuerzo anual |
| V07 | Leucemia felina (FeLV) | gato | 2 dosis + refuerzo anual |
| V08 | Otra | perro/gato | A criterio del vet |

### Estados

`Aplicada` — si `fecha_proxima_dosis` existe → `Pendiente refuerzo` hasta que se registre una nueva vacuna que cubra esa dosis. En MVP, no hay estado automático de "vencida"; el sistema muestra la próxima dosis pendiente si `fecha_proxima_dosis` está en el pasado.

### Dependencias

- **Módulo Mascotas** — `mascota_id` FK.
- **Módulo Historial Médico** — las vacunas son eventos visibles en la línea de tiempo.
- **Módulo Dueños** — `owner.email` se usa para enviar recordatorios.
- **Catálogo** — tabla `catalogo_vacunas` con seed data.
- **Sistema de Notificaciones** — worker programado (cron) que revisa `fecha_proxima_dosis` vs `now()`.

### Criterios de Aceptación

| ID | Criterio |
|---|---|
| CA-VA-01 | Vet selecciona tipo de vacuna del catálogo desplegable (no texto libre) |
| CA-VA-02 | Al guardar, la vacuna aparece en la ficha del paciente y en la línea de tiempo del historial |
| CA-VA-03 | Si `fecha_proxima_dosis` ingresada, el sistema agenda recordatorio automático |
| CA-VA-04 | El dueño recibe email 7 días antes de la próxima dosis |
| CA-VA-05 | Si la fecha de próxima dosis ya pasó y no hay nueva vacuna, re-recordatorio máximo 3 veces |
| CA-VA-06 | Vet puede ver cuántos recordatorios se han enviado en la ficha de la vacuna |

---

## Módulo: Dashboard

### Objetivo

Proveer al dueño de la clínica y al admin una vista rápida del estado del negocio: ingresos, ocupación, servicios principales, pacientes activos y citas del día, permitiendo toma de decisiones informada en menos de 10 segundos.

### Actores

- **Admin** — vista completa de todas las métricas
- **Veterinario** — vista parcial (solo sus citas del día + métricas generales)
- **Recepcionista** — sin acceso al dashboard

### Casos de Uso

| ID | Caso de Uso | Actor | Descripción |
|---|---|---|---|
| FRD-DB-01 | Ver ingresos del período | Admin | Gráfica de barras con ingresos diarios (semana actual vs anterior) e ingresos del mes |
| FRD-DB-02 | Ver ocupación de agenda | Admin | % de ocupación: (citas completadas + confirmadas + no-show) / slots totales disponibles |
| FRD-DB-03 | Ver top servicios | Admin | Top 5 motivos de consulta más frecuentes del mes |
| FRD-DB-04 | Ver pacientes activos | Admin | Total mascotas registradas vs atenciones del período |
| FRD-DB-05 | Ver próximas citas | Admin, Vet | Lista de citas confirmadas del día, ordenadas por hora |
| FRD-DB-06 | Ver mis citas de hoy | Vet | Lista filtrada solo para el vet autenticado |

### Reglas de Negocio

- **RN-DB-01:** `ingresos` = suma de `monto` de todas las citas con estado `completada` en el período seleccionado.
- **RN-DB-02:** `ocupacion` = (total de citas en estado `completada` + `confirmada` + `no-show`) / (días laborales × slots por día por vet). En MVP se asume: día laboral de 8h (09:00–13:00, 14:00–18:00), slots de 30 min = 16 slots por vet por día. Días laborales = 6 (lun–sáb).
- **RN-DB-03:** `top servicios` = agrupación de `motivo` de citas en estado `completada` del mes actual, top 5 por frecuencia descendente.
- **RN-DB-04:** Las métricas del dashboard se calculan con datos en caché (máximo 5 minutos de desfase) para no impactar performance de operaciones transaccionales.
- **RN-DB-05:** El dashboard NO requiere datos en tiempo real. Una diferencia de hasta 5 min es aceptable.

### Comportamiento sin datos

Cada widget debe mostrar estado vacío con mensaje y CTA cuando no haya datos en el período:

| Widget | Estado vacío | CTA |
|---|---|---|
| Ingresos | "No hay ingresos registrados este período." | "Registrar primera cita" |
| Ocupación | "No hay citas programadas." | "Agendar primera cita" |
| Top servicios | "No hay consultas completadas este mes." | "Completar primera consulta" |
| Pacientes activos | "No hay pacientes registrados." | "Registrar primera mascota" |
| Próximas citas | "No hay citas para hoy." | "Agendar cita" |

### Campos

El dashboard no tiene tabla propia. Lee de:

| Fuente | Tabla | Campos usados |
|---|---|---|
| Ingresos | `citas` | `monto` (SUM), `estado` (= completada), `fecha_hora` |
| Ocupación | `citas` | `estado` (COUNT), `fecha_hora`, `veterinario_id` |
| Top servicios | `citas` | `motivo` (GROUP BY), `estado` (= completada), `fecha_hora` |
| Pacientes activos | `mascotas` | `id` (COUNT), `activo` (= true) |
| Próximas citas | `citas` | `fecha_hora`, `mascota_id`, `motivo`, `estado` (= confirmada) |

### Dependencias

- **Módulo Citas** — todas las métricas de ingresos, ocupación, top servicios y próximas citas se derivan de `citas`.
- **Módulo Mascotas** — conteo de pacientes activos.
- **Módulo Usuarios** — filtro por `veterinario_id` para vista parcial del vet.

### Criterios de Aceptación

| ID | Criterio |
|---|---|
| CA-DB-01 | Dashboard carga en < 2 segundos con datos cacheados |
| CA-DB-02 | Gráfica de ingresos muestra barras diarias de la semana actual vs semana anterior |
| CA-DB-03 | Ocupación se muestra como porcentaje con barra de progreso |
| CA-DB-04 | Top 5 servicios ordenados por frecuencia descendente |
| CA-DB-05 | Admin ve métricas de toda la clínica; vet solo ve sus citas de hoy |
| CA-DB-06 | Cada widget muestra estado vacío con CTA si no hay datos |
| CA-DB-07 | Recepcionista NO tiene acceso al dashboard (redirect o 403) |

---

## Tabla de Dependencias

```
Clínicas (raíz)
  └── Usuarios (clinic_id)
  └── Dueños (clinic_id)
       └── Mascotas (clinic_id, owner_id)
            ├── Historial Médico (clinic_id, mascota_id)
            ├── Vacunas (clinic_id, mascota_id)
            └── Citas (clinic_id, mascota_id, veterinario_id)
                 └── Dashboard (citas.* + mascotas.*)
```

### Orden de implementación recomendado

| Fase | Módulos | Sprint |
|---|---|---|
| 1 | Clínicas + Usuarios | Sprint 0 |
| 2 | Dueños + Mascotas | Sprint 0 |
| 3 | Vacunas + Historial Médico | Sprint 1 |
| 4 | Citas | Sprint 2 |
| 5 | Dashboard | Sprint 3 |

---

## Funcionalidades Transversales

### Autenticación y Sesión

- Login vía magic link enviado al email del usuario.
- Sesión JWT con expiración a 7 días (refresh token en fase 2).
- Cierre de sesión invalida el token del lado del servidor.
- Cada request valida que el usuario pertenezca a la clínica (`clinic_id` del token coincide con `clinic_id` del recurso).

### Tenancy (Aislamiento de Datos)

- **En backend:** Cada query incluye filtro `WHERE clinic_id = $1`. Sin excepciones.
- **En base de datos:** Row-Level Security (RLS) activado en todas las tablas con política `clinic_id = current_setting('app.clinic_id')`.
- **En frontend:** El layout principal muestra el nombre de la clínica en el header. El usuario solo ve datos de su propia clínica.

### Búsqueda Global

- Campo de búsqueda en el header de la aplicación.
- Busca concurrentemente en:
  - Dueños (`nombre`, `telefono`)
  - Mascotas (`nombre`)
- Resultados agrupados por tipo con íconos diferenciados.
- Máximo 10 resultados por grupo.
- Seleccionar un resultado navega a la ficha correspondiente.
- La búsqueda solo incluye registros activos.

### Línea de Tiempo Unificada (Ficha del Paciente)

- Sección dentro de la ficha de la mascota.
- Muestra en orden cronológico descendente:
  - Eventos de `historial_medico` (tipo: consulta → azul, cirugía → rojo)
  - Eventos de `vacunas` (tipo: vacunación → verde)
- Cada tarjeta de evento muestra:
  - Fecha
  - Tipo (con ícono y color)
  - Resumen del contenido (diagnóstico o tipo de vacuna)
  - Click para expandir/ver detalle completo
- Scroll infinito o paginación de 20 eventos por carga.

### Historial de Auditoría

No implementado como tabla separada en MVP. Se confía en:

- `created_by` en cada registro para rastrear quién creó.
- `updated_at` para saber cuándo se modificó.
- Soft deletes (nunca se pierden datos).
- Ediciones de historial médico limitadas a 24h.

### Manejo de Errores

| Escenario | Comportamiento |
|---|---|
| Error de red | Toast: "Error de conexión. Reintentando..." + reintento automático |
| Validación fallida | Mensaje de error inline en el campo específico |
| Recurso no encontrado | Toast o pantalla: "El registro no existe o fue desactivado" |
| Permiso denegado | Redirect o modal: "No tienes permiso para realizar esta acción" |
| Error del servidor (500) | Toast: "Ocurrió un error. Intenta de nuevo." + reporte automático |

---

## Resumen de Capacidades del MVP

| Módulo | CRUD | Búsqueda | Estados | Roles | Notificaciones |
|---|---|---|---|---|---|
| Clínicas | C(registro), R, U, D(lógica) | No aplica | Activa / Inactiva | Admin | No |
| Usuarios | C(invitación), R, U, D(lógica) | No (lista simple) | Pendiente / Activo / Inactivo | Admin | Email de invitación |
| Dueños | C, R, U, D(lógica) | Sí (nombre, teléfono) | Activo / Inactivo | Admin, Vet(R), Recep | No |
| Mascotas | C, R, U, D(lógica) | Sí (nombre, dueño) | Activo / Inactivo | Admin, Vet, Recep(parcial) | No |
| Citas | C, R, U, cambios de estado | No (vista agenda) | Confirmada / Completada / Cancelada / No-show | Admin, Vet(completar), Recep | No |
| Historial Médico | C, R, U(restringido) | No | — (eventos) | Admin, Vet, Recep(R) | No |
| Vacunas | C, R, U(restringido) | No (vista en ficha) | Aplicada / Pendiente refuerzo | Admin, Vet | Email recordatorio |
| Dashboard | Solo R | No | — | Admin, Vet(parcial) | No |

(R) = Solo lectura

---

*Documento complementario al PRD v1.0. Para contexto completo, referirse a `docs/01-prd.md`. Cualquier cambio en el alcance del MVP debe reflejarse en ambos documentos.*
