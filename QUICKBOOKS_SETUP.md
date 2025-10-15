# Configuración de QuickBooks Integration

## Configuración completada ✅

1. **Base de datos**: Tablas creadas para almacenar datos de QuickBooks
2. **Edge Functions**: Funciones para OAuth y sincronización de datos
3. **Secrets**: Client ID y Client Secret configurados
4. **Frontend**: Componentes y rutas para la conexión

## Próximos pasos para activar la integración

### 1. Agregar el Client ID al frontend

Crea un archivo `.env` en la raíz del proyecto con:

```
VITE_QUICKBOOKS_CLIENT_ID=tu_client_id_aquí
```

### 2. Configurar la URL de redirección en QuickBooks

Ve a tu app en https://developer.intuit.com/app/developer/dashboard y:

1. Ve a "Keys & credentials"
2. En "Redirect URIs", agrega:
   - `https://tu-dominio.lovable.app/quickbooks-callback` (para producción)
   - `http://localhost:8080/quickbooks-callback` (para desarrollo)

### 3. Configurar sincronización automática (opcional)

Para sincronizar automáticamente cada hora, puedes usar Supabase cron jobs:

```sql
SELECT cron.schedule(
  'quickbooks-hourly-sync',
  '0 * * * *', -- Cada hora
  $$
  SELECT net.http_post(
    url:='https://flwcasyydljhrjlrtzlz.supabase.co/functions/v1/quickbooks-sync',
    headers:='{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);
```

## Uso

1. **Conectar QuickBooks**: 
   - Ve a la pestaña "QuickBooks" en el dashboard
   - Click en "Conectar QuickBooks"
   - Autoriza la aplicación en QuickBooks
   - Los datos se sincronizarán automáticamente

2. **Sincronizar manualmente**:
   - Click en "Sincronizar Ahora" en cualquier momento

## Datos sincronizados

La integración sincroniza:
- ✅ Facturas (Invoices)
- ✅ Gastos (Expenses)
- ✅ Clientes (Customers)
- ✅ Reporte de P&L (Profit & Loss)
- ✅ Balance General (Balance Sheet)
- ✅ Presupuestos (Budgets)

## Troubleshooting

### "No valid access token available"
- Asegúrate de haber completado el proceso de conexión
- Verifica que los secrets estén configurados correctamente en Lovable Cloud

### "Failed to exchange code for tokens"
- Verifica que el Client ID y Secret sean correctos
- Asegúrate de que la URL de redirección esté configurada en QuickBooks

### Logs
Puedes ver los logs de las funciones en:
<lov-actions>
  <lov-open-backend>Ver Backend y Logs</lov-open-backend>
</lov-actions>
