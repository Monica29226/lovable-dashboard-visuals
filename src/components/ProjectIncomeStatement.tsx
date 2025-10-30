import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";

// Datos del Estado de Resultados por Proyecto (Septiembre 2025)
const projectData = {
  income: {
    memberFees: {
      annuities: 195650,
      community: 0,
      total: 195650
    },
    projects: {
      annuities: 0,
      community: 159214,
      total: 159214
    },
    others: {
      annuities: 0,
      community: 0,
      total: 0
    },
    totalIncome: {
      annuities: 195650,
      community: 159214,
      total: 354864
    }
  },
  expenses: {
    personal: {
      annuities: 89617,
      community: 94157,
      total: 183774
    },
    administrative: {
      annuities: 1757,
      community: 196,
      total: 1953
    },
    representation: {
      annuities: 18609,
      community: 5409,
      total: 24018
    },
    communication: {
      annuities: 19533,
      community: 6496,
      total: 26029
    },
    rent: {
      annuities: 11468,
      community: 0,
      total: 11468
    },
    events: {
      annuities: 0,
      community: 0,
      total: 0
    },
    professional: {
      annuities: 24027,
      community: 0,
      total: 24027
    },
    technology: {
      annuities: 10528,
      community: 13874,
      total: 24402
    },
    taxes: {
      annuities: 5063,
      community: 0,
      total: 5063
    },
    otherExpenses: {
      annuities: 0,
      community: 0,
      total: 0
    },
    depreciation: {
      annuities: 2242,
      community: 0,
      total: 2242
    },
    totalExpenses: {
      annuities: 182842.79,
      community: 120132.38,
      total: 302975.17
    }
  },
  netResult: {
    annuities: 12807.21,
    community: 39081.62,
    total: 51888.83
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
                  Anualidades<br/>Septiembre
                </th>
                <th className="text-center p-3 border border-border font-semibold text-secondary">
                  Comunidad<br/>Septiembre
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
                    <Progress value={83} className="flex-1" />
                    <span className="text-sm font-semibold">83%</span>
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
                    <Progress value={56} className="flex-1" />
                    <span className="text-sm font-semibold">56%</span>
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
                    <Progress value={100} className="flex-1" />
                    <span className="text-sm font-bold">1</span>
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
                    <Progress value={72} className="flex-1" />
                    <span className="text-sm font-semibold">72%</span>
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
                    <Progress value={94} className="flex-1" />
                    <span className="text-sm font-semibold">94%</span>
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
                    <Progress value={90} className="flex-1" />
                    <span className="text-sm font-semibold">90%</span>
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
                    <Progress value={100} className="flex-1" />
                    <span className="text-sm font-semibold">100%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">5. Alquiler Oficinas y Parqueos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(projectData.expenses.rent.annuities)}</td>
                <td className="p-3 border border-border text-right">-</td>
                <td className="p-3 border border-border text-right font-semibold">{formatCurrency(projectData.expenses.rent.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={95} className="flex-1" />
                    <span className="text-sm font-semibold">95%</span>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">6. Eventos</td>
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
                    <Progress value={88} className="flex-1" />
                    <span className="text-sm font-semibold">88%</span>
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
                    <Progress value={92} className="flex-1" />
                    <span className="text-sm font-semibold">92%</span>
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
                    <Progress value={85} className="flex-1" />
                    <span className="text-sm font-semibold">85%</span>
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
                    <Progress value={75} className="flex-1" />
                    <span className="text-sm font-semibold">75%</span>
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
                    <Progress value={94} className="flex-1" />
                    <span className="text-sm font-bold">94%</span>
                  </div>
                </td>
              </tr>

              {/* RESULTADO NETO */}
              <tr className="bg-chart-5/20">
                <td className="p-3 border border-border font-bold text-lg">Ingresos menos Gastos</td>
                <td className="p-3 border border-border text-right font-bold text-lg text-chart-5">{formatCurrency(projectData.netResult.annuities)}</td>
                <td className="p-3 border border-border text-right font-bold text-lg text-chart-5">{formatCurrency(projectData.netResult.community)}</td>
                <td className="p-3 border border-border text-right font-bold text-lg text-chart-5">{formatCurrency(projectData.netResult.total)}</td>
                <td className="p-3 border border-border text-center">
                  <div className="flex items-center gap-2">
                    <Progress value={100} className="flex-1" />
                    <span className="text-sm font-bold">100%</span>
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