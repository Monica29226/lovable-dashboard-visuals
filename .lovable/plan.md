## Diagnóstico

Encontré tres causas principales:

1. **La app vuelve a Horizonte Positivo al recargar o entrar a QuickBooks**
   - `CompanyContext` selecciona automáticamente “Horizonte Positivo” antes de restaurar la empresa guardada.
   - Eso pisa la selección de “Agricola Lloronal” y por eso el panel vuelve a Horizonte.
   - En `QuickBooksOnline` también hay lógica que intenta seleccionar Horizonte si no hay empresa activa.

2. **La seguridad de pantallas admin está incompleta**
   - `Gestión de Usuarios` y `Empresas` hoy aparecen en el menú para todos.
   - Además, aunque se oculten del menú, conviene proteger también las rutas `/user-management` y `/empresas` para que un usuario no-admin no pueda entrar escribiendo la URL.
   - En la base actual, `monica@calderon.cr` sí tiene rol `admin`; los demás usuarios visibles no.

3. **El panel por empresa está a medio camino**
   - Horizonte muestra el panel completo fijo/curado.
   - Empresas distintas a Horizonte usan `CompanyQuickBooksDashboard`, pero ese componente hoy solo muestra Balance y Estado de Resultados resumidos.
   - Falta completar la pestaña de “Gráficos en tiempo real” para empresas conectadas a QuickBooks.

## Plan de implementación

### 1. Corregir la selección de empresa activa
- Ajustar `CompanyContext` para que el orden sea:
  1. cargar empresas disponibles para el usuario,
  2. intentar restaurar `selectedCompanyId` desde `localStorage`,
  3. si esa empresa todavía existe y el usuario tiene acceso, mantenerla,
  4. si no, elegir una empresa válida como fallback.
- Quitar la preferencia automática por “Horizonte Positivo” cuando ya existe una empresa guardada.
- Evitar que `QuickBooksOnline` vuelva a forzar Horizonte.
- Resultado esperado: si Monica selecciona “Agricola Lloronal”, el panel permanece en Agricola al navegar o recargar.

### 2. Reforzar navegación y acceso admin
- Crear/usar un guard de administración con estado de carga correcto.
- Mostrar en el menú lateral `Gestión de Usuarios` y `Empresas` solo cuando el usuario tenga rol `admin`.
- Proteger las rutas:
  - `/user-management`
  - `/empresas`
- Si un usuario no-admin intenta entrar directo por URL, mostrar acceso denegado o redirigir al panel.
- Mantener el resto del menú igual.

### 3. Completar el panel de empresas QuickBooks
- Mantener el comportamiento especial de Horizonte: panel completo existente.
- Para Agricola Lloronal y nuevas empresas:
  - mostrar Balance General desde `quickbooks_balance_sheet` filtrado por `company_id`,
  - mostrar Estado de Resultados desde `quickbooks_profit_loss` filtrado por `company_id`,
  - agregar una pestaña de gráficos en tiempo real usando los mismos datos sincronizados de QuickBooks.
- Agregar estados claros:
  - empresa desconectada,
  - conectada sin datos sincronizados,
  - cargando,
  - datos disponibles.

### 4. Revisar conexión QuickBooks desde Empresas
- Alinear el botón “Conectar con QuickBooks” de `/empresas` con el flujo OAuth existente y estable.
- Asegurar que antes de iniciar OAuth se seleccione la empresa correspondiente.
- Asegurar que el callback conserve `companyId` en `state` y actualice `realm_id` e `is_connected=true` para esa empresa específica.

### 5. Validación
- Verificar que:
  - Monica ve “Empresas” y “Gestión de Usuarios”.
  - Un usuario no-admin no las ve ni puede abrirlas directo.
  - Al seleccionar Agricola, el panel no vuelve a Horizonte.
  - Horizonte sigue mostrando sus pestañas completas.
  - Agricola/nuevas empresas muestran solo Balance, Estado de Resultados y Gráficos en tiempo real desde QuickBooks.
  - El flujo de conexión de QuickBooks queda asociado a la empresa seleccionada.