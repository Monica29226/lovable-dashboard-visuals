import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  financialData2026,
  formatCurrency2026,
  getIncomeExpensesChartData2026,
} from "@/data/financialData2026";

export const IncomeExpensesChart2026 = () => {
  const chartDataRaw = getIncomeExpensesChartData2026();
  const { income, expenses, netResult } = financialData2026.incomeStatement;

  const chartData = chartDataRaw.map(item => ({
    name: item.category,
    value: item.amount,
    color: item.color,
    details: item.details,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-xs">
          <p className="font-medium text-foreground mb-2">{data.name}</p>
          <p className="text-lg font-bold text-foreground mb-2">{formatCurrency2026(data.value)}</p>
          {data.details && (
            <div className="space-y-1">
              {data.details.map((d: any, i: number) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{d.name}:</span>
                  <span className="font-medium">{formatCurrency2026(d.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Estado de Resultados 2026
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ingresos vs Egresos - {financialData2026.period} (US$)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Table */}
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Resumen Detallado</h3>

              {/* Income */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-primary">Ingresos</span>
                  <span className="font-bold text-primary">{formatCurrency2026(income.total)}</span>
                </div>
                <div className="space-y-1 text-sm ml-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Cuotas Asociados</span>
                    <span>{formatCurrency2026(income.cuotasAsociados)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Comunidad</span>
                    <span>{formatCurrency2026(income.comunidad)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Ingreso Renta Diferido</span>
                    <span>{income.ingresoRentaDiferido > 0 ? formatCurrency2026(income.ingresoRentaDiferido) : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-accent">Egresos</span>
                  <span className="font-bold text-accent">{formatCurrency2026(expenses.total)}</span>
                </div>
                <div className="space-y-1 text-sm ml-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Personal</span>
                    <span>{formatCurrency2026(expenses.personal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Gastos Administrativos</span>
                    <span>{formatCurrency2026(expenses.gastosAdministrativos)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Viáticos y Giras</span>
                    <span>{formatCurrency2026(expenses.viaticosGiras)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Comunicación y Mercadeo</span>
                    <span>{formatCurrency2026(expenses.comunicacionMercadeo)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Servicios Profesionales</span>
                    <span>{formatCurrency2026(expenses.serviciosProfesionales)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Tecnología</span>
                    <span>{formatCurrency2026(expenses.tecnologia)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Otros Gastos / Patente / IVA</span>
                    <span>{formatCurrency2026(expenses.otrosGastosPatente)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Impuesto de Renta</span>
                    <span>{expenses.impuestoRenta > 0 ? formatCurrency2026(expenses.impuestoRenta) : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Net Result */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Ingresos menos Gastos</span>
                  <span className={`font-bold text-lg ${netResult >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency2026(netResult)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
