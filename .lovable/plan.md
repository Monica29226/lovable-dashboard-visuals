# Unificar "Enfoque a la Familia" como nueva empresa en Dashboard ACL

## Objetivo
Traer el dashboard financiero de **Enfoque a la Familia** al sistema ACL como una empresa más, con su panel curado completo (Resumen, Ingresos, Gastos, Balance, Resultados, KPIs/OKRs), alimentado por **QuickBooks en vivo** mediante el pipeline que ACL ya tiene, y con acceso **asignado solo por admin**.

## Por qué este enfoque
ACL ya resuelve multi-empresa, OAuth por empresa, aislamiento por `company_users` y sincronización de Balance/Resultados. Enfoque tenía su propio backend paralelo (tablas `organizations`, funciones `sync-financial-reports`). En vez de duplicar ese backend, **reutilizamos el de ACL** y solo portamos/adaptamos la **interfaz** de Enfoque. Así queda una sola fuente de datos y de auth.

## Cómo se verá
- En el selector de empresas aparece "Enfoque a la Familia".
- Al seleccionarla, el panel principal muestra el dashboard curado estilo Enfoque (en lugar del mini-dashboard genérico de QuickBooks que usan las demás empresas no-Horizonte).
- Mantiene el branding de Enfoque (logo + color de acento) vía el sistema white-label `--co` que ACL ya soporta.

## Pasos

### 1. Marca y detección de empresa
- Copiar el logo de Enfoque (`enfoque-logo.jpg`) desde el proyecto Enfoque a `src/assets/`.
- Agregar helper `isEnfoque(companyName)` en `src/lib/company.ts` (análogo a `isHorizonte`).
- Definir el color de acento de Enfoque en el campo `accent_color` de la empresa (white-label `--co`).

### 2. Portar la UI del dashboard
- Crear `src/components/EnfoqueDashboard.tsx` adaptando `StaticFinancialDashboard.tsx` / `EnfoqueFinancialDashboard.tsx` de Enfoque:
  - Tabs: Resumen, Ingresos, Gastos, Balance, Resultados, KPIs & OKRs.
  - Gráficos (recharts: PieChart ingresos/gastos, comparativos Real vs Presupuesto), tablas de detalle, tarjetas KPI/OKR.
  - Usar el `LanguageContext` de ACL (ES/EN) en lugar del estado local de idioma de Enfoque.
- Portar subcomponentes/tabs necesarios (Income/Expenses/Analysis) adaptados a los tokens de diseño de ACL.

### 3. Conectar a datos en vivo de QuickBooks (pipeline ACL)
- Reemplazar los hooks propios de Enfoque (`useDashboardData`, `useOrganizations`, `useDynamicKPIs`, `useBalanceSheetForPeriod`, `useMonthlyProfitLoss`) por consumo de los datos de ACL:
  - **Balance**: función `quickbooks-balance` (`{ companyId, asOfDate }`) → árbol activos/pasivos/patrimonio.
  - **Resultados / Ingresos / Gastos**: función `quickbooks-income` (`{ companyId, year }`) → secciones mensuales por cuenta, totales de ingresos/gastos/neto.
  - Selector de periodo (mes/año) usando estado local + estos parámetros (Enfoque tenía `PeriodContext`; lo reducimos a estado local como hace ACL).
- Crear funciones de mapeo de las respuestas de ACL a las estructuras que la UI de Enfoque espera (ingresos por fuente, distribución de gastos, composición del balance, KPIs).
- Presupuesto: como el pipeline de ACL no trae presupuesto de Enfoque, las columnas de "Presupuesto" se mostrarán solo si hay datos; de lo contrario se ocultan o quedan en cero (a confirmar más adelante con un origen de presupuesto).

### 4. Enrutar la vista
- En `src/pages/Index.tsx` (y `Index2026.tsx` si aplica): cuando la empresa seleccionada sea Enfoque, renderizar `<EnfoqueDashboard>` en lugar de `CompanyQuickBooksDashboard`.

### 5. Crear la empresa y conectar QuickBooks
- Crear la empresa "Enfoque a la Familia" en `quickbooks_companies` con `data_source = 'quickbooks'`, `accent_color`, y sus credenciales QB (`client_id` / `client_secret`).
- Conectar OAuth desde el Hub de QuickBooks (`quickbooks-auth` → popup → `quickbooks-callback`), guardando tokens en `quickbooks_tokens` y marcando `is_connected`.
- Ejecutar sincronización inicial (`quickbooks-sync-balance`, `quickbooks-sync-profit-loss`).

### 6. Acceso (solo admin)
- No se auto-asigna. El admin otorga acceso insertando en `company_users` a los usuarios que deban ver Enfoque (flujo de gestión de usuarios existente).

### 7. Verificación
- Confirmar que la empresa aparece para usuarios autorizados y NO para otros (aislamiento RLS / `company_users`).
- Verificar que el dashboard muestra datos reales tras la sync, y que el cambio de empresa actualiza branding y datos.

## Detalles técnicos
- **Sin backend nuevo**: se reutilizan `quickbooks-auth`, `quickbooks-callback`, `quickbooks-balance`, `quickbooks-income`, `quickbooks-sync-balance/profit-loss/all`.
- **No se migran las tablas/funciones de Enfoque** (`organizations`, `sync-financial-reports`, `useDashboardData`, etc.); se descartan en favor del modelo ACL.
- **No se migran usuarios de Enfoque** (decisión: acceso solo por admin).
- Diferencias de forma de datos: las respuestas de ACL (`quickbooks-income` mensual por cuenta; `quickbooks-balance` en árbol) se adaptan con funciones de mapeo a las vistas de Enfoque (ingresos por fuente, top gastos + "Otros", composición de balance, KPIs/OKRs).
- Branding por empresa mediante `accent_color` → `--co`; el logo se selecciona según `isEnfoque`.

## Fuera de alcance (a confirmar luego)
- Origen del **presupuesto** de Enfoque (Excel/QB) para reactivar columnas Real vs Presupuesto.
- Migración de datos históricos o reportes específicos de Enfoque que no provengan de QuickBooks.
- Reconstrucción de OKRs dinámicos si requieren una fuente distinta a QuickBooks.
