# Plan: Documentos, Paneles y Gestión de Usuarios

Diagnostiqué los tres problemas que reportaste. Cada uno tiene una causa concreta y verificada.

## 1. No se pueden subir documentos (OneDrive)

**Causa real:** la función `onedrive-documents` apunta a una URL incorrecta del conector. Incluye un `/v1.0` extra que hace que TODA petición a OneDrive falle (listar, subir, descargar y eliminar). Lo confirmé llamando al conector:
- Con `/v1.0` → error `Resource not found for the segment 'v1.0'`
- Sin `/v1.0` → funciona y devuelve los archivos correctamente

**Arreglo:** cambiar la constante `GATEWAY_URL` en `supabase/functions/onedrive-documents/index.ts`:
```
de:  https://connector-gateway.lovable.dev/microsoft_onedrive/v1.0
a:   https://connector-gateway.lovable.dev/microsoft_onedrive
```
(Outlook ya está correcto, no se toca.)

## 2. Reorganizar el panel izquierdo por empresa

Hoy el menú muestra siempre **"Panel 2025"** y **"Panel 2026"** para todas las empresas. Como toda la data curada (presupuesto, KPIs, balances fijos) es exclusiva de **Horizonte Positivo**, las demás empresas ven dos paneles donde uno sobra.

**Arreglo (solo frontend, en `AppSidebar.tsx`):**
- **Horizonte Positivo:** mantiene **Panel 2025** + **Panel 2026** (sin cambios).
- **Las demás empresas:** ven únicamente **Panel 2026** (que ya muestra su dashboard de QuickBooks / Excel por empresa). Se oculta "Panel 2025".

Esto se logra haciendo que el ítem "Panel 2025" (ruta `/`) sea condicional a `isHorizonte(...)`, igual que ya se hace con Presupuesto 2026.

## 3. La gestión de usuarios no funciona correctamente

Encontré dos problemas:

**a) Cambiar el rol no surte efecto (causa principal).**
La tabla `user_roles` tiene políticas de SELECT, INSERT y DELETE para admins, pero **no tiene política de UPDATE**. El botón "Cambiar Rol" hace un `UPDATE` que es bloqueado silenciosamente por RLS (no da error visible, pero no guarda nada).

**Arreglo:** migración que agrega la política de UPDATE para admins en `user_roles`:
```sql
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
```

**b) Roles duplicados muestran el rol equivocado.**
Algunos usuarios (ej. monica@calderon.cr) tienen dos filas en `user_roles` (`admin` y `user`) porque el trigger `handle_new_user` siempre inserta `user` y luego se agregó otro rol. La lista de usuarios toma "el primero que encuentra", lo que puede mostrar el rol incorrecto, y el `UPDATE` por `user_id` afecta filas inconsistentes.

**Arreglo:** cambiar el guardado de rol para que sea de un solo rol por usuario (borrar el rol previo e insertar el nuevo, dentro de la misma operación de admin), y en la consulta mostrar el rol de mayor privilegio. Limpiar las filas duplicadas existentes en la migración.

## Detalles técnicos / archivos afectados

- `supabase/functions/onedrive-documents/index.ts` — corregir `GATEWAY_URL` (re-deploy automático).
- `src/components/AppSidebar.tsx` — "Panel 2025" condicional a Horizonte.
- Migración Supabase:
  - `CREATE POLICY` UPDATE en `user_roles` para admins.
  - Limpieza de filas de rol duplicadas (dejar el rol de mayor privilegio por usuario).
- `src/pages/UserManagement.tsx` — `updateRoleMutation` y la creación: usar reemplazo de rol (delete+insert) en lugar de update directo, y resolver el rol mostrado por prioridad.

## Verificación
- Subir un archivo de prueba en Centro Documental y confirmar que aparece.
- Como admin, cambiar el rol de un usuario y recargar para confirmar que persiste.
- Con una empresa distinta a Horizonte seleccionada, confirmar que el menú muestra solo "Panel 2026".
