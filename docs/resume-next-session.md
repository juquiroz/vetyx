# Vetyx — Reanudar Sesión

> Leer esto al inicio de cada sesión con opencode.

---

## Estado actual

**Sprint 2 (Agenda — Motor disponibilidad + Crear citas + Grid + Editar/Cancelar/Completar)**: COMPLETADO ✅
**Sprint 3 (Historial + Vacunas + Recordatorios)**: H-10 (Timeline) completado ✅

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
| H-10: Timeline historial (modelo, action, componentes, integración ficha) | ✅ 12 tests |
| `pnpm build` / `pnpm tsc` / `pnpm test` | ✅ 0 errores, 92 tests |

---

## Últimos cambios importantes

1. **H-10 (Timeline historial)**: Nuevo modelo `EventoTimeline` unificado (`types/timeline.ts`), Server Action `obtenerTimeline` que mergea `historial_medico` + `vacunas` con paginación inline, componente `Timeline` con infinite scroll (IntersectionObserver), `TimelineCard` expandible con colores por tipo (azul/rojo/verde) y badge editable/solo-lectura (ventana 24h). Integrado en ficha mascota reemplazando lista inline. 12 tests.
2. **H-06 Fase A (Motor agenda)**: ... (sin cambios)
3. **H-06 Fase B (UI Grid)**: ... (sin cambios)
4. **H-08 (Editar/Cancelar/Completar)**: ... (sin cambios)
5. **Mock pattern para Server Actions (actualizado)**: Para queries sin `.order()`, el mock de Supabase debe ser `PromiseLike` (tener `.then`) para que `await` funcione en cualquier punto de la cadena. Se usa `extends PromiseLike<T>` en la interfaz `FilaMock`.

---

## Cómo iniciar

```bash
pnpm dev
# http://localhost:3001 (puerto 3000 ocupado)
```

---

## Flujo de prueba

1. Abrir `http://localhost:3001` → redirige a `/login`
2. Click "Registrar clínica" o seleccionar usuario existente
3. Ir a Agenda → ver grid día/semana
4. Click slot vacío → CrearCitaModal con fecha/hora prellenada
5. Crear cita → aparece en grid con color según estado
6. Click en cita → DetalleCitaModal con acciones
7. Probar ciclo completo: scheduled → confirmar → iniciar → completar (con monto opcional)
8. Probar cancelación y no-show

---

## Documentación relevante

| Archivo | Contenido |
|---|---|
| `docs/02-frd.md` | Reglas de negocio (obligatorio leer antes de codificar) |
| `docs/04-database.md` | Schema DB + RLS |
| `docs/05-ui-ux.md` | Wireframes y UX |
| `docs/auth-flow.md` | Flujo de auth actualizado (v2.0) |
| `docs/project-context.md` | Contexto general del proyecto |
| `AGENTS.md` | Convenciones para agentes de IA |

---

## Próximos pasos

1. **Sprint 3** (próximo: H-11): Registrar consulta y cirugía.
   - Server Action `crear-evento.ts` — INSERT con validación (fecha no futura, diagnóstico ≥10 chars)
   - Server Action `editar-evento.ts` — solo `tratamiento`/`notas`, ventana 24h
   - Modal/Sheet `RegistrarEventoModal` — 4 campos (fecha, diagnóstico, tratamiento opc, notas opc)
   - Edición inline en TimelineCard si `editable = true`

---

## Problemas conocidos

- **SMTP Resend**: `onboarding@resend.dev` solo envía al dueño de cuenta Resend (`ing.juan.quiroz.trevia@gmail.com`). Para producción, verificar un dominio en Resend y configurarlo como sender en Supabase Auth SMTP.
- **Next.js 16 deprecation**: Middleware → Proxy. Advertencia en build, migrar cuando sea estable.
- **Puerto 3000 ocupado**: Next.js usa 3001 automáticamente.
- **Deuda técnica**: Sin tests UI para componentes grid/modal. Ver `project-context.md` para lista completa.
