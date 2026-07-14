import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { HorizonteStatementDetail, horizonteFinancials } from "@/data/horizonteFinancialModel";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currencySign: 'accounting',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const ComparativeIncomeStatement = () => {
  const { t } = useLanguage();
  const statement = horizonteFinancials.statements["2025"];
  const data2025 = statement.detail as HorizonteStatementDetail;
  const netResult = statement.netResult;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground text-center">
          {t('incomeStatement')}
        </CardTitle>
        <div className="text-center">
          <p className="text-lg text-muted-foreground">{statement.period}</p>
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
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.income.cuotasAsociados ?? 0)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Membresía</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.income.membresia ?? 0)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Otros</td>
                <td className="p-3 border border-border text-right">-</td>
              </tr>
              
              <tr className="bg-accent/10">
                <td className="p-3 border border-border font-bold">{t('totalIncome')}</td>
                <td className="p-3 border border-border text-right font-bold text-accent">{formatCurrency(statement.income)}</td>
              </tr>

              {/* EGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-secondary text-lg pt-6">{t('expenses')}</td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">1. Personal</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.personal ?? 0)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">2. Gastos administrativos</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.gastosAdministrativos ?? 0)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">3. Viáticos</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.viaticos ?? data2025.expenses.viaticosGiras ?? 0)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">4. Comunicación y Mercadeo</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.comunicacionEventos ?? data2025.expenses.comunicacionMercadeo ?? 0)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">5. Servicios Profesionales</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.serviciosProfesionales ?? 0)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">6. Tecnología</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.tecnologia ?? 0)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">7. Otros Gastos / Patente / IVA</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.otrosGastosPatenteIVA ?? data2025.expenses.otrosGastosPatente ?? 0)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">8. Otros Gastos</td>
                <td className="p-3 border border-border text-right">-</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">9. Depreciación</td>
                <td className="p-3 border border-border text-right font-semibold">-</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">10. Impuesto de Renta</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(data2025.expenses.impuestoRenta ?? 0)}</td>
              </tr>
              
              <tr className="bg-secondary/10">
                <td className="p-3 border border-border font-bold">{t('totalExpenses')}</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">{formatCurrency(statement.expenses)}</td>
              </tr>

              {/* RESULTADO NETO */}
              <tr className="bg-chart-3/20">
                <td className="p-3 border border-border font-bold text-lg">{t('netIncome')}</td>
                <td className="p-3 border border-border text-right font-bold text-chart-3 text-lg">{formatCurrency(netResult)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
