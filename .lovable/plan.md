# Actualización Panel Financiero 2026

Todos los cambios son estáticos, dentro del Panel 2026 (Horizonte). No se toca QuickBooks, ni la vista USD, ni edge functions.

## 1. Estado de Posición Financiera (imagen 3)

Archivo: `src/data/financialData2026.ts` → sección `balanceSheet`.

Actualizar las cifras a Junio 2026 (los valores actuales ya coinciden en su mayoría; verificar y ajustar):

- Activos corrientes: Caja Colones 903, Caja Dólares 114,029, Total Caja 114,931; Cuentas por Cobrar 16,757, Otras Cuentas por Cobrar 2,124, Total 18,882; Impuesto Renta Diferido 32,822; Total Activo Corriente 166,635.
- Activo Fijo: Equipo de Cómputo 29,975, Depreciación Acumulada (24,330), Total 5,645.
- TOTAL ACTIVOS 172,280.
- Pasivos: Cuentas por Pagar 5,453; Impuestos por Pagar (IVA) (575); Gastos Acumulados por Pagar 7,319; Total Pasivo 12,197.
- Patrimonio: Resultados Acumulados 171,244; Ajuste por traducción 14,265; Ingresos menos Gastos del año (25,427); Total Patrimonio 160,082.
- TOTAL PASIVO Y PATRIMONIO 172,279.

Nota: se agrega también la columna comparativa "Diciembre 2025" (Activos 184,055, Pasivo 12,811, Patrimonio 171,244, etc.). Se añade un array `balanceSheetComparison` con ambas columnas y se actualiza `BalanceSheet2026.tsx` para mostrarlas lado a lado (dos columnas: Dic 2025 / Jun 2026), respetando el estilo actual.

## 2. Estado de Resultados (imagen 4)

Archivo: `src/data/financialData2026.ts` → `incomeStatement`.

Actualizar montos "Acumulado Junio":
- Ingresos: Membresía 71,311; Cuotas Asociados 115,000; Otros 0; Total 186,311.
- Egresos: Personal 114,603; Gastos administrativos 11,784; Viáticos 17,142; Comunicación y Mercadeo 14,533; Servicios Profesionales 27,601; Tecnología 18,324; Impuestos 5,999; Otros Gastos 0; Depreciación 1,751; Impuesto de Renta 0; Total 211,738.
- Resultado: (25,427).

Nota: la imagen 4 agrupa "Comunicación y Mercadeo" (incluye Eventos = 14,533 ≈ 5,347 + 9,186) y muestra Depreciación 1,751 (acumulada 6 meses). Se actualizan los campos numéricos manteniendo la estructura actual del `IncomeExpensesChart2026`. No se cambia el gráfico ni el layout.

## 3. Presupuesto vs. Real (imagen 1)

Archivo: `src/components/BudgetVsRealStatic2026.tsx` + datos en `financialData2026.ts`.

Nueva tabla con columnas: **Presupuesto Total Anual | Presupuesto Junio | Acumulado Junio | Variación | Pendiente Ejecución | % Avance**.

Filas Ingresos: Membresía (230,000 / 175,650 / 71,311 / (104,339) / 148,689 / 32%), Cuotas Asociados (220,000 / 114,785 / 115,000 / 215 / 115,000 / 50%), Otros (0 / 0 / 0 / 0 / 0 / n/a), Total ingresos (450,000 / 290,435 / 186,311 / (104,124) / 263,689 / 41%).

Filas Egresos: Personal, Gastos administrativos, Viáticos, Comunicación y Mercadeo, Servicios Profesionales, Tecnología, Impuestos, Otros Gastos, Depreciación, Impuesto de Renta — valores exactos de la imagen 1. Total egresos (340,495 / 170,425 / 211,738 / (41,313) / 128,757 / 62%).

Fila final: Ingresos menos Gastos (109,505 / 120,010 / (25,427) / 145,437 / 134,932 / -23%).

Formato: mismo estilo actual (accounting, paréntesis para negativos), % Avance con badge de color (verde ≤100%, rojo >100%).

## 4. Nueva pestaña "ER Proyección" (imagen 2)

Sub-tab nuevo en `src/pages/Index2026.tsx` (5° tab, después de "Presupuesto vs. Real").

Nuevo componente: `src/components/IncomeStatementProjection2026.tsx`.

Tabla con columnas: **Enero | Febrero | Marzo | Abril | Mayo | Junio | Acumulado Junio | Julio | Agosto | Setiembre | Octubre | Noviembre | Diciembre | Total Julio-Dic | Total Proyección | Presupuesto Original | Variación**.

- Enero–Junio (Real) con fondo azul claro.
- Julio–Diciembre (Proyección) con fondo verde claro.
- Filas Ingresos: Cuotas Asociados, Comunidad, Ingreso por impuesto sobre la renta diferido, Total ingresos.
- Filas Egresos: Personal, Gastos administrativos, Representación, Comunicación y Mercadeo, Eventos, Servicios Profesionales, Tecnología, Impuestos, Otros Gastos, Depreciación, Total egresos.
- Fila final: Ingresos menos Gastos.

Datos exactos de la imagen 2 se agregan a `financialData2026.ts` como `projectionIncomeStatement` (array de filas con 16 valores cada una).

Estilo: card + tabla shadcn con font mono para números, tokens del design system (sin colores hardcoded — usar `bg-secondary/40` para real y `bg-accent/10` para proyección).

## Archivos afectados

- `src/data/financialData2026.ts` (agregar datos)
- `src/components/BalanceSheet2026.tsx` (dos columnas comparativas)
- `src/components/IncomeExpensesChart2026.tsx` (números actualizados vía data)
- `src/components/BudgetVsRealStatic2026.tsx` (nueva tabla)
- `src/components/IncomeStatementProjection2026.tsx` (nuevo)
- `src/pages/Index2026.tsx` (agregar 5° tab)

## Fuera de alcance

QuickBooks Online, IncomeStatementUSD, edge functions, exchange_rates, y todos los demás dashboards por empresa.
