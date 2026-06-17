## Objetivo

Resolver dos problemas reportados:
1. El selector de "Dominio de correo" muestra varios dominios; debe mostrar **solo `aclcostarica.com`**.
2. No se puede conectar QuickBooks porque la mayoría de empresas no tienen credenciales propias ("QuickBooks credentials not configured for this company").

## Diagnóstico

**Dominios:** La tabla `domains` tiene 3 dominios activos (`aureon.cr`, `calderon.cr`, `horizontepositivo.org`) y `aclcostarica.com` no existe. El selector lista todos los activos.

**QuickBooks:** Los logs muestran el error `QuickBooks credentials not configured for this company`. Solo Horizonte, Demo Lab y Agrícola tienen `client_id`/`client_secret`. Enfoque y otras están vacías, por lo que `quickbooks-auth` falla antes de generar el enlace. Ya existen secretos globales `QUICKBOOKS_CLIENT_ID` y `QUICKBOOKS_CLIENT_SECRET` (la app de ACL).

## Cambios

### 1. Dominio de correo — solo aclcostarica.com
Migración de base de datos:
- Desactivar (`is_active = false`) los dominios `aureon.cr`, `calderon.cr`, `horizontepositivo.org`.
- Insertar `aclcostarica.com` (display `ACL Costa Rica`, `is_active = true`) si no existe; si existe, marcarlo activo.

Resultado: el `DomainSelector` (que filtra por `is_active = true`) mostrará únicamente `aclcostarica.com`. No se requieren cambios de código en el frontend.

### 2. QuickBooks — usar credenciales de ACL para todas las empresas
Editar `supabase/functions/quickbooks-auth/index.ts`:
- Si la empresa no tiene `client_id`/`client_secret`, usar como respaldo los secretos `QUICKBOOKS_CLIENT_ID` / `QUICKBOOKS_CLIENT_SECRET`.
- Eliminar el error que bloquea la conexión cuando faltan credenciales por empresa.

Editar `supabase/functions/quickbooks-callback/index.ts`:
- Mismo respaldo de credenciales globales al intercambiar el código por tokens.
- Corregir la verificación de acceso: actualmente consulta `company_users` directamente y falla para admins sin fila explícita. Se aplicará la misma lógica que ya tiene `quickbooks-auth`: permitir admins (vía `user_roles`) o usuarios con acceso explícito en `company_users`.

Con esto, cualquier empresa (incluida Enfoque) conecta usando la app de QuickBooks de ACL; cada empresa queda vinculada a su propio `realm_id` según la cuenta que el usuario autorice.

## Notas técnicas
- El `redirect_uri` se mantiene igual (el secreto `QUICKBOOKS_REDIRECT_URI`), que debe seguir registrado en el portal de QuickBooks de ACL.
- No se tocan credenciales propias de empresas que sí las tengan (siguen teniendo prioridad sobre el respaldo global).

## Verificación
- En `/settings`, el selector de dominio muestra solo `aclcostarica.com`.
- Conectar QuickBooks desde una empresa sin credenciales (p. ej. Enfoque) ya no da el error de credenciales y abre la ventana de autorización de Intuit.
