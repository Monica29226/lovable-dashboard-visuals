import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";

// Datos del Estado de Resultados por Proyecto (Agosto 2025)
const projectData = {
  income: {
    memberFees: {
      annuities: 135000,
      community: 0,
      total: 135000
    },
    projects: {
      annuities: 0,
      community: 148465,
      total: 148465
    },
    others: {
      annuities: 0,
      community: 0,
      total: 0
    },
    totalIncome: {
      annuities: 135000,
      community: 148465,
      total: 283465
    }
  },
  expenses: {
    personal: {
      annuities: 80521,
      community: 85499,
      total: 166021
    },
    administrative: {
      annuities: 1619,
      community: 102,
      total: 1721
    },
    representation: {
      annuities: 16991,
      community: 4768,
      total: 21760
    },
    communication: {
      annuities: 15127,
      community: 4921,
      total: 20049
    },
    rent: {
      annuities: 9697,
      community: 0,
      total: 9697
    },
    events: {
      annuities: 0,
      community: 0,
      total: 0
    },
    professional: {
      annuities: 20304,
      community: 0,
      total: 20304
    },
    technology: {
      annuities: 8878,
      community: 13713,
      total: 22591
    },
    taxes: {
      annuities: 4493,
      community: 0,
      total: 4493
    },
    otherExpenses: {
      annuities: 0,
      community: 0,
      total: 0
    },
    depreciation: {
      annuities: 1992,
      community: 0,
      total: 1992
    },
    totalExpenses: {
      annuities: 159622.36,
      community: 109004.09,
      total: 268626.45
    }
  },
  netResult: {
    annuities: -24622.36,
    community: 39460.58,
    total: 14838.22
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const calculateExecutionPercentage = (actual: number, budget: number) => {
  if (budget === 0) return 0;
  return Math.min(Math.round((actual / budget) * 100), 100);
};

export const ProjectIncomeStatement = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground text-center">
          Asociación Horizonte Positivo
        </CardTitle>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">
            Estado de Resultados por Proyecto
          </h3>
          <p className="text-lg text-muted-foreground">Agosto 2025</p>
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
                  Anualidades<br/>Agosto
                </th>
                <th className="text-center p-3 border border-border font-semibold text-secondary">
                  Comunidad<br/>Agosto
                </th>
                <th className="text-center p-3 border border-border font-semibold text-foreground">
                  Total
                </th>
                <th className="text-center p-3 border border-border font-semibold text-chart-4">
                  % Ejecución
                </th>
              </tr>
            </thead>
            <tbody>
              {/* INGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-primary">Ingresos</td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Cuotas Asociados</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.income.memberFees.annuities)}</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.income.memberFees.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={85} className="flex-1" />
                    <span className="text-sm font-semibold">85%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Proyectos</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.income.projects.community)}</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.income.projects.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={92} className="flex-1" />
                    <span className="text-sm font-semibold">92%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Otros</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right font-semibold">-</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={0} className="flex-1" />
                    <span className="text-sm font-semibold">0%</span>
                  </div>
                </td>
              </tr>
              
              <tr className="bg-primary/10">
                <td className="p-3 border border-border font-bold">Total ingresos</td>
                <td className="p-3 border border-border text-right font-bold">{formatCurrency(projectData.income.totalIncome.annuities)}</td>
                <td className="p-3 border border-border text-right font-bold">{formatCurrency(projectData.income.totalIncome.community)}</td>
                <td className="p-3 border border-border text-right font-bold text-primary">{formatCurrency(projectData.income.totalIncome.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={88} className="flex-1" />
                    <span className="text-sm font-bold">88%</span>
                  </div>
                </td>
              </tr>

              {/* EGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-secondary pt-6">Egresos</td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">1. Personal</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.personal.annuities)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.personal.community)}</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.expenses.personal.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={78} className="flex-1" />
                    <span className="text-sm font-semibold">78%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">2. Gastos administrativos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.administrative.annuities)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.administrative.community)}</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.expenses.administrative.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={65} className="flex-1" />
                    <span className="text-sm font-semibold">65%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">3. Representación</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.representation.annuities)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.representation.community)}</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.expenses.representation.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={82} className="flex-1" />
                    <span className="text-sm font-semibold">82%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">4. Comunicación y Mercadeo</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.communication.annuities)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.communication.community)}</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.expenses.communication.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={89} className="flex-1" />
                    <span className="text-sm font-semibold">89%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6" style={{color: '#e91e63'}}>5. Alquiler Oficinas y Parqueos</td>
                <td className="p-3 border border-border text-right" style={{color: '#e91e63'}}>{formatCurrency(projectData.expenses.rent.annuities)}</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right font-semibold" style={{color: '#e91e63'}}>{formatCurrency(projectData.expenses.rent.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={67} className="flex-1" />
                    <span className="text-sm font-semibold">67%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6" style={{color: '#e91e63'}}>6. Eventos</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right font-semibold">-</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={0} className="flex-1" />
                    <span className="text-sm font-semibold">0%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">7. Servicios Profesionales</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.professional.annuities)}</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.expenses.professional.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={95} className="flex-1" />
                    <span className="text-sm font-semibold">95%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">8. Tecnología</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.technology.annuities)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.technology.community)}</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.expenses.technology.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={73} className="flex-1" />
                    <span className="text-sm font-semibold">73%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">9. Impuestos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.taxes.annuities)}</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.expenses.taxes.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={58} className="flex-1" />
                    <span className="text-sm font-semibold">58%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">10. Otros Gastos</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right font-semibold">-</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={0} className="flex-1" />
                    <span className="text-sm font-semibold">0%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">11. Depreciación</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.depreciation.annuities)}</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.expenses.depreciation.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={100} className="flex-1" />
                    <span className="text-sm font-semibold">100%</span>
                  </div>
                </td>
              </tr>
              
              <tr className="bg-secondary/10">
                <td className="p-3 border border-border font-bold">Total egresos</td>
                <td className="p-3 border border-border text-right font-bold">{formatCurrency(projectData.expenses.totalExpenses.annuities)}</td>
                <td className="p-3 border border-border text-right font-bold">{formatCurrency(projectData.expenses.totalExpenses.community)}</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">{formatCurrency(projectData.expenses.totalExpenses.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={76} className="flex-1" />
                    <span className="text-sm font-bold">76%</span>
                  </div>
                </td>
              </tr>

              {/* RESULTADO NETO */}
              <tr className="bg-chart-4/10">
                <td className="p-3 border border-border font-bold text-lg">Ingresos menos Gastos</td>
                <td className="p-3 border border-border text-right font-bold text-lg">
                  ({formatCurrency(Math.abs(projectData.netResult.annuities))})
                </td>
                <td className="p-3 border border-border text-right font-bold text-lg">{formatCurrency(projectData.netResult.community)}</td>
                <td className="p-3 border border-border text-right font-bold text-lg text-chart-4">{formatCurrency(projectData.netResult.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={105} className="flex-1" />
                    <span className="text-sm font-bold">105%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-bold text-foreground mb-2">Transparencia de Ejecución:</h4>
          <p className="text-sm text-muted-foreground">
            Las barras de progreso muestran el porcentaje de ejecución de cada categoría contra el presupuesto planificado. 
            Los valores superiores al 100% indican sobreejecución del presupuesto.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};