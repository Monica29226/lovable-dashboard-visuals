## Objetivo

1. Corregir el error "Error al autenticar con QuickBooks" al conectar **Enfoque a la Familia**.
2. Recuperar los gráficos y tablas curados del proyecto [enfoque-directiva-dashboard-view](/projects/c504878f-c78c-4986-90a0-5826f1358211) como base del dashboard, e integrar los datos en vivo de QuickBooks cuando la empresa esté conectada.

---

## Parte 1 — Arreglar conexión QuickBooks

**Causa raíz:** la edge function `quickbooks-auth` valida el acceso consultando directamente la tabla `company_users` del usuario. Hoy **ningún** usuario (ni el admin) tiene fila de acceso para "Enfoque a la Familia", así que devuelve `Access denied to this company`. El resto de funciones del proyecto usan la función `user_has_company_access`, que **sí** permite el rol admin; `quickbooks-auth` quedó desincronizada.

**Cambio:** en `supabase/functions/quickbooks-auth/index.ts`, reemplazar la consulta directa a `company_users` por una verificación que también acepte admin:
- Mantener la verificación de JWT.
- Permitir el acceso si el usuario es admin (consultando `user_roles` con rol `admin`) **o** tiene fila en `company_users` para esa empresa.

Esto deja a los admin conectar cualquier empresa, conservando el aislamiento estricto para usuarios normales.

> Nota: el error solo bloquea el inicio de OAuth. Si tras conectar siguen apareciendo errores de credenciales, sería un tema aparte de `client_id`/`client_secret`/`redirect_uri` de la app en el portal de QuickBooks.

---

## Parte 2 — Portar el dashboard curado de Enfoque + datos en vivo

El proyecto original usa **datos curados estáticos** organizados en pestañas. Se portará esa base y se integrará con la consulta en vivo de QuickBooks ya existente.

### Nuevo archivo de datos
`src/data/enfoqueFinancialData.ts` — copia adaptada de `getFinancialData(language)` del proyecto original, con:
- `financialSummary` (ingresos/gastos acumulados 2025, resultado neto, diferencial cambiario, presupuesto anual)
- `incomeComparison` / `expenseComparison` 2022-2025
- `incomeDetail2025` / `expenseDetail2025` (concepto, real, presupuesto)
- `budgetExecution` (presupuestado, real, % ejecución)
- `financialPosition` (activos, pasivos, patrimonio)
- `resultsAnalysis` 2022-2025 (margen, superávit/déficit)
- `chartData` (ingresos vs gastos por año)

### Reescritura de `src/components/EnfoqueDashboard.tsx`
Mantener el encabezado/hero y el selector de idioma ES/EN actuales (marca ACL/Enfoque), y reorganizar en pestañas:

1. **Resumen** — tarjetas KPI (ingresos, gastos, resultado neto, posición financiera) + gráfico de barras Ingresos vs Gastos por año (`chartData`).
2. **Ingresos** — tabla `incomeDetail2025` (real vs presupuesto + %) y gráfico de tendencia `incomeComparison`.
3. **Gastos** — tabla `expenseDetail2025` (real vs presupuesto + %) y pie de distribución de gastos.
4. **Balance comparativo** — `financialPosition` + comparativo 2024-2025.
5. **Resultados / Indicadores** — `resultsAnalysis` (margen, déficit), `budgetExecution` y KPIs/OKRs curados.

**Integración en vivo:** cuando `isConnected` es `true`, conservar las consultas actuales a `quickbooks-income` y `quickbooks-balance`. Cuando hay datos en vivo, se muestran (con badge "QuickBooks en vivo"); cuando no, se usa la data curada como respaldo. Así el dashboard nunca aparece vacío y se mantiene como base de trabajo para actualizar la información.

Se reutilizan los formatos de moneda CRC con separador de miles y negativos en paréntesis (ya presentes), respetando la paleta de marca (navy/cream/gold, sin amarillos de relleno).

### Detalle técnico
- No se tocan `src/integrations/supabase/client.ts` ni archivos autogenerados.
- No se requieren cambios de esquema ni migraciones de base de datos.
- Solo se edita la edge function `quickbooks-auth` y archivos de frontend (`EnfoqueDashboard.tsx`, nuevo `enfoqueFinancialData.ts`).

---

## Verificación
- Probar `quickbooks-auth` para Enfoque como admin: debe devolver `authUrl` (200) en vez de 500.
- Revisar el dashboard de Enfoque: muestra las tablas/gráficos curados aun sin conexión, y datos en vivo cuando QuickBooks esté conectado.