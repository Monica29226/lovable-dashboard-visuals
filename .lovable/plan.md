# Plan: Cuadro "Presupuesto vs. Real" estático a junio 2026

## Objetivo
En el Panel 2026, la pestaña **Presupuesto vs. Real** mostrará una tabla fija con exactamente los valores del Excel (a junio 2026), en lugar del reporte que se calcula dinámicamente desde QuickBooks.

## Qué se construye

Un nuevo componente `src/components/BudgetVsRealStatic2026.tsx` con el mismo estilo visual del reporte actual (tarjetas resumen arriba + tabla con bordes), pero con datos fijos:

**Encabezado:** "PRESUPUESTO VS. REAL - 2026", subtítulo "Valores en US$ · Acumulado a Junio 2026".

**Tarjetas resumen (3):**
- Ingresos: 186,311 (Presupuesto a junio: 290,435)
- Gastos: 211,480 (Presupuesto a junio: 170,425)
- Ingresos menos Egresos: (25,169) (Presupuesto a junio: 120,010)

**Columnas de la tabla:** Cuenta · Presupuesto Total Anual · Presupuesto Junio · Acumulado Junio · Variación · Pendiente Ejecución · % Avance

**Filas (valores exactos del Excel):**

```text
INGRESOS
  Membresía            258,633 | 175,650 |  71,311 | (104,339) | 179,339 |  28%
  Cuotas Asociados     250,650 | 114,785 | 115,000 |      215  | 143,633 |  44%
  Otros                      - |       - |       - |        -  |       - | n/a
Total ingresos         509,283 | 290,435 | 186,311 | (104,124) | 322,972 |  37%

EGRESOS
  Personal             223,079 | 111,540 | 114,603 |   (3,064) | 108,476 |  51%
  Gastos administrativos 20,493|  10,247 |  11,784 |   (1,537) |   8,709 |  58%
  Viáticos              24,000 |  12,000 |  17,142 |   (5,142) |   6,858 |  71%
  Comunicación y Mercadeo 6,885|   2,595 |  14,533 |  (11,938) |  (7,648)| 211%
  Eventos                8,750 |   3,650 |       - |    3,650  |       - | n/a
  Servicios Profesionales 24,048| 12,024 |  27,601 |  (15,577) |  (3,553)| 115%
  Tecnología            21,840 |  12,670 |  18,324 |   (5,654) |   3,516 |  84%
  Impuestos              8,000 |   4,000 |   5,999 |   (1,999) |   2,001 |  75%
  Otros Gastos             400 |     200 |       - |      200  |     400 |   0%
  Depreciación           3,000 |   1,500 |   1,493 |        7  |   1,507 | n/a
  Impuesto de Renta          - |       - |       - |        -  |       - | n/a
Total egresos          340,495 | 170,425 | 211,480 |  (41,055) | 120,265 |  62%

Ingresos menos Gastos  168,787 | 120,010 | (25,169)|  145,179  | 202,706 | -15%
```

Los valores negativos van entre paréntesis. Variación y % Avance se muestran tal cual el Excel (no se recalculan para respetar exactamente el cuadro de referencia).

## Cambios en archivos
- **Crear** `src/components/BudgetVsRealStatic2026.tsx` (tabla estática con los valores anteriores).
- **Editar** `src/pages/Index2026.tsx`: la pestaña `execution` renderiza `BudgetVsRealStatic2026` en vez de `BudgetProvider` + `BudgetExecutionReport`. Se eliminan esos imports (ya no usados aquí).

## Notas
- No se toca `BudgetExecutionReport.tsx` (queda disponible por si se usa en otro lugar); solo se deja de usar en el Panel 2026.
- No hay selector de mes: el cuadro es fijo a junio 2026, igual que el Excel.
- El gráfico redondo en "Estado de Resultados" se mantiene sin cambios.
