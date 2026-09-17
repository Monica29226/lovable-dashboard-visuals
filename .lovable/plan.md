# Rediseño de la vista ejecutiva por empresa

## Alcance
- Modificar únicamente `ExecutiveOnePager` y los dos módulos compartidos que sostienen su perfil fiscal y formato.
- Mantener los hooks, el motor de proyección, el diálogo de créditos y el acordeón de cálculo existentes.
- No cambiar otras páginas, navegación, lateral, tablas, permisos ni funciones del backend.

## Implementación
1. Resolver el perfil fiscal desde la configuración de cada empresa y período, sin perfil predeterminado cuando no exista configuración.
2. Aplicar automáticamente el perfil general o pyme según la renta bruta proyectada y el umbral configurado; conservar el umbral legal indicado solo como respaldo cuando la configuración no lo incluya.
3. Incorporar el selector de tipo de contribuyente al diálogo y persistirlo con el flujo existente.
4. Solicitar el año anterior completo con la misma consulta actual y usarlo para comparaciones de meses equivalentes y el cierre anual previo.
5. Reorganizar la vista en cuatro pestañas: Resumen, Ingresos, Gastos e Impuestos, con las tarjetas, líneas, barras, progreso y desglose fiscal solicitados.
6. Ajustar los formateadores de esta vista a montos completos con coma, sin símbolo por cifra, negativos entre paréntesis y porcentajes con coma decimal.
7. Validar compilación y revisar los datos fiscales de Dento Plus para confirmar perfil, tarifa, pagos parciales y retenciones sin exponer datos de otros clientes.

## Criterios de validación
- Sin configuración fiscal se muestra “Pendiente de configuración”, nunca cero ni un perfil supuesto.
- Las comparaciones previas desaparecen cuando no existen datos.
- La renta actual se prorratea por meses cerrados y la proyección anual conserva el cálculo existente.
- Dento Plus utiliza el perfil societario correcto y refleja los créditos fiscales guardados.
