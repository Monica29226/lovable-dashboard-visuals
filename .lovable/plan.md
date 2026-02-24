
## Corrección del Cálculo del Impuesto de Renta

### Problema Encontrado

El rubro "Impuesto de Renta Estimado" sigue existiendo dentro de "Otros Gastos" en la estructura de datos. Aunque esta fila esta oculta visualmente en la tabla, su valor **sigue sumandose al total de EGRESOS**. Esto causa:

1. Los EGRESOS estan inflados por el viejo estimado de impuesto
2. El "Resultado de Membresia" sale mas bajo de lo que deberia
3. El "Resultado Neto" tambien baja
4. Luego se calcula el 30% sobre ese Resultado Neto ya reducido

Es decir, el impuesto se esta contando dos veces: una como gasto y otra como el 30% del resumen.

### Solucion

Forzar que "Impuesto de Renta Estimado" tenga valor 0 en la base 2026 y en todas las proyecciones, para que no afecte los totales de EGRESOS. El unico calculo de impuesto sera el 30% del Resultado Neto que ya se muestra en el resumen.

### Cambios Tecnicos

**Archivo:** `src/components/FinancialProjection2027.tsx`

1. Agregar `"Impuesto de Renta Estimado": { override: 0 }` en `BASE_2026_ADJUSTMENTS` para que la base 2026 sea cero
2. En la logica de proyeccion (donde se calculan los valores 2027-2029), forzar que "Impuesto de Renta Estimado" siempre proyecte 0 en todos los anios, sin importar el porcentaje de crecimiento aplicado

Esto garantiza que:
- Los EGRESOS reflejen solo gastos operativos reales
- El "Resultado de Membresia" y "Resultado Neto" sean correctos
- El impuesto de renta se calcule unicamente como el 30% del Resultado Neto en la seccion de resumen
