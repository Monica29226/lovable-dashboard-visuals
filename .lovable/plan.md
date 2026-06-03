## Objetivo

Convertir el panel en verdaderamente multiempresa, arreglando los problemas reales detectados:

1. El selector de empresas falla en silencio por permisos de base de datos (por eso "Agricola Lloronal" no aparece y todo sigue mostrando Horizonte).
2. "Agricola Lloronal" está correctamente registrada pero **desconectada** porque aún no se completó el flujo de QuickBooks.
3. El panel financiero hoy muestra datos fijos de Horizonte y no cambia al elegir otra empresa.
4. El acceso a Horizonte debe quedar solo para tu cuenta (monica@calderon.cr) y gabriel.cordero.

---

## Parte 1 — Arreglar visibilidad de empresas (causa del bug)

La consola muestra `permission denied for function user_has_company_access`. La política de seguridad de la tabla de empresas usa funciones internas a las que el usuario no tiene permiso de ejecución, y la tabla no tiene permisos de lectura para usuarios autenticados.

Migración de base de datos para:
- Dar permiso de ejecución sobre `private.user_has_company_access` y `private.has_role` a los usuarios autenticados.
- Dar permiso de lectura (y de actualización del estado de conexión) sobre la tabla de empresas a los usuarios autenticados.

Resultado: el selector y la página "Empresas" cargarán la lista completa, incluyendo Agricola Lloronal.

## Parte 2 — Restringir acceso a Horizonte Positivo

Hoy 4 usuarios tienen acceso a Horizonte (silvia, gabriel, alfredo, monica). Se quitará el acceso a alfredo@calderon.cr y silvia.carballo@crowe.cr, dejando únicamente:
- monica@calderon.cr (tú)
- gabriel.cordero@horizontepositivo.org

Nota: hoy, cada vez que se crea un usuario nuevo, el sistema lo asigna automáticamente a TODAS las empresas. Para que Horizonte siga restringida, se ajustará esa asignación automática para que los usuarios nuevos no obtengan Horizonte por defecto (el acceso a Horizonte se otorgará manualmente).

## Parte 3 — Panel financiero por empresa

El panel pasará a depender de la empresa seleccionada en el selector superior:

- **Horizonte Positivo**: mantiene exactamente el panel actual con sus datos curados (sin cambios de formato ni de cifras).
- **Cualquier otra empresa (ej. Agricola Lloronal)**: el panel mostrará sus datos reales tomados de su información sincronizada de QuickBooks (estado de posición financiera y estado de resultados). Mientras la empresa no esté conectada/sincronizada, se mostrará un estado vacío con un aviso de "Conecta esta empresa con QuickBooks para ver sus datos".
- El encabezado (hero) mostrará el nombre de la empresa seleccionada en lugar de "Horizonte Positivo" fijo.

## Parte 4 — Conexión de Agricola Lloronal

Su estado seguirá como "Desconectada" hasta completar el botón **"Conectar con QuickBooks"** en la página Empresas. Una vez completado el OAuth y sincronizados los datos, el panel de Agricola mostrará sus cifras. Verificaremos que el flujo de conexión guarde `realm_id` e `is_connected = true` para esa empresa.

---

## Detalles técnicos

- **Migración (Parte 1):**
  - `GRANT EXECUTE ON FUNCTION private.user_has_company_access(uuid), private.has_role(uuid, app_role) TO authenticated;`
  - `GRANT SELECT, UPDATE ON public.quickbooks_companies TO authenticated;` (manteniendo las políticas RLS existentes que ya limitan por empresa/rol).
- **Datos (Parte 2):** eliminar filas de `company_users` para Horizonte excepto las de monica y gabriel; modificar la función `handle_new_user` para excluir Horizonte de la asignación automática.
- **Panel (Parte 3):**
  - `Index2026.tsx` / `Index.tsx` leerán `selectedCompanyId` y `companies` desde `CompanyContext`.
  - Para Horizonte: render del panel actual basado en `financialData2026.ts`, `balanceSheetData.ts`, etc. (sin tocar cifras ni formato).
  - Para otras empresas: nuevos componentes/consultas que leen de `quickbooks_balance_sheet` y `quickbooks_profit_loss` filtrando por `company_id`, reutilizando el formato visual existente (mismas tarjetas/tablas KPI), con estado vacío cuando no haya datos.
  - El nombre del hero saldrá de `company.company_name`.
- **Conexión (Parte 4):** se reutiliza el flujo OAuth existente (`qb-auth` + callback). Solo se verificará que el callback persista `realm_id`/`is_connected` para el `company_id` correcto.

## Fuera de alcance

- No se modifican las cifras ni el formato del panel de Horizonte.
- No se cargan datos manuales de Agricola; provendrán de QuickBooks.
