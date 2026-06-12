# Plan: Empresas con Excel o QuickBooks + aislamiento total por cliente

## Objetivo
Permitir crear una empresa y alimentarla de **dos formas**: subiendo un **Excel** (lectura inteligente/flexible) o conectándola a **QuickBooks**. A partir de los datos, mostrar un **dashboard unificado** (Balance + Estado de Resultados + reportes). Garantizar que **cada empresa esté aislada** y que un **usuario cliente solo vea su propia empresa**. Empezamos con **Andrea Castro** (crear la empresa y un usuario que solo la vea).

---

## Problema crítico de seguridad encontrado
El trigger `handle_new_user` asigna automáticamente **todas** las empresas (menos Horizonte) a cada usuario nuevo. Hoy, un usuario nuevo vería empresas ajenas. Esto rompe el aislamiento y debe corregirse.

---

## Cambios

### 1. Base de datos (migraciones)
- **Corregir aislamiento**: reescribir `handle_new_user` para que solo cree el `profile` y el rol `user` por defecto, **sin** asignar ninguna empresa. La asignación empresa↔usuario pasa a ser **explícita** por el admin.
- **Nueva fuente de datos**: agregar columna `data_source` a `quickbooks_companies` con valores `quickbooks` o `excel` (default `quickbooks`).
- **Datos de Excel**: reutilizar las tablas existentes `quickbooks_balance_sheet` y `quickbooks_profit_loss` (ya tienen `company_id`, totales y `raw_data` jsonb), de modo que el dashboard funcione igual sin importar la fuente. Como el Excel **reemplaza**, cada carga borra las filas previas de esa empresa antes de insertar.
- **Storage**: crear bucket privado `company-uploads` para guardar los Excel originales, con políticas RLS en `storage.objects` que permitan acceso solo a admins y a la función de servicio.
- Revisar que las políticas RLS de balance/P&L sigan basadas en `user_has_company_access(company_id)` (ya lo están) — eso asegura que cada usuario solo lea su empresa.

### 2. Carga inteligente de Excel (edge function `parse-company-excel`)
- Recibe `companyId` + archivo Excel (validación admin + Zod).
- Convierte el Excel a texto/tablas y usa **Lovable AI** (`LOVABLE_API_KEY`, sin costo de llave externa) para **detectar de forma flexible** las cuentas y totales: Activos, Pasivos, Patrimonio (Balance) e Ingresos, Gastos, Utilidad Neta + detalle de cuentas (Estado de Resultados), junto con la fecha/periodo.
- Borra los datos previos de esa empresa (reemplazo) y guarda los totales + el detalle en `raw_data`.
- Marca `data_source = 'excel'` en la empresa.

### 3. UI de creación de empresa (`src/pages/Empresas.tsx`)
- En "Nueva empresa", elegir **fuente de datos**:
  - **QuickBooks** → pide Client ID / Secret (flujo actual).
  - **Excel** → crea la empresa y habilita subir el archivo.
- En la tabla de empresas, según la fuente: botón "Conectar con QuickBooks" o botón "Subir Excel" (con barra de progreso y resultado del análisis).

### 4. Gestión de usuarios aislada (`src/pages/UserManagement.tsx` + `admin-create-user`)
- Al crear un usuario, el admin **selecciona a qué empresa(s)** tiene acceso (para Andrea Castro: solo su empresa).
- `admin-create-user` inserta la fila correspondiente en `company_users` **únicamente** para las empresas elegidas.
- Permitir editar accesos de usuarios existentes (agregar/quitar empresas).

### 5. Dashboard unificado por empresa (`src/components/CompanyQuickBooksDashboard.tsx`)
- Ya lee `quickbooks_balance_sheet` y `quickbooks_profit_loss` por `company_id`, así que funciona con datos de Excel sin cambios de fondo.
- Mejoras de presentación: usar el detalle de cuentas de `raw_data` para los reportes (Balance y Estado de Resultados) y los gráficos en tiempo real, con el acento `--co` de la empresa.
- La etiqueta de fuente mostrará "QuickBooks" o "Excel" según corresponda.

### 6. Andrea Castro (primer caso)
- Crear empresa **Andrea Castro** con fuente **Excel**.
- Subir su Excel y verificar el dashboard.
- Crear un **usuario** para Andrea Castro con acceso **solo** a esa empresa.

---

## Verificación
1. Crear "Andrea Castro" (Excel) → subir Excel → el dashboard muestra Balance + Estado de Resultados correctos.
2. Crear usuario cliente de Andrea Castro → iniciar sesión → ve **solo** su empresa, sin selector de otras ni datos de Horizonte/Demo/Agricola.
3. Confirmar en BD que `company_users` del nuevo usuario tiene **únicamente** Andrea Castro.
4. Probar que un usuario existente no obtiene acceso automático a empresas nuevas.
5. Re-subir un Excel y confirmar que **reemplaza** los datos previos.

## Fuera de alcance
- No se toca Horizonte (mantiene su dashboard completo).
- No se modifican los reportes ni datos financieros de Horizonte.

## Detalles técnicos
- Reusar `user_has_company_access` (security definer) para RLS — ya cubre el aislamiento.
- Edge functions con `verify_jwt` por defecto, validación Zod, sin loguear datos sensibles.
- Lovable AI vía `LOVABLE_API_KEY` para el parseo flexible del Excel.
- Bucket `company-uploads` **privado**; acceso por signed URLs o vía service role en la función.
