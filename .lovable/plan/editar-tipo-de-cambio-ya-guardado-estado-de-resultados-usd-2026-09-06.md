# Editar tipo de cambio ya guardado (Estado de Resultados USD)

## Problema
En la fila "Tipo de cambio (venta)" del Estado de Resultados (USD), cuando un mes ya tiene tipo de cambio guardado, el valor se muestra como texto fijo (ej. `443.51`) y no hay forma de modificarlo. Solo los meses sin tipo de cambio muestran el campo de entrada y el botón Guardar.

## Cambio (solo en `src/components/IncomeStatementUSD.tsx`)

1. **Editar tipos guardados**: cuando el mes ya tiene tipo de cambio guardado y el usuario es personal de ACL (`isStaff`), el valor se muestra con un icono de lápiz (Lucide `Pencil`, trazo fino) al lado. Al hacer clic, la celda cambia al campo de entrada precargado con el valor actual y el botón Guardar, permitiendo corregirlo.
2. **Guardar = actualizar**: el guardado ya usa `upsert` sobre `exchange_rates` (`onConflict: 'rate_date'`), por lo que sobrescribe el valor existente sin necesidad de cambios en base de datos. Al guardar, la celda vuelve a mostrar el valor actualizado y los montos en USD se recalculan automáticamente (ya funcionan con el estado local).
3. **Cancelar**: junto al campo de edición aparece un botón pequeño (icono `X`) para salir sin guardar cambios.
4. **Sin cambios para clientes**: los usuarios que no son personal siguen viendo el valor como texto de solo lectura, igual que hoy.

## Notas técnicas
- Estado nuevo mínimo: `editingRate: string | null` (fecha del mes en edición); al entrar en edición se precarga `rateInputs[rateDate]` con el valor guardado.
- No se tocan permisos, tablas ni otras pantallas. El guardado por mes y el recálculo de totales ya existentes se reutilizan tal cual.
