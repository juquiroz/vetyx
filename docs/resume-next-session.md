# Vetyx — Reanudar Sesión

> Leer esto al iniciar cada sesión con opencode.

---

## Estado actual

**Sprint 2 (Agenda — Motor disponibilidad + Crear cita + Vista básica)**: H-09, H-07 completados. H-06 parcial (vista lista día, sin grid calendario).
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
| H-07 Fase A: Server Action crear cita | ✅ |
| H-07 Fase B: Modal crear cita | ✅ |
| H-06: Vista agenda (lista día con navegación) | 🟡 Parcial |
| `pnpm build` / `pnpm tsc` / `pnpm lint` / `pnpm test` | ✅ 0 errores, 39 tests |

---

## Últimos cambios importantes

1. **H-07 (Crear cita — Fase A)**: Server Action `crear.ts` con 6 pasos, reusa `verificarDisponibilidadInterna`, 8 tests.
2. **H-07 (Crear cita — Fase B)**: `CrearCitaModal` con debounce 300ms/500ms, dueño + mascota + vet + fecha/hora + disponibilidad en tiempo real + sugerencias inline + toast + persistencia tras error. 6 tests del modal.
3. **Timezone fix en modal**: reemplazado `.000Z` por `new Date(...).toISOString()` en 3 lugares. Tests usan `fireEvent.change` para inputs date/time (jsdom no soporta `user.type` en `type="date"`/`type="time"`), y hora esperada calculada dinámicamente según timezone local.
4. **Campo Dueño en modal**: paso obligatorio antes de mascota. `buscarMascotas` acepta `dueno_id?: string`.
5. **`obtener-veterinarios.ts`**: cambiado `.in("rol", ["admin", "vet"])` → `.eq("rol", "vet")` — solo vets en dropdown.
6. **`registro.ts`**: cambiado `nombre: email.split("@")[0]` → `nombre: "Administrador"` — nombre genérico para el admin.
7. **Bug `ck_citas_estado`**: el DEFAULT de `estado` era `'confirmada'` (español antiguo en migración 001), pero migración 005 cambió el CHECK a estados en inglés. Al insertar sin `estado`, PostgreSQL usaba `'confirmada'` → violaba el CHECK. **Fix**: `estado: "scheduled"` en `crear.ts` línea 68 + `ALTER COLUMN estado SET DEFAULT 'scheduled'` en migración 005 línea 17.
8. **`listar.ts`**: nueva Server Action que trae citas del día con relaciones (mascota, dueno, veterinario, especie).
9. **Agenda page**: reemplazado placeholder con vista funcional — navegación día anterior/hoy/siguiente, carga real de citas, skeleton, EmptyState, cards con hora+mascota+veterinario+dueño+motivo+badge de estado.

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
5. Ir a Agenda → "Nueva cita" → llenar formulario → crear → cita aparece en lista
6. Cerrar sesión (sidebar → avatar → Cerrar sesión)
7. En `/login`, aparece el usuario registrado en la lista
8. Click en el usuario → sesión directa al dashboard

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

1. **H-06**: Vista calendario día/semana (grid 09:00-18:00, columnas por veterinario, slots de 30 min, navegación entre días, abrir `CrearCitaModal` desde slot vacío con fecha/hora/vet precargados).
2. **H-08**: UI editar/cancelar/completar cita (modal al click en slot ocupado, transiciones de estado, registro de monto).
3. **Sprint 3**: Historial médico + Vacunas + Recordatorios.

---

## Problemas conocidos

- **SMTP Resend**: `onboarding@resend.dev` solo envía al dueño de cuenta Resend (`ing.juan.quiroz.trevia@gmail.com`). Para producción, verificar un dominio en Resend y configurarlo como sender en Supabase Auth SMTP.
- **Next.js 16 deprecation**: Middleware → Proxy. Advertencia en build, migrar cuando sea estable.
- **Puerto 3000 ocupado**: Next.js usa 3001 automáticamente.
- **Migración 005 actualizada con ALTER DEFAULT**: si ya se aplicó la migración en Supabase, ejecutar manualmente `ALTER TABLE public.citas ALTER COLUMN estado SET DEFAULT 'scheduled';` o crear migración 007.
