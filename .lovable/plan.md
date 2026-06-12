# Plan: Arreglar conexión a QuickBooks por empresa y robustecer multiempresa

## Objetivo
Permitir que cualquier empresa (Agricola Lloronal, Demo Lab, etc.) se conecte a QuickBooks sin que la app se "pegue" ni regrese a Horizonte, manteniendo a Horizonte intacta y a las demás empresas mostrando solo Balance y Estado de Resultados.

## Causa raíz confirmada
1. La ventana OAuth se abre con `noopener`, por lo que `window.open` devuelve `null` y el código cae al fallback `window.top.location.href`, que lanza `SecurityError` dentro del iframe. La ventana de QuickBooks nunca abre.
2. El `redirect_uri` no coincide entre `quickbooks-auth` (fijo) y `quickbooks-callback` (dinámico), lo que provoca `invalid_grant` aún si la ventana abriera.

## Cambios

### 1. Corregir apertura de ventana OAuth — `src/pages/QuickBooksOnline.tsx`
- En `handleAuth`, abrir la ventana SIN `noopener` para conservar `window.opener` (necesario para el `postMessage` de regreso):
  ```js
  const authWindow = window.open(data.authUrl, 'qbAuth', 'width=600,height=750');
  ```
- Eliminar el fallback `window.top.location.href` que causa el `SecurityError`.
- Si la ventana es bloqueada (`authWindow === null`), mostrar un toast claro pidiendo permitir ventanas emergentes, en lugar de intentar navegar el iframe.
- Mantener el listener de `message` (`QUICKBOOKS_AUTH_SUCCESS`) que ya recarga datos y `refetchSync()`, y agregar `loadCompanies()` para refrescar `is_connected`/`realm_id` tras conectar.

### 2. Unificar `redirect_uri` entre auth y callback
- Usar la MISMA URI registrada en QuickBooks en ambas funciones. Tomarla del secreto existente `QUICKBOOKS_REDIRECT_URI` (o, si está vacío, la URI publicada del proyecto), y aplicarla idéntica en:
  - `supabase/functions/quickbooks-auth/index.ts` (construcción de `authUrl`).
  - `supabase/functions/quickbooks-callback/index.ts` (intercambio de token).
- Quitar el cálculo dinámico por `origin` del callback para evitar desajustes entre dominios (`lovableproject.com`, `lovable.app`, `dashboard.aclcostarica.com`).
- Nota operativa: esa URI única debe estar registrada en el portal de QuickBooks. Se documentará el valor exacto a registrar.

### 3. Robustecer selección de empresa — `src/contexts/CompanyContext.tsx`
- Tras una conexión exitosa, refrescar la lista (`loadCompanies`) sin reiniciar `selectedCompanyId`, para que la empresa recién conectada no "rebote" a Horizonte.
- Confirmar que `resolveSelection` respeta la selección guardada antes que el fallback a Horizonte (ya implementado; se valida).

### 4. Limpieza menor del Hub heredado — `src/pages/QuickBooksHub.tsx`
- Este componente ya no es la ruta activa (`/quickbooks-hub` redirige a `/quickbooks`), pero su `handleAuth` aún usa `window.location.href = data.authUrl`. Alinear su botón para usar el mismo patrón de ventana emergente o marcarlo como obsoleto, evitando que vuelva a romper si se enlaza.

## Verificación
1. Como admin, seleccionar Agricola Lloronal → "Conectar con QuickBooks": debe abrir ventana de Intuit (sin `SecurityError` en consola).
2. Completar autorización: el callback intercambia token sin `invalid_grant`, la ventana se cierra y la app muestra "Conexión exitosa".
3. Confirmar en BD que `is_connected=true` y `realm_id` queda seteado para Agricola.
4. Sincronizar y ver Balance + Estado de Resultados de Agricola, sin que aparezcan datos ni presupuesto de Horizonte.
5. Cambiar entre empresas varias veces y confirmar que la selección se mantiene (no rebota a Horizonte).

## Fuera de alcance
- No se tocan datos financieros ni la lógica de reportes de Horizonte.
- No se modifican esquemas de BD (las credenciales por empresa ya existen).
