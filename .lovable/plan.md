# ACL Contable Cloud — Plan por Fases

Tu plataforma ya tiene la base multiempresa (QuickBooks + Excel, aislamiento por `company_users` + RLS, branding ACL, dashboard por empresa). Construimos sobre eso, sin romper Horizonte ni las empresas actuales.

Decisiones confirmadas: **Fase 1 = Panel Corporativo + ficha de empresa**, Microsoft 365 vía conector Lovable, **3 roles (Admin, Contador, Cliente)**, documentos en **OneDrive/SharePoint**.

---

## FASE 1 — Panel Corporativo + Ficha de Empresa (esta entrega)

### 1. Ficha de empresa ampliada
Añadir a `quickbooks_companies` los campos de la ficha completa:

```text
razon_social, nombre_comercial, cedula_juridica, actividad_economica,
regimen_tributario, correo_principal, telefono, direccion,
representante_legal, moneda_funcional, responsable_user_id, is_active
```

- `Empresas.tsx`: el diálogo "Nueva empresa" pasa a un formulario por secciones (Información General → Fuente de Datos → Responsable), manteniendo el selector Excel/QuickBooks existente.
- Acción de **editar** y **activar/desactivar** cada empresa desde la tabla.
- `admin-create-company` y un nuevo `admin-update-company` guardan/actualizan estos campos.

### 2. Rol Contador
- Ampliar el enum `app_role` a `admin | contador | cliente` (manteniendo compat con `user` actual → tratado como cliente).
- `responsable_user_id` apunta al contador asignado.
- Asignación de rol en `UserManagement.tsx` (selector de rol) y asignación de empresas (ya existe el checklist).
- RLS: el contador ve solo empresas asignadas vía `company_users` (la función `user_has_company_access` ya lo soporta); el admin ve todo.

### 3. Panel Corporativo ACL (nueva página `/panel-corporativo`, solo admin/contador)
Vista consolidada de todas las empresas accesibles:

- **Tarjetas indicadoras**: total empresas activas, conectadas a QuickBooks, gestionadas por Excel, con info actualizada, con info pendiente.
- **Tabla principal**: Empresa · Responsable · Fuente de datos · Última actualización · Último reporte · Estado de información (con badges de color).
- "Estado de información" derivado de la última sincronización QB / última carga Excel: `Actualizada` (<30 días), `Requiere actualización`, `Sin info reciente`.
- Clic en una fila → selecciona la empresa y abre su dashboard.
- Entrada en el sidebar (icono `LayoutDashboard`) visible solo para admin/contador.

### 4. Preparar Microsoft 365
- Vincular el conector Microsoft (Outlook / OneDrive / SharePoint / Teams) vía el conector de Lovable para dejar los secrets listos. Aún no se construyen los módulos; solo queda disponible para Fase 3.

### Verificación Fase 1
Crear/editar una empresa con ficha completa → asignar un contador → el Panel Corporativo muestra todas las empresas con su estado → un cliente sigue viendo solo su empresa (sin acceso al panel corporativo) → la conexión M365 queda enlazada.

---

## Roadmap siguientes fases (resumen, no se construyen ahora)

**Fase 2 — Reportes + Centro Tributario**
- Reportes financieros dinámicos (Balance, Resultados, Flujo) con filtros (fecha, año, mes, moneda) y exportación PDF/Excel.
- Centro Tributario: tabla `tax_filings` (IVA: ventas/compras gravadas-exentas, crédito/débito, IVA por pagar; estados Pendiente/Revisión/Presentado) + calendario de obligaciones con alertas 30/15/7/1 días.

**Fase 3 — Microsoft 365**
- Centro Documental sobre OneDrive/SharePoint (carpetas sugeridas por empresa, versiones, historial) vía gateway del conector.
- Centro de Correos (Outlook) clasificados por empresa.
- Notificaciones a Microsoft Teams.

**Fase 4 — ACL Financial Assistant (IA)**
- Asistente con Lovable AI: análisis de estados financieros, variaciones entre periodos, comentarios ejecutivos, Q&A. Edge function con `LOVABLE_API_KEY`, alcance limitado a la empresa seleccionada.

**Fase 5 — Portal del Cliente + Alertas + MFA**
- Vista cliente pulida (solo su empresa) y centro de alertas automáticas (QB sin sincronizar, Excel desactualizado, obligaciones próximas, documentos faltantes).
- MFA y auditoría de accesos.

---

## Notas técnicas (Fase 1)
- Migración: `ALTER TYPE app_role ADD VALUE 'contador'` y `'cliente'`; `ALTER TABLE quickbooks_companies ADD COLUMN ...` para los campos de ficha + `is_active boolean default true` + `responsable_user_id uuid`.
- GRANTs ya existen en las tablas; solo se añaden columnas (no requieren nuevos grants).
- Edge functions nuevas/editadas: `admin-update-company` (nuevo), `admin-create-company` (ampliado). JWT + Zod + verificación de rol admin, siguiendo el patrón dual-client existente.
- Sin cambios a la lógica financiera de Horizonte; solo se amplían estructura y navegación.
- El Panel Corporativo respeta RLS: las queries usan el cliente del usuario, así un contador solo agrega sus empresas asignadas.