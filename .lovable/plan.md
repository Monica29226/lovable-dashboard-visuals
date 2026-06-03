## Objetivo
Asegurar que cada cliente sea independiente: Horizonte Positivo conserva el dashboard completo actual; Agricola Lloronal, Demo Lab y cualquier nueva empresa solo muestran Balance General y Estado de Resultados conectados a QuickBooks, sin presupuesto ni datos fijos de Horizonte.

## Diagnóstico confirmado
- Agricola Lloronal y Demo Lab existen, pero hoy no están conectadas a QuickBooks y no tienen filas propias de Balance, Estado de Resultados ni Presupuesto.
- Horizonte Positivo sí tiene datos propios y es la única empresa con presupuesto cargado.
- El presupuesto muestra un fallback fijo de Horizonte cuando una empresa no tiene presupuesto; eso puede dar la impresión de que Agricola/Demo toman datos de Horizonte.
- La ruta global `/presupuesto-2026` está disponible sin distinguir empresa, aunque el presupuesto debe mantenerse solo para Horizonte por ahora.
- La pantalla QuickBooks global tiene pestañas extra y sincroniza presupuestos; para empresas nuevas eso no debe aplicarse.
- El selector de empresa ya intenta conservar la selección, pero hay que reforzar el flujo para que una empresa no vuelva visualmente a Horizonte al navegar.

## Plan de acción

### 1. Definir una regla central de tipo de empresa
- Crear una utilidad/regla compartida para identificar si la empresa seleccionada es `Horizonte Positivo`.
- Usar esa regla en dashboards, menú y rutas para evitar lógica duplicada por texto en varios archivos.

### 2. Separar dashboards por empresa
- Si la empresa activa es Horizonte Positivo:
  - Mantener el panel 2025 actual.
  - Mantener el panel 2026 actual.
  - Mantener presupuesto, KPIs, impuesto renta, proyecciones y reportes especiales.
- Si la empresa activa NO es Horizonte:
  - Mostrar únicamente un panel QuickBooks simple con:
    - Balance General.
    - Estado de Resultados.
  - Quitar/ocultar gráficos, KPIs, presupuesto, impuesto, proyecciones, cuentas por cobrar/pagar y cualquier componente que provenga del modelo fijo de Horizonte.

### 3. Bloquear presupuesto para empresas nuevas
- En el menú lateral, mostrar `Presupuesto 2026` solo cuando la empresa activa sea Horizonte Positivo.
- En la ruta `/presupuesto-2026`, si la empresa activa no es Horizonte:
  - No cargar `BudgetProvider`.
  - No mostrar fallback de presupuesto.
  - Redirigir al panel principal o mostrar un estado claro: “Presupuesto no configurado para esta empresa”.
- Ajustar `BudgetContext` para no usar datos iniciales tipo Horizonte cuando la empresa no tiene presupuesto, excepto si la empresa activa es Horizonte.

### 4. Simplificar QuickBooks para empresas no-Horizonte
- En `/quickbooks`, detectar la empresa activa:
  - Horizonte: mantiene el centro completo actual.
  - No-Horizonte: mostrar solo conexión/sincronización y acceso a Balance + Estado de Resultados.
- Quitar para empresas nuevas:
  - Presupuestos.
  - Cuentas por cobrar.
  - Cuentas por pagar.
  - Sincronización total que incluya presupuestos.
- Asegurar que todas las llamadas usen siempre `selectedCompanyId` y nunca fallback a Horizonte.

### 5. Corregir sincronización para no mezclar clientes
- Ajustar `quickbooks-sync-all` para que cuando se invoque desde una empresa específica sincronice solo esa empresa, no todas las conectadas.
- Para empresas no-Horizonte sincronizar únicamente:
  - Balance.
  - Estado de Resultados.
- Presupuestos se sincronizan solo para Horizonte.

### 6. Reforzar persistencia de empresa activa
- Revisar `CompanyContext` para que:
  - Restaure la empresa guardada si el usuario tiene acceso.
  - No prefiera Horizonte si ya hay una selección válida.
  - Limpie datos visuales antiguos al cambiar de empresa para que no queden datos de la empresa anterior en pantalla.

### 7. Estados claros para Agricola/Demo/nuevas empresas
- Si una empresa no está conectada: mostrar mensaje de conexión, no datos de Horizonte.
- Si está conectada pero sin sincronización: mostrar “Sin datos sincronizados todavía”.
- Si tiene Balance/Estado de Resultados: mostrar solo esos reportes.

### 8. Validación final
- Seleccionar Agricola Lloronal y confirmar que:
  - No vuelve a Horizonte.
  - No muestra presupuesto.
  - No muestra datos fijos de Horizonte.
  - Solo muestra Balance y Estado de Resultados si existen datos propios.
- Seleccionar Demo Lab y validar lo mismo.
- Seleccionar Horizonte y confirmar que conserva todo el dashboard actual.
- Confirmar que gestión de usuarios y empresas siguen solo para perfil administrador.

## Archivos principales a modificar
- `src/contexts/CompanyContext.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/Index.tsx`
- `src/pages/Index2026.tsx`
- `src/pages/Budget2026.tsx`
- `src/contexts/BudgetContext.tsx`
- `src/pages/QuickBooksOnline.tsx`
- `src/components/CompanyQuickBooksDashboard.tsx`
- `supabase/functions/quickbooks-sync-all/index.ts`

## Resultado esperado
Horizonte queda como el único cliente con dashboard completo y presupuesto. Agricola Lloronal, Demo Lab y futuros clientes quedan aislados, sin heredar reportes ni presupuesto de Horizonte, y se van ampliando gradualmente según sus necesidades reales.