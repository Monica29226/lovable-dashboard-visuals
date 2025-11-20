# Guía de Actualización de Datos Financieros

## 📊 Estado de Resultados (Income Statement)

Para actualizar los datos del Estado de Resultados que se muestran en el dashboard:

**Archivo:** `src/data/incomeStatementData.ts`

### Datos que puedes actualizar:

1. **Período**: Cambia el mes/año mostrado
   ```typescript
   period: 'Octubre 2025',
   periodEn: 'October 2025',
   ```

2. **Ingresos**:
   - `cuotasAsociados`: Cuotas de Asociados
   - `comunidad`: Comunidad
   - `otros`: Otros ingresos
   - `total`: Total de ingresos (actualiza automáticamente)

3. **Egresos**:
   - `personal`: Gastos de Personal
   - `gastosAdministrativos`: Gastos Administrativos
   - `viaticos`: Viáticos
   - `comunicacionEventos`: Comunicación y Eventos
   - `tecnologia`: Tecnología
   - `alquiler`: Alquiler
   - `serviciosProfesionales`: Servicios Profesionales
   - `impuestos`: Impuestos
   - `depreciacion`: Depreciación
   - `total`: Total de egresos (actualiza automáticamente)

### Componentes que se actualizarán automáticamente:
- ✅ Estado de Resultados 2025 (gráfico de pastel)
- ✅ Resumen detallado de ingresos y egresos
- ✅ Resultado neto

---

## 💰 Balance Sheet (Estado de Posición Financiera)

Para actualizar los datos del Balance Sheet:

**Archivo:** `src/data/balanceSheetData.ts`

### Datos que puedes actualizar:

1. **Activos** (assets):
   - Activos corrientes (current)
   - Activos no corrientes (nonCurrent)

2. **Pasivos** (liabilities):
   - Pasivos corrientes (current)

3. **Patrimonio** (equity):
   - Utilidades retenidas (retainedEarnings)
   - Ajuste de traducción (translationAdjustment)
   - Resultado del año (currentYearResult)
   - Total patrimonio (totalEquity)

### Componentes que se actualizarán automáticamente:
- ✅ Balance Sheet (Estado de Posición Financiera)
- ✅ Gráfico de Movimiento del Patrimonio
- ✅ Gráfico de Posición Financiera

---

## 🔄 Proceso de Actualización

1. Abre el archivo correspondiente en `src/data/`
2. Actualiza los valores numéricos
3. Guarda el archivo
4. Los cambios se reflejarán automáticamente en todos los componentes del dashboard

---

## ⚠️ Notas Importantes

- Los totales se calculan automáticamente en la mayoría de los casos
- Asegúrate de mantener el formato de los números (sin comas, usa puntos para decimales)
- Los valores deben estar en dólares (USD)

---

## 📝 Ejemplo de Actualización

### Antes:
```typescript
income: {
  cuotasAsociados: 195650,
  comunidad: 159214,
  ...
}
```

### Después:
```typescript
income: {
  cuotasAsociados: 200000,  // Actualizado
  comunidad: 165000,        // Actualizado
  ...
}
```

Todos los gráficos y tablas se actualizarán automáticamente con los nuevos valores.
