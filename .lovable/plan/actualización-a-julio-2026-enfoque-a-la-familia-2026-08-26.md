# Actualización a julio 2026 — Enfoque a la Familia

Los adjuntos corresponden al panel de Enfoque a la Familia, hoy cerrado a junio 2026. Se actualizan únicamente los datos; no se cambia el diseño, la estructura ni los componentes del dashboard.

Todo el contenido financiero de ese panel vive en un solo archivo de datos, así que el cambio se concentra ahí.

## Cifras que se toman de los adjuntos

Estado de resultados acumulado a julio 2026:

- Ingresos: Donación Focus 3,240,750 · Capacitación 3,960,144 · Consulta Especializada 55,067,986 · Otras Donaciones 324,556 · Otros Ingresos 1,947,837 · Conferencias USA, Libros e Ingresos Financieros sin monto. Total 64,541,273.
- Gastos: las 20 líneas del adjunto (Salarios 31,960,356 · Cargas Sociales 13,683,616 · Servicios Profesionales 10,057,367 · y el resto tal como aparecen). Total 68,941,936.
- Ingresos menos gastos (operación): (4,400,663).
- Diferencial cambiario: (9,700,859).
- Resultado neto del período: (14,101,522).
- Se conservan las columnas comparativas 2024 y 2025 que ya están cargadas.

Balance al 31 de julio de 2026 (comparativo diciembre 2025):

- Efectivo y equivalentes 147,187,888 · Cuentas por cobrar 638,430 · Inventarios de libros sin monto · Propiedad, planta y equipo 87,229,080 · Total activos 235,055,398.
- Cuentas por pagar 14,524,529 · Retenciones por pagar 3,914,303 · Impuestos por pagar 3,165,680 · Provisiones laborales LP 35,208,052 · Total pasivo corto plazo 56,812,564.
- Excedentes acumulados 192,344,356 · Resultado del período (14,101,522) · Patrimonio neto 178,242,834.
- El balance cuadra exactamente, así que se elimina la nota de descuadre de 10 colones que hoy aparece.

## Rótulos de período

Se cambia en todo el panel «junio / 6 meses / enero–junio» por «julio / 7 meses / enero–julio», incluyendo el encabezado, la nota de moneda, la fuente del cierre, la columna del balance (pasa de Jun-2026 a Jul-2026) y el pie de página. El formato de montos se mantiene: cifras completas, coma de miles, sin decimales, negativos entre paréntesis.

## Narrativa y conclusiones

Las frases ejecutivas se recalculan con las cifras de julio, sin inventar causas: la cascada (operación, diferencial cambiario, resultado neto), la tendencia contra 2024 y 2025, la participación de cada categoría de ingreso sobre el total y los porcentajes derivados. La lectura de fondo se mantiene: el deterioro viene del tipo de cambio, no de la operación.

## Bloques que quedan pendientes de su envío

Estos bloques usan datos que no vienen en el balance ni en el estado de resultados adjuntos:

1. Presupuesto acumulado a julio y presupuesto por línea de gasto (usted lo envía).
2. Composición del efectivo entre colones y dólares al 31 de julio.
3. Meses de operación que cubre el efectivo disponible.

Mientras no lleguen esas cifras, esos bloques se rotulan explícitamente como «pendiente de actualización — dato a junio 2026» en lugar de mostrar un número que parezca de julio. No se inventa ni se prorratea nada. En cuanto envíe el presupuesto acumulado a julio y el detalle de efectivo, se completan en una segunda pasada.

## Detalle técnico

- Archivo a modificar: `src/data/enfoqueFinancialData.ts` (único origen de datos del panel; el comentario de cabecera indica que solo debe tocarse este archivo en cada cierre).
- El campo `jun2026` de las líneas del balance se renombra a `jul2026` en la interfaz `BalanceLine` y en su única lectura dentro de `src/components/EnfoqueDashboard.tsx`; es un cambio de nombre de campo, sin efecto visual salvo el rótulo de la columna.
- No se tocan QuickBooks, autenticación, navegación, permisos, ni los datos de Horizonte Positivo u otras empresas.
- Verificación: revisión de tipos y build, más comprobación de que activos = pasivo + patrimonio y de que las sumas de líneas coinciden con los totales de los adjuntos.
