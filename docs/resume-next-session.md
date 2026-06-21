# Vetyx — Reanudar Sesión

> Leer esto al inicio de cada sesión con opencode.

---

## Estado actual

**Sprint 2 (Agenda — Motor disponibilidad + Crear citas + Grid + Editar/Cancelar/Completar)**: COMPLETADO ✅
**Sprint 3 (Historial + Vacunas)**: H-10 (Timeline) ✅, H-11 (Registrar consulta/cirugía) ✅, H-12 (Vacunas) pendiente
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
| `pnpm build` / `pnpm tsc` / `pnpm test` | ✅ 0 errores, 115 tests |

---

## Últimos cambios importantes

1. **H-11 (Registrar consulta/cirugía + edición 24h)**: Server Actions `crear-evento.ts` y `editar-evento.ts`, componente `RegistrarEventoModal` (Dialog con 6 tipos), edición inline en `TimelineCard` (tratamiento/notas editables ≤24h). 6 tipos: consulta, cirugía, hospitalizacion, control, procedimiento, otro. Validación: fecha no futura (comparación ISO string, no Date), diagnóstico ≥10 chars. 19 tests.

2. **Filtros de búsqueda en Timeline**: Barra de filtros con búsqueda por palabra clave + rango de fechas (desde/hasta). Debounce 300ms. Botón limpiar. Empty state diferenciado. 4 tests nuevos.

3. **Fix contraste dark mode en TimelineCard**: Se eliminaron `bg-*` de las cards (usaban `bg-gray-50/50` invisible en dark mode), ahora solo borde izquierdo coloreado. `otro` usa `border-l-slate-400` (visible en dark mode). Resumen cambió de `text-muted-foreground` a `text-foreground/70`. Texto del temporizador: "Quedan Xh Ym de edición".

4. **Mock pattern (actualizado)**: Para evitar `vi.fn(() => crearCadena())` que crea objetos nuevos por método, los mocks encadenables deben retornar `this` (el mismo objeto) para que `mockResolvedValueOnce` funcione correctamente.

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
| `AGENTS.md` | Convenciones para agentes de IA |

---

## Próximos pasos

1. **H-12 (Vacunas)**: CRUD vacunas + catálogo semilla. Server Actions `registrar-vacuna.ts`, `editar-vacuna.ts`, `obtener-catalogo.ts`. Modal `RegistrarVacunaModal` con catálogo filtrado por especie. Reemplazar lista inline en ficha mascota. Timeline ya soporta vacunas desde H-10.

---

## Problemas conocidos

- **SMTP Resend**: `onboarding@resend.dev` solo envía al dueño de cuenta Resend (`ing.juan.quiroz.trevia@gmail.com`). Para producción, verificar un dominio en Resend y configurarlo como sender en Supabase Auth SMTP.
- **Next.js 16 deprecation**: Middleware → Proxy. Advertencia en build, migrar cuando sea estable.
- **Puerto 3000 ocupado**: Next.js usa 3001 automáticamente.
- **Deuda técnica**: Sin tests UI para componentes grid/modal/timeline. `cita_id` y `adjuntos` en modelo EventoTimeline son placeholders no implementados en DB. Ver `project-context.md` para lista completa.
