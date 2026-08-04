# Actualizar Panel 2026: de Junio a Julio

Cambio de período en las cuatro vistas del Panel 2026, sin modificar el orden de los cuadros, el layout ni el formato. Solo se reemplazan cifras y rótulos.

## Pendiente antes de ejecutar

Faltan los datos de julio. No se inventará ninguna cifra. Se requiere:

- Estado de Resultados acumulado a julio 2026 (ingresos y egresos por partida).
- Estado de Posición Financiera al 31 de julio 2026 (comparativo contra diciembre 2025).
- Presupuesto vs. Real a julio 2026 (presupuesto del mes, acumulado, variación, pendiente y % avance).
- Cifras reales del mes de julio para la proyección mensual (columna Julio pasa de proyectada a real).

Con esas imágenes o tablas se aplica el cambio en un solo paso.

## Qué se actualiza

### 1. Datos centralizados (`src/data/financialData2026.ts`)
- `period` → "Julio 2026", `periodEn` → "July 2026".
- Cifras de `balanceSheet` (activos, pasivos, patrimonio) al 31 de julio.
- Cifras de `incomeStatement` acumuladas enero–julio.
- Serie mensual: se agrega/actualiza el punto "Julio" con el dato real.
- `projectionIncomeStatement2026`: la columna Julio pasa de proyección a real; el bloque real cubre enero–julio (7 meses) y la proyección agosto–diciembre (5 meses).

### 2. Estado de Posición Financiera (`BalanceSheet2026.tsx`)
Misma tabla y mismas columnas; el encabezado comparativo pasa a "Diciembre 2025 vs Julio 2026" tomando el valor de `period`.

### 3. Estado de Resultados (`IncomeExpensesChart2026.tsx`, `KPICards2026.tsx`)
Se alimentan de los datos centralizados; solo cambian los montos y el rótulo del período.

### 4. Presupuesto vs. Real (`BudgetVsRealStatic2026.tsx`)
Columnas renombradas a "Presupuesto Julio" y "Acumulado Julio", nota del encabezado a "Acumulado a Julio 2026", y valores de cada fila actualizados.

### 5. ER Proyección (`IncomeStatementProjection2026.tsx`)
- El corte real/proyección se mueve de 6 a 7 meses: real enero–julio, proyección agosto–diciembre.
- Encabezados: "Acumulado Julio", "Total Ago-Dic", y los rótulos colapsados "Ene–Jul" / "Ago–Dic".
- El resto (colores, totales, variación, botones de colapsar) queda igual.

## Detalles técnicos

El corte 6/7 está hoy quemado en `IncomeStatementProjection2026.tsx` (`slice(0,6)` / `slice(6,12)`). Se sustituye por una constante `REAL_MONTHS = 7` para que el cambio quede en un solo lugar y sea trivial moverlo el próximo mes.

## Fuera de alcance

QuickBooks Online, Estado de Resultados USD, panel de Enfoque, edge functions y base de datos.
