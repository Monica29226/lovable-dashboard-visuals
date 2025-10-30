import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

// Data for September 2025 only
const data2025 = {
  income: {
    cuotasAsociados: 195650,
    comunidad: 159214,
    otros: 0,
    total: 354864
  },
  expenses: {
    personal: 183774,
    gastosAdministrativos: 13690,
    viaticos: 23749,
    comunicacionMercadeo: 26029,
    serviciosProfesionales: 48429,
    otrosGastos: 7304,
    total: 302975
  },
  netResult: 51889
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
          Estado de Resultados
        </CardTitle>
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Septiembre 2025</p>
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
                  Septiembre
                </th>
              </tr>
            </thead>
            <tbody>
              {/* INGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-accent text-lg">Ingresos</td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Cuotas Asociados</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.income.cuotasAsociados)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Comunidad</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.income.comunidad)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Otros</td>
                <td className="p-3 border border-border text-right">-</td>
              </tr>
              
              <tr className="bg-accent/10">
                <td className="p-3 border border-border font-bold">Total ingresos</td>
                <td className="p-3 border border-border text-right font-bold text-accent">{formatCurrency(data2025.income.total)}</td>
              </tr>

              {/* EGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-secondary text-lg pt-6">Egresos</td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">1. Personal</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.personal)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">2. Gastos administrativos</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.gastosAdministrativos)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">3. Viáticos</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.viaticos)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">4. Comunicación y Mercadeo</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.comunicacionMercadeo)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">5. Servicios Profesionales</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.serviciosProfesionales)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">6. Otros Gastos</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.otrosGastos)}</td>
              </tr>
              
              <tr className="bg-secondary/10">
                <td className="p-3 border border-border font-bold">Total egresos</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">{formatCurrency(data2025.expenses.total)}</td>
              </tr>

              {/* RESULTADO NETO */}
              <tr className="bg-chart-3/20">
                <td className="p-3 border border-border font-bold text-lg">Ingresos menos Gastos</td>
                <td className="p-3 border border-border text-right font-bold text-chart-3 text-lg">{formatCurrency(data2025.netResult)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};