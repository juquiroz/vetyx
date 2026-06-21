# Deuda Técnica — Vetyx

> Generado: 2026-06-20
> Auditoría post-Sprint 3 (H-10, H-11, H-12) + Fase 1 Contexto Visible.

| Prioridad | Definición |
|---|---|
| **P0** | Bug o bloqueo que impide usar la funcionalidad |
| **P1** | Deuda significativa que afecta mantenibilidad o escalabilidad |
| **P2** | Deuda menor, cosmética o refactor optativo |

---

## P0 — Bugs / Bloqueos

| ID | Descripción | Archivo | Detalle |
|---|---|---|---|
| P0-01 | Middleware deprecado en Next.js 16.2 | `src/middleware.ts:1` | Next.js 16.2 migró de `middleware.ts` a `proxy`. Renombrar a `src/proxy.ts` y actualizar configuración. Build muestra warning. |
| P0-02 | Hydration mismatch en ThemeToggle | `src/components/layout/theme-toggle.tsx:11` | El server renderiza un icono y el cliente otro porque el tema inicial no coincide. Agregar `suppressHydrationWarning` al `<html>` o usar `useEffect` para sincronizar. |

---

## P1 — Deuda Significativa

| ID | Descripción | Archivo | Detalle |
|---|---|---|---|
| P1-01 | Template commiteado en producción | `src/actions/auth/plantilla.ts` | Archivo plantilla con comentarios paso a paso. No debe estar en producción. **Eliminar.** |
| P1-02 | Duplicado de `invitarUsuario` | `src/actions/auth/invitacion.ts` vs `src/actions/usuarios/invitar.ts` | Misma función con diferencias menores. Mantener `usuarios/invitar.ts`, eliminar `auth/invitacion.ts`. |
| P1-03 | Directorio vacío `modals/` | `src/components/modals/` | Sin archivos. Remanente de planificación inicial. **Eliminar.** |
| P1-04 | Server Action fuera de `src/actions/` | `src/app/(dashboard)/mascotas/obtener-especies.ts` | Rompe la convención del proyecto. Mover a `src/actions/mascotas/obtener-especies.ts`. |
| P1-05 | Cobertura de tests: 62.5% actions sin test | Múltiples archivos | Dueños (6), Mascotas (7), Usuarios (4), Auth (6), Shared (1), Historial obtener (1), Vacunas obtener (1) = ~25 actions sin test. |
| P1-06 | Cobertura de tests: ~97% componentes sin test | Múltiples archivos | Solo 1 de 30+ componentes tiene test (`crear-cita-modal.test.tsx`). |
| P1-07 | Dev utilities en producción | `src/actions/auth/generar-link-dev.ts`, `listar-usuarios-dev.ts` | Funcionalidades de desarrollo accesibles en build de producción. Mover a `src/actions/dev/` o excluir del build. |
| P1-08 | `VacunaConExtra` redundante | `src/types/models.ts:46-49` | Tipo duplicado — los campos `nombre_personalizado` y `observaciones` ya existen en `Vacuna` (Row). Eliminar. |
| P1-09 | ~~`EstadoVacuna` no utilizado~~ **INCORRECTO** | `src/types/models.ts:51` | `EstadoVacuna` sí se usa en `tab-vacunas.tsx`. Mantener. |

---

## P2 — Deuda Menor / Refactor

| ID | Descripción | Archivo | Detalle |
|---|---|---|---|
| P2-01 | `useClinic` nunca consumido | `src/hooks/use-clinic.ts` + `src/providers/clinic-provider.tsx` | El hook se exporta pero ningún componente lo importa. `ClinicProvider` solo se usa como wrapper en layout. Evaluar si合并 con `ContextoProvider`. |
| P2-02 | Re-export innecesario | `src/hooks/use-clinic.ts` | Solo re-exporta `useClinic` desde `clinic-provider.tsx`. Podría eliminarse e importar directo. |
| P2-03 | `obtenerVeterinarios` duplicado parcial | `src/actions/citas/obtener-veterinarios.ts` vs `src/actions/vacunas/obtener-veterinarios.ts` | Funciones similares con diferentes filtros de rol. Refactorizar a `src/actions/shared/obtener-veterinarios.ts`. |
| P2-04 | `eslint-disable` en crear-cita-modal | `src/app/(dashboard)/agenda/components/crear-cita-modal.tsx:90,95,142` | 3 supresiones de reglas de hooks indican dependencias sub-óptimas. Revisar efectos. |
| P2-05 | Patrón repetido en Server Actions | ~40 archivos en `src/actions/` | El mismo boilerplate (sesión → usuario → permiso → Zod → operación) se repite. Considerar un wrapper/helper en refactor futuro. |
| P2-06 | `obtener.ts` vs `listar.ts` en varios módulos | Múltiples archivos | Convención inconsistente: algunos módulos usan `obtener` (singular), otros `listar` (plural). Estandarizar. |
| P2-07 | Timeline mergea en JS | `src/actions/historial/obtener-timeline.ts` | Mergea historial + vacunas en cliente (no UNION ALL SQL). No escala para mascotas con miles de eventos. |
| P2-08 | `cita_id` y `adjuntos` placeholders | `src/types/timeline.ts` | Campos no implementados en DB. Post-MVP. |
| P2-09 | Catálogo vacunas hardcodeado | `supabase/seed.sql` | Sin UI para crear/editar catálogo. Depende de seed.sql. |

---

## Acciones Inmediatas (Post-auditoría)

1. Eliminar `src/actions/auth/plantilla.ts`
2. Eliminar `src/actions/auth/invitacion.ts` (duplicado)
3. Eliminar `src/components/modals/` (vacío)
4. Mover `src/app/(dashboard)/mascotas/obtener-especies.ts` a `src/actions/mascotas/obtener-especies.ts`
5. Eliminar `VacunaConExtra` y `EstadoVacuna` de `src/types/models.ts` si no se usan
