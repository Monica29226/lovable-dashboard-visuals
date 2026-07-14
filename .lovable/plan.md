# Cuadro estático "Presupuesto vs. Real" — Junio 2026

## Objetivo
En el **Panel 2026 → pestaña Presupuesto vs. Real**, mostrar una tabla fija con los valores exactos de la imagen, en lugar del reporte dinámico que se calcula desde QuickBooks/BudgetContext.

## Qué se construye

Nuevo componente `src/components/BudgetVsRealStatic2026.tsx` con el mismo estilo visual del proyecto (tarjetas resumen arriba + tabla con bordes, tipografía ACL), pero con datos hardcoded.

**Encabezado:** "Presupuesto vs. Real — 2026" · subtítulo "Valores en US$ · Acumulado a Junio 2026 · Cuadro de referencia (no en tiempo real)".

**Tarjetas resumen (3):**
- Ingresos: Acumulado 186,311 · Presupuesto Junio 290,435
- Egresos: Acumulado 211,480 · Presupuesto Junio 170,425
- Ingresos menos Egresos: Acumulado (25,169) · Presupuesto Junio 120,010

**Columnas:** Cuenta · Presupuesto Total Anual · Presupuesto Junio · Acumulado Junio · Variación · Pendiente Ejecución · % Avance

**Filas (valores exactos de la imagen del usuario):**

```text
INGRESOS
  Membresía             258,633 | 175,650 |  71,311 | (104,339) | 179,339 |  28%
  Cuotas Asociados      250,650 | 114,785 | 115,000 |      215  | 143,633 |  44%
  Otros                       - |       - |       - |        -  |       - | n/a
Total ingresos          509,283 | 290,435 | 186,311 | (104,124) | 322,972 |  37%

EGRESOS
  Personal              223,079 | 111,540 | 114,603 |   (3,064) | 108,476 |  51%
  Gastos administrativos 20,493 |  10,247 |  11,784 |   (1,537) |   8,709 |  58%
  Viáticos               24,000 |  12,000 |  17,142 |   (5,142) |   6,858 |  71%
  Comunicación y Mercadeo 15,635|   6,245 |  14,533 |   (8,288) |   1,102 |  93%
  Servicios Profesionales 24,048| 12,024 |  27,601 |  (15,577) |  (3,553)| 115%
  Tecnología             21,840 |  12,670 |  18,324 |   (5,654) |   3,516 |  84%
  Impuestos               8,000 |   4,000 |   5,999 |   (1,999) |   2,001 |  75%
  Otros Gastos              400 |     200 |       - |      200  |     400 |   0%
  Depreciación            3,000 |   1,500 |   1,493 |        7  |   1,507 | n/a
  Impuesto de Renta           - |       - |       - |        -  |       - | n/a
Total egresos           340,495 | 170,425 | 211,480 |  (41,055) | 129,015 |  62%

Ingresos menos Gastos   168,787 | 120,010 | (25,169)|  145,179  | 193,956 | -15%
```

- Negativos entre paréntesis, guion "-" para ceros.
- Variación y % Avance se muestran tal cual (no se recalculan) para respetar exactamente el cuadro de referencia.

## Cambios en archivos
- **Crear** `src/components/BudgetVsRealStatic2026.tsx` (tabla estática + 3 tarjetas resumen).
- **Editar** `src/pages/Index2026.tsx`: la pestaña `execution` renderiza `BudgetVsRealStatic2026` en lugar de `BudgetProvider + BudgetExecutionReport`; se quitan esos imports si ya no se usan.

## Notas
- No se toca `BudgetExecutionReport.tsx` (sigue disponible para otras vistas).
- Sin selector de mes: el cuadro es fijo a junio 2026.
- No cambia nada del gráfico "Estado de Resultados" ni de otras pestañas.
