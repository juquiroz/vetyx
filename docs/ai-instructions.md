# Vetyx.io — AI Instructions

## Stack Oficial

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next Server Actions + Route Handlers |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (magic links) |
| Storage | Supabase Storage (post-MVP) |
| Estado | React Query + Zustand |
| Email | Resend |
| Hosting | Vercel |

## Restricciones

1. **MVP pequeño y enfocado** — Solo funcionalidades en `docs/02-frd.md`.
2. **Sin IA** — No incluir modelos de lenguaje ni clasificación automática.
3. **Sin integraciones externas** — Solo email (Resend). No WhatsApp, pasarelas de pago, laboratorios, etc.
4. **Sin app móvil nativa** — Solo web responsive.
5. **Sin facturación electrónica** — No CFDI ni facturas.
6. **Sin portal del cliente** — No app para dueños de mascotas.
7. **Sin multi-sucursal** — Una clínica = un tenant.
8. **Slots de 30 min fijos** — No configurables en MVP.
9. **Catálogo de vacunas semilla** — No editable por la clínica.
10. **Sin eliminación física** — Solo soft deletes en todos los módulos.

## Convenciones

- **Código en español** — Nombres de módulos, funciones y variables en español (ej. `crearCita`, `obtenerHistorial`).
- **TypeScript estricto** — `strict: true` en tsconfig. Tipados explícitos, evitar `any`.
- **Server Actions para mutaciones** — Toda escritura a DB via Next Server Actions.
- **Route Handlers para lecturas** — Queries GET via Route Handlers o Server Components.
- **RLS en todas las tablas** — Toda consulta filtrada por `clinic_id`.
- **Componentes en `src/components/`** — Organizados por módulo (`citas/`, `mascotas/`, etc.).
- **shadcn/ui** — Usar componentes base de shadcn. No crear UI desde cero.
- **Tailwind utility-first** — Sin CSS modules ni styled-components.
- **Commits en español** — Mensajes descriptivos en español.

## Reglas del Proyecto

1. **Documentación fuente:** `docs/01-prd.md` (qué construir) y `docs/02-frd.md` (cómo debe funcionar). Cualquier duda remitirse a estos documentos.
2. **No modificar alcance:** No agregar funcionalidades no listadas en el FRD. Si surge algo, documentarlo como "propuesta post-MVP".
3. **Validaciones del lado del servidor:** Toda validación del FRD debe replicarse en Server Actions. El cliente es solo UX.
4. **Permisos por rol:** Respetar la matriz de permisos del FRD en cada Server Action y Route Handler.
5. **Estados de cita:** Solo las transiciones definidas en el FRD están permitidas.
6. **Historial médico inmutable:** Un evento no se elimina. Edición solo primeros 15 min (no 24h como dice FRD por simplicidad técnica, validar con PM).

## Alcance MVP

| Módulo | Incluido |
|---|---|
| Clínicas (tenants) | ✅ |
| Usuarios (staff + roles) | ✅ |
| Dueños | ✅ |
| Mascotas | ✅ |
| Citas (agenda) | ✅ |
| Historial Médico | ✅ |
| Vacunas + recordatorios | ✅ |
| Dashboard | ✅ |
| Facturación | ❌ |
| Farmacia / inventario | ❌ |
| Internamiento | ❌ |
| App móvil | ❌ |
| Portal cliente | ❌ |
| WhatsApp | ❌ |
| Multi-sucursal | ❌ |
