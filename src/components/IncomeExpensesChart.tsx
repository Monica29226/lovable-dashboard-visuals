import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  incomeStatementData, 
  getIncomeExpensesChartData, 
  getNetResult, 
  formatCurrency 
} from "@/data/incomeStatementData";

export const IncomeExpensesChart = () => {
  const { t } = useLanguage();
  const incomeExpensesData = getIncomeExpensesChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const categoryData = incomeExpensesData.find(item => 
        t('language') === 'es' ? item.category === label : item.categoryEn === label
      );
      
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-xs">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <p className="text-lg font-bold text-foreground mb-2">
            {formatCurrency(data.value)}
          </p>
          {categoryData && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Detalle:</p>
              {categoryData.details.map((detail, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{detail.name}:</span>
                  <span className="font-medium">{formatCurrency(detail.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const chartData = incomeExpensesData.map(item => ({
    name: t('language') === 'es' ? item.category : item.categoryEn,
    value: item.amount,
    color: item.color
  }));

  const netResult = getNetResult();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Estado de Resultados 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ingresos vs Egresos - {incomeStatementData.period} (US$)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
              
              {/* Income Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-primary">Ingresos</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(incomeStatementData.income.total)}
                  </span>
                </div>
                <div className="space-y-1 text-sm ml-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Cuotas Asociados</span>
                    <span>{formatCurrency(incomeStatementData.income.cuotasAsociados)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Comunidad</span>
                    <span>{formatCurrency(incomeStatementData.income.comunidad)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-accent">Egresos</span>
                  <span className="font-bold text-accent">
                    {formatCurrency(incomeStatementData.expenses.total)}
                  </span>
                </div>
                <div className="space-y-1 text-sm ml-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Personal</span>
                    <span>{formatCurrency(incomeStatementData.expenses.personal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Gastos Administrativos</span>
                    <span>{formatCurrency(incomeStatementData.expenses.gastosAdministrativos)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Viáticos y Giras</span>
                    <span>{formatCurrency(incomeStatementData.expenses.viaticos)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Comunicación y Mercadeo</span>
                    <span>{formatCurrency(incomeStatementData.expenses.comunicacionEventos)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Servicios Profesionales</span>
                    <span>{formatCurrency(incomeStatementData.expenses.serviciosProfesionales)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Otros Gastos</span>
                    <span>{formatCurrency(incomeStatementData.expenses.otrosGastos)}</span>
                  </div>
                </div>
              </div>

              {/* Net Result */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Resultado Neto</span>
                  <span className={`font-bold text-lg ${netResult > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {formatCurrency(netResult)}
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