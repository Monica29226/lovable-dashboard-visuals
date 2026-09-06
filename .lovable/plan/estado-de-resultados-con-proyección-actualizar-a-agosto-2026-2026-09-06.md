# Estado de Resultados con Proyección — actualizar a agosto 2026

Sí, ya tengo la información: el detalle mes a mes que usted envió hace un momento incluye enero a agosto reales y la proyección de setiembre a diciembre. No necesita volver a subirla.

## Qué cambia

El cuadro hoy muestra "Real enero–julio + Proyección agosto–diciembre". Pasa a mostrar
**Real enero–agosto + Proyección setiembre–diciembre**, con el corte acumulado en agosto.

- Agosto se mueve de columna proyectada a columna real, con las cifras definitivas.
- Julio se corrige con las cifras finales del detalle enviado.
- Se recalculan los acumulados reales, el total proyectado setiembre–diciembre y el total del año.
- Se agrega la línea Depreciación y se conservan las líneas actuales (Representación, Eventos, etc.).
- La proyección de setiembre a diciembre queda tal como viene en su archivo; no se inventa ninguna cifra.

Cifras acumuladas resultantes a agosto: ingresos 272,918 · egresos 263,563 · resultado 9,354.
Total del año proyectado: ingresos 488,673 · egresos 378,187 · resultado 110,486.

## Detalle técnico

- `src/data/financialData2026.ts` → `projectionIncomeStatement2026`: se reemplazan los 12 valores
  mensuales de cada línea con el detalle real enero–agosto y la proyección setiembre–diciembre;
  se ajustan los presupuestos anuales por línea (Personal 223,079; Administrativos 20,493;
  Representación 24,000; Comunicación 6,885; Eventos 8,750; Servicios Profesionales 24,048;
  Tecnología 21,840; Impuestos 8,000; Otros 400; Depreciación 3,000).
- `src/components/IncomeStatementProjection2026.tsx`: `REAL_MONTHS` pasa de 7 a 8 y el subtítulo
  cambia a "Real Enero–Agosto + Proyección Setiembre–Diciembre". El resto del componente
  (colapsables, formato, columnas de variación) queda igual.
- Formato sin cambios: montos completos, coma de miles, sin decimales, negativos entre paréntesis.
