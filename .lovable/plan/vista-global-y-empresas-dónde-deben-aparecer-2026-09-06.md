# Vista global y Empresas: dónde deben aparecer

## Qué está pasando hoy (verificado en el código)

- El menú muestra "Vista global" cuando el usuario ve al menos un grupo. Para el personal de ACL (admin y contador) la consulta de grupos devuelve **todos** los grupos del sistema, sin importar qué empresa esté seleccionada. Por eso, estando en Horizonte Positivo, aparece "Vista global" con el consolidado del Grupo Dr. Daniel.
- La Vista global no reacciona a la empresa seleccionada: siempre toma el primer grupo guardado, así que estando en Horizonte no muestra nada de ese cliente (Horizonte no pertenece a ningún grupo).
- "Empresas" es una pestaña propia del menú lateral, visible solo para personal de ACL.

## Cambios propuestos

1. **"Vista global" solo cuando corresponde**
   - Un cliente asignado a un grupo la ve siempre y entra por defecto ahí (sin cambios para el Grupo Dr. Daniel).
   - El personal de ACL la ve **solo cuando la empresa seleccionada pertenece a un grupo**. Al estar en Horizonte Positivo, la opción desaparece del menú.
   - El grupo mostrado pasa a ser el grupo de la empresa seleccionada, no el primero de la lista. Así el consolidado siempre corresponde al cliente que se está viendo.
   - Si alguien entra a la dirección de la vista global sin grupo aplicable, se le redirige al panel en vez de mostrar datos de otro cliente.

2. **Aislamiento de clientes**
   - Ningún cliente verá grupos ajenos: las reglas de acceso ya limitan a cada cliente a sus propios grupos y empresas; el cambio anterior evita además que el personal vea mezclados datos de un cliente mientras trabaja en otro.

3. **"Empresas" deja de ser pestaña propia**
   - Se quita del menú lateral y pasa a ser una pestaña dentro de **Configuración**, junto a Credenciales QuickBooks y Usuarios, visible solo para personal de ACL.
   - La dirección actual `/empresas` se mantiene redirigiendo a Configuración para no romper enlaces guardados.

## Detalle técnico

- `src/hooks/useBusinessGroups.ts`: separar "grupos del usuario" de "grupos visibles como staff"; exponer una función para resolver el grupo que contiene una empresa dada.
- `src/contexts/CompanyContext.tsx`: derivar `selectedGroupId` de la empresa seleccionada cuando el usuario es staff; mantener la apertura por defecto en vista global solo para miembros de grupo.
- `src/components/AppSidebar.tsx`: mostrar `Vista global` según la nueva condición; eliminar el ítem `Empresas`.
- `src/pages/VistaGlobal.tsx`: redirigir cuando no hay grupo aplicable.
- `src/pages/Settings.tsx`: nueva pestaña "Empresas" que monta el componente existente `src/pages/Empresas.tsx` (sin duplicarlo).
- `src/App.tsx`: `/empresas` pasa a redirigir a `/settings`.

Sin cambios en base de datos, permisos ni en los paneles existentes.
