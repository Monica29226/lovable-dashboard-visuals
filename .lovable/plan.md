## Contexto

El archivo `04_Estados_Financieros_H_Abril_2026-2.xlsx` corresponde al mismo período (Abril 2026) ya cargado. Los valores son prácticamente idénticos a los que están en `src/data/financialData2026.ts` — las diferencias son únicamente decimales que actualmente están redondeados. El formato del Panel 2026 no se toca; solo se sustituyen montos.

## Cambios

Actualizar **un solo archivo**: `src/data/financialData2026.ts` con las cifras exactas del Excel (sin redondeo). Esto refresca automáticamente KPICards2026, BalanceSheet2026, IncomeExpensesChart2026 y todos los componentes que consumen este dato (single source of truth).

### Estado de Resultados Acumulado (Abril 2026)

| Concepto | Actual | Nuevo |
|---|---|---|
| Cuotas Asociados | 56,903 | 56,902.72 |
| Comunidad (Membresía) | 78,493 | 78,492.73 |
| Ingreso Renta Diferido / Otros | 0 | 0 |
| **Total Ingresos** | 135,395 | **135,395.45** |
| Personal | 69,520 | 69,520.30 |
| Gastos Administrativos | 7,165 | 7,165.31 |
| Viáticos y Giras | 11,078 | 11,077.56 |
| Comunicación y Mercadeo | 11,674 | 11,674.37 |
| Servicios Profesionales | 14,944 | 14,943.82 |
| Tecnología | 11,231 | 11,230.87 |
| Otros Gastos / Patente / IVA / Deprec. | 1,363 | 1,362.37 (Impuestos 864.63 + Otros 0 + Depreciación 497.74) |
| Impuesto de Renta | 0 | 0 |
| **Total Egresos** | 126,975 | **126,974.61** |
| **Ingresos − Gastos** | 8,421 | **8,420.84** |

### Estado de Posición Financiera (Abril 2026)

| Concepto | Actual | Nuevo |
|---|---|---|
| Caja Colones BAC | 4,155 | 4,155.16 |
| Caja Dólares BAC | 145,021 | 145,020.55 |
| Total Caja y Bancos | 149,176 | 149,175.71 |
| Cuentas por Cobrar | 22,944 | 22,944.38 |
| Otras Cuentas por Cobrar | -1,622 | -1,622.49 |
| Total Cuentas por Cobrar | 21,322 | 21,321.89 |
| Impuesto Renta Diferido | 32,838 | 32,837.60 |
| **Total Activo Corriente** | 203,335 | **203,335.20** |
| Equipo de Cómputo | 27,556 | 27,555.60 |
| Depreciación Acumulada | -23,076 | -23,076.31 |
| Total Activo Fijo | 4,479 | 4,479.29 |
| **TOTAL ACTIVOS** | 207,814 | **207,814.49** |
| Cuentas por Pagar | 6,554 | 6,554.08 |
| Impuestos por Pagar (IVA) | 1,827 | 1,826.62 |
| Impuesto de Renta | -2,715 | -2,715.08 |
| Gastos Acumulados por Pagar | 10,725 | 10,724.86 |
| **Total Pasivo** | 16,390 | **16,390.48** |
| Resultados Acumulados | 171,244 | 171,244.32 |
| Ajuste por Traducción | 11,759 | 11,758.85 |
| Resultado del Año | 8,421 | 8,420.84 |
| **Total Patrimonio** | 191,424 | **191,424.02** |

## Notas
- Se mantiene `period: 'Abril 2026'`.
- No se modifica ningún componente visual (`KPICards2026`, `BalanceSheet2026`, charts, etc.). El formato actual ya muestra los valores con 0 decimales mediante `formatCurrency2026`, así que visualmente se verá igual con cifras ligeramente más precisas al sumar.
- No se tocan datos de 2025 ni de presupuesto.
