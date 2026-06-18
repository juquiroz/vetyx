# Vetyx — Reanudar Sesión

> Leer esto al iniciar cada sesión con opencode.

---

## Estado actual

**Sprint 2 (Agenda — Motor disponibilidad)**: H-09 completado.
**Sprint 3 (Historial + Vacunas + Recordatorios)**: no iniciado.

| Componente | Estado |
|---|---|
| Scaffold + shadcn/ui + Tailwind v4 | ✅ |
| 10 tablas DB + RLS + índices + seed (migrations 001–006) | ✅ Aplicadas |
| Dashboard layout + ClinicProvider + Dark mode | ✅ |
| Auth: registro + login + middleware + helpers | ✅ |
| Dev auth bypass (OTP verify + setSession, sin email) | ✅ |
| H-01: Registro de clínica | ✅ |
| H-02: Invitar staff (CRUD miembros + roles) | ✅ |
| H-03: CRUD dueños + cédula | ✅ |
| H-04: CRUD mascotas + alta rápida | ✅ |
| H-05: Búsqueda global Cmd+K | ✅ |
| H-09: Motor disponibilidad (doble reserva) | ✅ |
| `pnpm build` / `pnpm tsc` / `pnpm lint` / `pnpm test` | ✅ 0 errores, 25 tests |

---

## Últimos cambios importantes

1. **H-03 (Dueños)**: Migración 004 agregó `cedula VARCHAR` a `duenos`. Todo el flujo (crear, editar, buscar, listar, perfil, alta rápida) incluye cédula.
2. **H-03 (Portal dueños)**: Migración 003 agregó `user_id` a `duenos`. Rol `dueño` en constantes y permisos (solo lectura). Server Action `vincular-usuario.ts`.
3. **H-04 (Editar/Desactivar mascota)**: Botón Editar (dialogo con formulario) + Desactivar (ConfirmDialog) en ficha de mascota (`acciones.tsx`).
4. **Bug fix DataTable**: Botón Editar en listado de dueños navegaba al perfil — corregido con `e.stopPropagation()`.
5. **H-09 Fase 2 (Tipos y validaciones)**: `database.ts` actualizado con `zona_horaria`, `duracion_minutos` requerido/por defecto. `constants.ts` con `ZONA_HORARIA_DEFAULT`, `CANTIDAD_SUGERENCIAS`. Zod schemas con estados centralizados, `validarHorarioLaboral` usa `Intl.DateTimeFormat` con `timeZone`.
6. **H-09 Fase 3 (Server Actions)**: `verificar-disponibilidad.ts` retorna `{ disponible, conflictos, sugerencias }` con 3 sugerencias de slots libres. `obtener-slots-disponibles.ts` retorna `{ slots }` cada 30 min respetando jornada.
7. **H-09 Fase 4 (Pruebas)**: 25 tests, 6 escenarios: doble click, simultáneos, tenant distinto, edición (excluir), duración distinta, reagendar.
8. **H-09 Fase 5 (Migraciones)**: 005 aplicada — `btree_gist`, 6 estados (`scheduled`→`confirmed`→`in_progress`→`completed`, `cancelled`/`no_show`), trigger `actualizar_rango_horario`, `observaciones`, exclusion constraint `excl_citas_solapamiento` (confirma/in_progress). 006 aplicada — `zona_horaria` en clinicas.

---

## Cómo iniciar

```bash
pnpm dev
# http://localhost:3001 (puerto 3000 ocupado)
```

---

## Flujo de prueba

1. Abrir `http://localhost:3001` → redirige a `/login`
2. Click "Registrar clínica"
3. Ingresar email + nombre de clínica → submit
4. Auto-redirige al dashboard (`/inicio`)
5. Cerrar sesión (sidebar → avatar → Cerrar sesión)
6. En `/login`, aparece el usuario registrado en la lista
7. Click en el usuario → sesión directa al dashboard

---

## Documentación relevante

| Archivo | Contenido |
|---|---|
| `docs/02-frd.md` | Reglas de negocio (obligatorio leer antes de codificar) |
| `docs/04-database.md` | Schema DB + RLS (actualizar: D-DB-04, citas 6 estados, clinicas zona_horaria) |
| `docs/05-ui-ux.md` | Wireframes y UX |
| `docs/auth-flow.md` | Flujo de auth actualizado (v2.0) |
| `docs/project-context.md` | Contexto general del proyecto |
| `AGENTS.md` | Convenciones para agentes de IA |

---

## Próximos pasos

1. **H-07**: UI crear cita modal + `src/actions/citas/crear.ts` (Server Action transaccional con 6 pasos: auth → tenant → validación → disponibilidad → persistencia → auditoría)
2. **H-06**: Vista calendario día/semana (grid 09:00-18:00, columnas por veterinario, slots de 30 min, navegación entre días)
3. **H-08**: UI editar/cancelar/completar cita (modal al click en slot ocupado, transiciones de estado, registro de monto)

---

## Problemas conocidos

- **SMTP Resend**: `onboarding@resend.dev` solo envía al dueño de cuenta Resend (`ing.juan.quiroz.trevia@gmail.com`). Para producción, verificar un dominio en Resend y configurarlo como sender en Supabase Auth SMTP.
- **Next.js 16 deprecation**: Middleware → Proxy. Advertencia en build, migrar cuando sea estable.
- **Puerto 3000 ocupado**: Next.js usa 3001 automáticamente.
- **D-DB-04 desactualizado en `docs/project-context.md` y `docs/04-database.md`**: Ya existe exclusión constraint con `btree_gist` — revisar docs para sincronizar.
