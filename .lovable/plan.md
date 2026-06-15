# Unificar "Panel Corporativo" y "Empresas" en una sola página

## Objetivo
Eliminar la confusión de tener dos páginas que listan las mismas empresas. Se fusionan en **una sola página con pestañas**: una para **supervisar** (resumen/monitoreo) y otra para **administrar** (CRUD + conexiones).

## Diseño de la página unificada

Nueva página única en `/empresas` (titulada **"Empresas"**) con dos pestañas usando el componente `Tabs` de shadcn:

```text
┌──────────────────────────────────────────────┐
│  Empresas                                      │
│  [ Resumen ]  [ Administración ]               │
├──────────────────────────────────────────────┤
│  (contenido según pestaña activa)              │
└──────────────────────────────────────────────┘
```

### Pestaña 1 — Resumen (monitoreo, solo lectura)
Contenido del actual `PanelCorporativo`:
- Tarjetas: empresas activas, conectadas a QuickBooks, gestionadas por Excel, info actualizada, pendientes.
- Tabla: empresa, responsable, fuente de datos, última actualización, estado de información.
- Clic en una fila → abre el dashboard de esa empresa (`selectCompany` + navegar a `/`).

### Pestaña 2 — Administración (configuración)
Contenido del actual `Empresas`:
- Botón **Agregar empresa** (diálogo de creación).
- Tabla: nombre, Realm ID, estado de conexión.
- Acciones: conectar QuickBooks, subir Excel, activar/desactivar.

## Control de acceso
- La página unificada queda en `/empresas` protegida por `AdminRoute` (solo admin) **por defecto**.
- Como el Panel Corporativo hoy lo ve también el **contador** (`StaffRoute`), para no quitarle acceso:
  - La pestaña **Resumen** se muestra a admin y contador.
  - La pestaña **Administración** solo se muestra/renderiza para **admin**.
  - Por eso la ruta `/empresas` cambiará de `AdminRoute` a `StaffRoute`, y el contenido administrativo se oculta internamente con `useIsAdmin`/`useUserRole`. Así el contador entra y solo ve Resumen.

## Cambios técnicos
1. **`src/pages/Empresas.tsx`**: convertirla en la página contenedora con `Tabs`. Integrar el contenido de creación/gestión en la pestaña "Administración" (condicionada a admin).
2. **Nuevo componente** `src/components/empresas/ResumenTab.tsx` (o mover la lógica de `PanelCorporativo` ahí) para la pestaña "Resumen".
3. **`src/pages/PanelCorporativo.tsx`**: eliminar (su contenido se reutiliza en la pestaña Resumen).
4. **`src/App.tsx`**:
   - Quitar la ruta `/panel-corporativo`.
   - Cambiar `/empresas` de `AdminRoute` a `StaffRoute`.
   - Para no romper enlaces viejos, agregar un redirect de `/panel-corporativo` → `/empresas`.
5. **`src/components/AppSidebar.tsx`**:
   - Quitar `staffMenuItem` (Panel Corporativo) y la entrada "Empresas" de `adminMenuItems`.
   - Agregar una única entrada **"Empresas"** visible para staff (admin + contador), apuntando a `/empresas`.

## Resultado
- Una sola entrada en el menú: **Empresas**.
- Admin ve ambas pestañas (Resumen + Administración); contador ve solo Resumen.
- Se elimina la duplicación y la confusión, sin perder ninguna funcionalidad.
