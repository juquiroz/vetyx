# Vetyx — Reanudar Sesión

> Leer esto al inicio de cada sesión con opencode.

---

## Estado actual

**Sprint 2 (Agenda — Motor disponibilidad + Crear citas + Grid + Editar/Cancelar/Completar)**: COMPLETADO ✅
**Sprint 3 (Historial + Vacunas)**: H-10 (Timeline) ✅, H-11 (Registrar consulta/cirugía) ✅, H-12 (Vacunas) ✅
**H-13 (Recordatorios/cron)**: Movido fuera de Sprint

| Componente | Estado |
|---|---|
| Scaffold + shadcn/ui + Tailwind v4 | ✅ |
| 10 tablas DB + RLS + índices + seed (migrations 001–007) | ✅ Aplicadas |
| Dashboard layout + ClinicProvider + Dark mode | ✅ |
| Auth: registro + login + middleware + helpers | ✅ |
| Dev auth bypass (OTP verify + setSession, sin email) | ✅ |
| H-01 a H-05 (Dueños, Mascotas, Staff, Búsqueda) | ✅ |
| H-09: Motor disponibilidad (doble reserva) | ✅ 25 tests |
| H-07: Crear cita (Server Action + Modal) | ✅ 14 tests |
| H-06 Fase A: Motor agenda (mapear-dia, mapear-semana, obtener-citas-rango) | ✅ 18 tests |
| H-06 Fase B: UI Grid (agenda-grid, toolbar, column, slot, event-card) | ✅ Sin tests UI |
| H-08: Editar/Cancelar/Completar cita | ✅ 23 tests (6 Server Actions + modal) |
| H-10: Timeline historial (modelo, action, componentes, integración ficha) | ✅ 16 tests |
| H-11: Registrar consulta/cirugía + edición 24h | ✅ 19 tests |
| H-12: Vacunas (CRUD + catálogo + timeline + tests) | ✅ 25 tests |
| `ContextoProvider + Sidebar/Topbar contexto visual` | ✅ Tipo expandido, badges, tooltip, mobile |
| `pnpm build` / `pnpm tsc` / `pnpm test` | ✅ 0 errores, 140 tests, 18 test files |

---

## Últimos cambios importantes

1. **H-12 (Vacunas — CRUD completo + catálogo)**: Server Actions `registrar.ts` (INSERT con validación especie/fechas/"Otra", 6-step), `editar.ts` (UPDATE solo lote/fecha_proxima/observaciones, 6-step), `obtener-catalogo.ts` (filtrado por especie + "Otra"), `obtener-veterinarios.ts` (vet/admin activos). Componentes: `RegistrarVacunaModal` (Dialog con catálogo filtrado + veterinarios), `TabVacunas` (lista con badges estado: sin_refuerzo/vigente/próxima/vencida, edición inline). Integración en ficha mascota + ruta `/vacunas/[mascotaId]`. Timeline actualizado con `nombre_personalizado` y `observaciones`. Migración 008: columnas `nombre_personalizado` y `observaciones`. **25 tests nuevos** (registrar: 12, editar: 8, catálogo: 5).

2. **H-11 (Registrar consulta/cirugía + edición 24h)**: Server Actions `crear-evento.ts` y `editar-evento.ts`, componente `RegistrarEventoModal` (Dialog con 6 tipos), edición inline en `TimelineCard` (tratamiento/notas editables ≤24h). 6 tipos: consulta, cirugía, hospitalizacion, control, procedimiento, otro. Validación: fecha no futura (comparación ISO string, no Date), diagnóstico ≥10 chars. 19 tests.

3. **Filtros de búsqueda en Timeline**: Barra de filtros con búsqueda por palabra clave + rango de fechas (desde/hasta). Debounce 300ms. Botón limpiar. Empty state diferenciado. 4 tests nuevos.

4. **Fix contraste dark mode en TimelineCard**: Se eliminaron `bg-*` de las cards (usaban `bg-gray-50/50` invisible en dark mode), ahora solo borde izquierdo coloreado. `otro` usa `border-l-slate-400` (visible en dark mode). Resumen cambió de `text-muted-foreground` a `text-foreground/70`. Texto del temporizador: "Quedan Xh Ym de edición".

5. **Mock pattern (actualizado)**: Para evitar `vi.fn(() => crearCadena())` que crea objetos nuevos por método, los mocks encadenables deben retornar `this` (el mismo objeto) para que `mockResolvedValueOnce` funcione correctamente. **Nuevo**: Para evitar que `mockResolvedValue(thenable)` un-wrappee el thenable, usar `mockImplementation(() => Promise.resolve(noThenable))` o asegurar que el cliente Supabase mock NO tenga `.then`.

6. **Fase 1 Contexto Visible**: `ContextoProvider` (personal/clinic, persistencia localStorage). Sidebar: avatar iniciales, nombre clínica/Personal, rol, switch contexto. Topbar: avatar + nombre + rol + dropdown switch contexto.

7. **Auditoría de deuda técnica (Fase 2)**: Se escribió `docs/tech-debt.md` con clasificación P0/P1/P2. Acciones inmediatas ejecutadas:
   - Eliminado `src/actions/auth/plantilla.ts` (template en prod)
   - Eliminado `src/actions/auth/invitacion.ts` (duplicado)
   - Eliminado `src/components/modals/` (vacío)
   - Movido `obtener-especies.ts` → `src/actions/mascotas/obtener-especies.ts`
   - Actualizados imports en 3 archivos
   - Eliminado `VacunaConExtra` (redundante, campos ya en `Vacuna`)
   - Typecheck y 140 tests pasan sin errores

8. **UX Contexto Activo Visible**: `ContextoActivo` expandido a objeto `{ tipo, clinicId?, clinicNombre? }`. `ContextoProvider` recibe `clinicaId`. Sidebar: tooltip "Los registros se guardarán en este contexto". Topbar: badge "Contexto: Clínica" en desktop + bloque contexto en mobile (nombre + rol + badge). Tooltip nativo en toda área de contexto. Switch existente preservado (sin duplicar).

9. **Fix hydration mismatch (ContextoProvider)**: `obtenerInicial()` leía `localStorage` directamente en `useState(() => ...)`, causando server ("clinic") vs cliente ("personal"). Reemplazado por estado inicial sincronizado con server + `useEffect` post-hidratación para sync con localStorage. Fix aplicado — `/agenda` ya no crashea por hydration.

---

## Cómo iniciar

```bash
pnpm dev
# http://localhost:3001 (puerto 3000 ocupado)
```

---

## Flujo de prueba (agenda)

1. Abrir `http://localhost:3001` → redirige a `/login`
2. Click "Registrar clínica" o seleccionar usuario existente
3. Ir a Agenda → ver grid día/semana
4. Click slot vacío → CrearCitaModal con fecha/hora prellenada
5. Crear cita → aparece en grid con color según estado
6. Click en cita → DetalleCitaModal con acciones
7. Probar ciclo completo: scheduled → confirmar → iniciar → completar (con monto opcional)
8. Probar cancelación y no-show

## Flujo de prueba (historial)

1. Ir a Mascotas → seleccionar una mascota
2. Tab "Línea de tiempo" → ver timeline con infinite scroll
3. Botón "Nuevo evento" → RegistrarEventoModal con 6 tipos
4. Crear evento → aparece al inicio del timeline
5. Expandir card → editar inline si está dentro de 24h
6. Probar filtros: buscar por palabra, filtrar por rango de fechas
7. Después de 24h → badge cambia a "Solo lectura" con candado

---

## Documentación relevante

| Archivo | Contenido |
|---|---|
| `docs/02-frd.md` | Reglas de negocio (obligatorio leer antes de codificar) |
| `docs/04-database.md` | Schema DB + RLS |
| `docs/05-ui-ux.md` | Wireframes y UX |
| `docs/auth-flow.md` | Flujo de auth actualizado (v2.0) |
| `docs/project-context.md` | Contexto general del proyecto |
| `docs/tech-debt.md` | Deuda técnica clasificada P0/P1/P2 |

---

## Próximos pasos

1. **Sprint 4**: Pendiente de definir. Opciones:
   - Corregir deuda P0: migrar middleware → proxy, fix hydration ThemeToggle
   - Fase 3: Reporte final antes de construir nueva funcionalidad
   - Catálogo de vacunas editable (UI para crear/editar)
   - Paso a producción (dominio, SMTP, SSL)
   - H-13 (Recordatorios/cron) si se prioriza

---

## Problemas conocidos

- **SMTP Resend**: `onboarding@resend.dev` solo envía al dueño de cuenta Resend (`ing.juan.quiroz.trevia@gmail.com`). Para producción, verificar un dominio en Resend y configurarlo como sender en Supabase Auth SMTP.
- **Next.js 16 deprecation**: Middleware → Proxy. Advertencia en build, migrar cuando sea estable.
- **Hydration mismatch ThemeToggle**: Server renderiza un icono y cliente otro. Pendiente de fix (P0-02 en tech-debt.md).
- **ContextoProvider hydration**: ✅ Fix aplicado (useEffect post-hidratación en vez de localStorage directo en useState).
- **Puerto 3000 ocupado**: Next.js usa 3001 automáticamente.
- **Deuda técnica**: Ver `docs/tech-debt.md` para clasificación completa. Highlights: ~25 actions sin test, ~30 componentes sin test, middleware → proxy deprecado, hydration mismatch ThemeToggle, dev utils en producción.
