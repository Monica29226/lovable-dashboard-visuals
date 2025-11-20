import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

// Data for October 2025 only
const data2025 = {
  income: {
    cuotasAsociados: 200650,
    comunidad: 215527,
    otros: 0,
    total: 414177
  },
  expenses: {
    personal: 200569,
    gastosAdministrativos: 15945,
    viaticos: 30093,
    comunicacionMercadeo: 27027,
    serviciosProfesionales: 27030,
    tecnologia: 25982,
    impuestos: 5605,
    depreciacion: 2492,
    otrosGastos: 0,
    total: 334743
  },
  netResult: 81434
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
          {t('incomeStatement')}
        </CardTitle>
        <div className="text-center">
          <p className="text-lg text-muted-foreground">{t('october')} 2025</p>
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
                  {t('october')}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* INGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-accent text-lg">{t('income')}</td>
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
                <td className="p-3 border border-border font-bold">{t('totalIncome')}</td>
                <td className="p-3 border border-border text-right font-bold text-accent">{formatCurrency(data2025.income.total)}</td>
              </tr>

              {/* EGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-secondary text-lg pt-6">{t('expenses')}</td>
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
                <td className="p-3 border border-border pl-6">6. Tecnología</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.tecnologia)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">7. Impuestos</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.impuestos)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">8. Otros Gastos</td>
                <td className="p-3 border border-border text-right">-</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">9. Depreciación</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.depreciacion)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">10. Impuesto de Renta</td>
                <td className="p-3 border border-border text-right">-</td>
              </tr>
              
              <tr className="bg-secondary/10">
                <td className="p-3 border border-border font-bold">{t('totalExpenses')}</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">{formatCurrency(data2025.expenses.total)}</td>
              </tr>

              {/* RESULTADO NETO */}
              <tr className="bg-chart-3/20">
                <td className="p-3 border border-border font-bold text-lg">{t('netIncome')}</td>
                <td className="p-3 border border-border text-right font-bold text-chart-3 text-lg">{formatCurrency(data2025.netResult)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};