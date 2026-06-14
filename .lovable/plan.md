# Mostrar Enfoque a la Familia en la lista de empresas

## Diagnóstico
El trabajo anterior dejó listo el **frontend** (componente `EnfoqueDashboard.tsx`, detección `isEnfoque`, ruteo en `Index.tsx`/`Index2026.tsx`, logo), pero **nunca se creó el registro de la empresa** en la tabla `quickbooks_companies`. La pantalla `/empresas` lista lo que existe en esa tabla, por eso Enfoque no aparece.

Empresas actuales en BD: Demo Lab, Horizonte Positivo, Agricola Lloronal, Andrea Castro.

## Qué se hará

1. **Crear la empresa en la base de datos**
   Insertar el registro en `quickbooks_companies` con:
   - `company_name = "Enfoque a la Familia"`
   - `data_source = "quickbooks"`
   - `is_active = true`, `is_connected = false` (hasta conectar OAuth)
   - `accent_color` con el color de marca de Enfoque (para el sistema white-label `--co`)
   
   Esto basta para que aparezca de inmediato en `/empresas` y que, al seleccionarla, se renderice el dashboard curado (`isEnfoque` ya la detecta por nombre).

2. **Conectar QuickBooks (paso operativo del admin)**
   Desde el Hub de QuickBooks, conectar la cuenta de Enfoque vía OAuth (`quickbooks-auth` → `quickbooks-callback`) y correr la sincronización inicial. Mientras no se conecte, el dashboard mostrará estado sin datos en vivo.

3. **Asignar acceso (paso operativo del admin)**
   Asignar el acceso de los usuarios correspondientes a la empresa vía `company_users` desde el panel de Admin (sin auto-asignación, según la regla actual de aislamiento).

## Detalle técnico
- La inserción se hace con la herramienta de datos (INSERT en `quickbooks_companies`), no migración (no hay cambio de esquema).
- No se requiere tocar código frontend: la detección y el ruteo ya existen.
- Confirmar el `accent_color` deseado para Enfoque antes de insertar (si no se indica, se usará un tono acorde a la marca de Enfoque).

## Pregunta abierta
- ¿Tienes a mano las credenciales de QuickBooks de Enfoque (Client ID / Secret / Realm) para conectarla en el mismo paso, o solo creamos el registro ahora y conectas tú después desde el Hub?
