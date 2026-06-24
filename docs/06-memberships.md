# Membresías de Clínica (`clinic_memberships`)

## Propósito
Separar identidad de membresía. Una persona (1 fila en `usuarios`) puede estar
vinculada a N clínicas como staff o cliente, sin perder acceso a sus datos
personales.

## Modelo

```
usuarios (identidad, 1 por persona física)
  └── clinic_memberships (vínculos, N por persona)
        ├── tipo: 'staff' | 'cliente'
        ├── rol: 'admin'|'vet'|'recepcionista' (solo staff)
        └── activo: boolean
```

## RLS
5 políticas en `clinic_memberships`:

| Política | Operación | ¿Quién? |
|---|---|---|
| `memberships_select_own` | SELECT | `user_id = auth.uid()` |
| `memberships_select_staff` | SELECT | `clinic_id = get_user_clinic_id()` |
| `memberships_insert_admin` | INSERT | `get_user_clinic_id()` + admin check |
| `memberships_update_admin` | UPDATE | `get_user_clinic_id()` + admin check |
| `memberships_delete_admin` | DELETE | `get_user_clinic_id()` + admin check |

Las políticas usan `get_user_clinic_id()` (SECURITY DEFINER) para evitar
recursión infinita en RLS.

## Flujos clave

### Invitar staff existente (email ya registrado)
1. Buscar email en `usuarios` (global, sin filtro clinic_id)
2. Si existe:
   - Verificar que no tenga membresía staff en la misma clínica
   - Insertar `clinic_memberships` tipo='staff'
   - Actualizar `usuarios.clinic_id` (atrás-compat, solo si era null)
3. Si no existe:
   - Crear auth user + usuarios + membership (flujo legacy)

### Agregar cliente
1. Solo admin (permiso `clientes.agregar`)
2. Validar email con Zod
3. Buscar email en `usuarios` globalmente
4. Si no existe → error "El usuario no está registrado en Vetyx. Pídele que
   cree una cuenta primero y vuelve a intentar."
5. Si existe:
   - Verificar membresía duplicada en la clínica
   - Insertar `clinic_memberships` tipo='cliente'

### Cambiar rol
1. Valida membresía staff contra `clinic_memberships`
2. Actualiza `clinic_memberships.rol`
3. Sincroniza `usuarios.rol` (atrás-compat)

### Desactivar miembro
1. Valida membresía staff en la clínica
2. Desactiva `clinic_memberships.activo = false`
3. Solo desactiva `usuarios.activo` si no le quedan membresías staff activas
4. Verifica mínimo 1 admin activo

## Atrás-compat
- `usuarios.clinic_id` y `usuarios.rol` se mantienen sincronizados
- `get_user_clinic_id()` sigue leyendo de `usuarios.clinic_id`
- Las 39 queries con `.filter("clinic_id", ...)` funcionan sin cambios
- Fase 5 pendiente: migrar queries a helper contextual y deprecar columna

## UI
- Sidebar: enlace "Clientes" en Configuración (visible solo para staff)
- Sidebar footer: toggle Personal/Clínica. Si hay >1 clínica staff, dropdown
  selector en lugar de botón simple
- Página `/configuracion/clientes`: tabla con nombre, email, teléfono, fecha
  de vinculación + modal "Agregar cliente" (solo email)
