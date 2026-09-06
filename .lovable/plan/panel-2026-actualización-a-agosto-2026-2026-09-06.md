# Panel 2026 — actualización a agosto 2026

Se actualizan únicamente los datos y las etiquetas del Panel 2026 (Horizonte Positivo). No se cambia el formato, el diseño ni los gráficos existentes.

## Qué se actualiza

### 1. Etiquetas de período
Todo lo que hoy dice "Julio 2026" pasa a "Agosto 2026": encabezado del estado de resultados, encabezado del estado de posición financiera (comparativo con diciembre 2025), notas al pie y versiones en inglés.

### 2. Estado de resultados acumulado a agosto (en dólares)
- Comunidad 117,918 · Cuotas Asociados 155,000 · Ingreso Renta Diferido 0 · **Total ingresos 272,918**
- Personal 150,675 · Gastos administrativos 13,809 · Viáticos y Giras 23,547 · Comunicación y Mercadeo 23,499 · Servicios Profesionales 18,683 · Tecnología 24,197 · Otros Gastos / Patente / IVA 9,153 · Impuesto de Renta 0 · **Total egresos 263,563**
- **Ingresos menos Gastos 9,354**

### 3. Estado de posición financiera al 31 de agosto de 2026
- Caja: colones 2,268 · dólares 112,689 · caja general 0 · total 114,957
- Cuentas por cobrar 43,010 · otras 953 · total 43,963
- Impuesto de renta diferido 33,129 · **Total activo corriente 192,049**
- Equipo de cómputo 29,975 · depreciación acumulada (24,968) · **activo fijo 5,007**
- **Total activos 197,056**
- Cuentas por pagar 3,115 · IVA por pagar 1,422 · impuesto de renta 0 · gastos acumulados 14,786 · otras 0 · **Total pasivo 19,323**
- Resultados acumulados 171,244 · ajuste por traducción (2,866) · resultado del año 9,354 · **Patrimonio 177,733**
- **Total pasivo y patrimonio 197,056** (cuadra con el activo)

### 4. Real contra presupuesto
La columna de presupuesto acumulado se carga con el detalle por línea a agosto que usted enviará. Hasta recibirlo, esa comparación queda rotulada como "acumulado a julio" para no mostrar un contraste engañoso.

### 5. Detalle mes a mes
Se agregan julio y agosto con el detalle que usted enviará. No se calcularán cifras por diferencia ni se inventarán montos.

### 6. Sin cambios
La tabla de proyección (real más proyectado septiembre–diciembre) se deja igual hasta recibir la proyección actualizada de la contadora.

## Nota técnica
Todo vive en `src/data/financialData2026.ts` (bloques `incomeStatement`, `balanceSheet`, `incomeStatementComparison`, `monthlyIncomeStatement` y etiquetas de período). Los componentes de tarjetas, balance y gráficos leen de ahí, así que no requieren cambios estructurales. Se revisará que el ajuste por traducción negativo se muestre entre paréntesis según el formato contable ya definido.
