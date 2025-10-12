import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

// Comparative data 2024 vs 2025
const comparativeData = {
  income: {
    cuotasAsociados: { 2024: 120000, 2025: 209067 },
    proyectos: { 2024: 194914, 2025: 145797 },
    otros: { 2024: 0, 2025: 0 },
    total: { 2024: 314914, 2025: 354864 }
  },
  expenses: {
    personal: { 2024: 150000, 2025: 183774 },
    gastosAdministrativos: { 2024: 15000, 2025: 13690 },
    viaticos: { 2024: 18000, 2025: 23749 },
    comunicacionEventos: { 2024: 16000, 2025: 26029 },
    tecnologia: { 2024: 10661, 2025: 48429 },
    total: { 2024: 209661, 2025: 302975 }
  },
  netResult: { 2024: 105253, 2025: 51889 }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const calculatePercentage = (value: number, total: number) => {
  return ((value / total) * 100).toFixed(1);
};

const calculateVariation = (current: number, previous: number) => {
  return (((current - previous) / previous) * 100).toFixed(1);
};

export const ComparativeIncomeStatement = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground text-center">
          Asociación Horizonte Positivo
        </CardTitle>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">
            Estado de Resultados Comparativo
          </h3>
          <p className="text-sm text-muted-foreground">Valores en US$</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 border border-border font-semibold"></th>
                <th className="text-center p-3 border border-border font-semibold text-primary">
                  2024
                </th>
                <th className="text-center p-3 border border-border font-semibold text-primary">
                  %
                </th>
                <th className="text-center p-3 border border-border font-semibold text-secondary">
                  2025
                </th>
                <th className="text-center p-3 border border-border font-semibold text-secondary">
                  %
                </th>
                <th className="text-center p-3 border border-border font-semibold text-chart-4">
                  Variación %
                </th>
              </tr>
            </thead>
            <tbody>
              {/* INGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-primary text-lg">INGRESOS</td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Cuotas Asociados</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.income.cuotasAsociados[2024])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.income.cuotasAsociados[2024], comparativeData.income.total[2024])}%</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.income.cuotasAsociados[2025])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.income.cuotasAsociados[2025], comparativeData.income.total[2025])}%</td>
                <td className="p-3 border border-border text-right text-chart-4 font-semibold">
                  {calculateVariation(comparativeData.income.cuotasAsociados[2025], comparativeData.income.cuotasAsociados[2024])}%
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Proyectos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.income.proyectos[2024])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.income.proyectos[2024], comparativeData.income.total[2024])}%</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.income.proyectos[2025])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.income.proyectos[2025], comparativeData.income.total[2025])}%</td>
                <td className="p-3 border border-border text-right text-chart-4 font-semibold">
                  {calculateVariation(comparativeData.income.proyectos[2025], comparativeData.income.proyectos[2024])}%
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Otros</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
              </tr>
              
              <tr className="bg-primary/10">
                <td className="p-3 border border-border font-bold text-primary">Total Ingresos</td>
                <td className="p-3 border border-border text-right font-bold text-primary">{formatCurrency(comparativeData.income.total[2024])}</td>
                <td className="p-3 border border-border text-right font-bold text-primary">100.0%</td>
                <td className="p-3 border border-border text-right font-bold text-primary">{formatCurrency(comparativeData.income.total[2025])}</td>
                <td className="p-3 border border-border text-right font-bold text-primary">100.0%</td>
                <td className="p-3 border border-border text-right font-bold text-chart-4">
                  {calculateVariation(comparativeData.income.total[2025], comparativeData.income.total[2024])}%
                </td>
              </tr>

              {/* EGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-secondary text-lg pt-6">EGRESOS</td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Personal</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.personal[2024])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.personal[2024], comparativeData.expenses.total[2024])}%</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.personal[2025])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.personal[2025], comparativeData.expenses.total[2025])}%</td>
                <td className="p-3 border border-border text-right text-chart-4 font-semibold">
                  {calculateVariation(comparativeData.expenses.personal[2025], comparativeData.expenses.personal[2024])}%
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Gastos Administrativos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.gastosAdministrativos[2024])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.gastosAdministrativos[2024], comparativeData.expenses.total[2024])}%</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.gastosAdministrativos[2025])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.gastosAdministrativos[2025], comparativeData.expenses.total[2025])}%</td>
                <td className="p-3 border border-border text-right text-chart-4 font-semibold">
                  {calculateVariation(comparativeData.expenses.gastosAdministrativos[2025], comparativeData.expenses.gastosAdministrativos[2024])}%
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Viáticos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.viaticos[2024])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.viaticos[2024], comparativeData.expenses.total[2024])}%</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.viaticos[2025])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.viaticos[2025], comparativeData.expenses.total[2025])}%</td>
                <td className="p-3 border border-border text-right text-chart-4 font-semibold">
                  {calculateVariation(comparativeData.expenses.viaticos[2025], comparativeData.expenses.viaticos[2024])}%
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Comunicación y Eventos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.comunicacionEventos[2024])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.comunicacionEventos[2024], comparativeData.expenses.total[2024])}%</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.comunicacionEventos[2025])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.comunicacionEventos[2025], comparativeData.expenses.total[2025])}%</td>
                <td className="p-3 border border-border text-right text-chart-4 font-semibold">
                  {calculateVariation(comparativeData.expenses.comunicacionEventos[2025], comparativeData.expenses.comunicacionEventos[2024])}%
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Tecnología</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.tecnologia[2024])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.tecnologia[2024], comparativeData.expenses.total[2024])}%</td>
                <td className="p-3 border border-border text-right">{formatCurrency(comparativeData.expenses.tecnologia[2025])}</td>
                <td className="p-3 border border-border text-right">{calculatePercentage(comparativeData.expenses.tecnologia[2025], comparativeData.expenses.total[2025])}%</td>
                <td className="p-3 border border-border text-right text-chart-4 font-semibold">
                  {calculateVariation(comparativeData.expenses.tecnologia[2025], comparativeData.expenses.tecnologia[2024])}%
                </td>
              </tr>
              
              <tr className="bg-secondary/10">
                <td className="p-3 border border-border font-bold text-secondary">Total Egresos</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">{formatCurrency(comparativeData.expenses.total[2024])}</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">100.0%</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">{formatCurrency(comparativeData.expenses.total[2025])}</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">100.0%</td>
                <td className="p-3 border border-border text-right font-bold text-chart-4">
                  {calculateVariation(comparativeData.expenses.total[2025], comparativeData.expenses.total[2024])}%
                </td>
              </tr>

              {/* RESULTADO NETO */}
              <tr className="bg-chart-5/20">
                <td className="p-3 border border-border font-bold text-chart-5 text-lg">Ingresos menos Gastos</td>
                <td className="p-3 border border-border text-right font-bold text-chart-5 text-lg">{formatCurrency(comparativeData.netResult[2024])}</td>
                <td className="p-3 border border-border text-right font-bold text-chart-5">
                  {calculatePercentage(comparativeData.netResult[2024], comparativeData.income.total[2024])}%
                </td>
                <td className="p-3 border border-border text-right font-bold text-chart-5 text-lg">{formatCurrency(comparativeData.netResult[2025])}</td>
                <td className="p-3 border border-border text-right font-bold text-chart-5">
                  {calculatePercentage(comparativeData.netResult[2025], comparativeData.income.total[2025])}%
                </td>
                <td className="p-3 border border-border text-right font-bold text-chart-4">
                  {calculateVariation(comparativeData.netResult[2025], comparativeData.netResult[2024])}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};