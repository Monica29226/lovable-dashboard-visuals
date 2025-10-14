import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

// Datos comparativos Septiembre 2024 vs Septiembre 2025
const data = {
  sept2024: {
    income: {
      cuotasAsociados: 188127,
      proyectos: 166184,
      otros: 0,
      total: 344311
    },
    expenses: {
      personal: 162662,
      gastosAdministrativos: 2745,
      alquilacion: 19289,
      alquilerOficinasParqueos: 9617,
      compraEquipo: 0,
      honorariosMercadeo: 7786,
      eventos: 7934,
      serviciosProfesionales: 10196,
      tecnologia: 18676,
      impuestos: 3546,
      deudaCCSS: 0,
      otrosGastos: 0,
      depreciacion: 2386,
      total: 244846
    },
    netResult: 99465
  },
  sept2025: {
    budget: {
      income: {
        cuotasAsociados: 275650,
        proyectos: 152805,
        otros: 15000,
        total: 443455
      },
      expenses: {
        personal: 189896,
        gastosAdministrativos: 1099,
        alquilacion: 12800,
        alquilerOficinasParqueos: 12611,
        compraEquipo: 4300,
        honorariosMercadeo: 7200,
        eventos: 6400,
        serviciosProfesionales: 24803,
        tecnologia: 28388,
        impuestos: 5000,
        deudaCCSS: 1120,
        otrosGastos: 400,
        depreciacion: 0,
        total: 294017
      },
      netResult: 149438
    },
    actual: {
      income: {
        cuotasAsociados: 188127,
        proyectos: 166184,
        otros: 0,
        total: 344311
      },
      expenses: {
        personal: 162662,
        gastosAdministrativos: 2745,
        alquilacion: 19289,
        alquilerOficinasParqueos: 9617,
        compraEquipo: 0,
        honorariosMercadeo: 7786,
        eventos: 7934,
        serviciosProfesionales: 10196,
        tecnologia: 18676,
        impuestos: 3546,
        deudaCCSS: 0,
        otrosGastos: 0,
        depreciacion: 2386,
        total: 244846
      },
      netResult: 99465
    }
  }
};

const formatCurrency = (value: number) => {
  if (value === 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const BudgetVsRealComparison = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground text-center">
          Comparación Presupuesto vs Real
        </CardTitle>
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Septiembre 2024 vs Septiembre 2025</p>
          <p className="text-sm text-muted-foreground">Valores en US$</p>
          <p className="text-sm text-muted-foreground">Acumulado Enero - Septiembre</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 border border-border font-semibold"></th>
                <th className="text-center p-3 border border-border font-semibold text-foreground">
                  Real<br/>Sept 2024
                </th>
                <th className="text-center p-3 border border-border font-semibold text-primary">
                  Presup Total<br/>Anual 2025
                </th>
                <th className="text-center p-3 border border-border font-semibold text-secondary">
                  Real<br/>Enero - Septiembre 2025
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
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Cuotas Asociados</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.income.cuotasAsociados)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.income.cuotasAsociados)}</td>
                <td className="p-3 border border-border text-right bg-blue-50 dark:bg-blue-950/20 font-semibold">{formatCurrency(data.sept2025.actual.income.cuotasAsociados)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Proyectos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.income.proyectos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.income.proyectos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.income.proyectos)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">Otros</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.income.otros)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.income.otros)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.income.otros)}</td>
              </tr>
              
              <tr className="bg-primary/10">
                <td className="p-3 border border-border font-bold">Total Ingresos</td>
                <td className="p-3 border border-border text-right font-bold">{formatCurrency(data.sept2024.income.total)}</td>
                <td className="p-3 border border-border text-right font-bold">{formatCurrency(data.sept2025.budget.income.total)}</td>
                <td className="p-3 border border-border text-right font-bold text-primary">{formatCurrency(data.sept2025.actual.income.total)}</td>
              </tr>

              {/* EGRESOS */}
              <tr>
                <td className="p-3 border border-border font-bold text-secondary pt-6">Egresos</td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
                <td className="p-3 border border-border"></td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">1. Personal</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.personal)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.personal)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.personal)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">2. Gastos administrativos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.gastosAdministrativos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.gastosAdministrativos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.gastosAdministrativos)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">3. Alquilación</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.alquilacion)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.alquilacion)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.alquilacion)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">4. Alquiler Oficinas y Parqueos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.alquilerOficinasParqueos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.alquilerOficinasParqueos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.alquilerOficinasParqueos)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">5. Compra de equipo</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.compraEquipo)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.compraEquipo)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.compraEquipo)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">6. Honorarios y Mercadeo</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.honorariosMercadeo)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.honorariosMercadeo)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.honorariosMercadeo)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">7. Eventos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.eventos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.eventos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.eventos)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">8. Servicios Profesionales</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.serviciosProfesionales)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.serviciosProfesionales)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.serviciosProfesionales)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">9. Tecnología</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.tecnologia)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.tecnologia)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.tecnologia)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">10. Impuestos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.impuestos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.impuestos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.impuestos)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">11. Deuda CCSS</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.deudaCCSS)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.deudaCCSS)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.deudaCCSS)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">12. Otros Gastos</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.otrosGastos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.otrosGastos)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.otrosGastos)}</td>
              </tr>
              
              <tr>
                <td className="p-3 border border-border pl-6">13. Depreciación</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2024.expenses.depreciacion)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.budget.expenses.depreciacion)}</td>
                <td className="p-3 border border-border text-right">{formatCurrency(data.sept2025.actual.expenses.depreciacion)}</td>
              </tr>
              
              <tr className="bg-secondary/10">
                <td className="p-3 border border-border font-bold">Total egresos</td>
                <td className="p-3 border border-border text-right font-bold">{formatCurrency(data.sept2024.expenses.total)}</td>
                <td className="p-3 border border-border text-right font-bold">{formatCurrency(data.sept2025.budget.expenses.total)}</td>
                <td className="p-3 border border-border text-right font-bold text-secondary">{formatCurrency(data.sept2025.actual.expenses.total)}</td>
              </tr>

              {/* RESULTADO NETO */}
              <tr className="bg-chart-5/20">
                <td className="p-3 border border-border font-bold text-lg">Ingresos menos Gastos</td>
                <td className="p-3 border border-border text-right font-bold text-lg text-chart-5">{formatCurrency(data.sept2024.netResult)}</td>
                <td className="p-3 border border-border text-right font-bold text-lg text-chart-5">{formatCurrency(data.sept2025.budget.netResult)}</td>
                <td className="p-3 border border-border text-right font-bold text-lg text-chart-5">{formatCurrency(data.sept2025.actual.netResult)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-bold text-foreground mb-2">Comparación Interanual:</h4>
          <p className="text-sm text-muted-foreground">
            Esta tabla compara los resultados reales de Septiembre 2024 con el presupuesto anual 2025 
            y la ejecución real de Enero a Septiembre 2025, permitiendo analizar tendencias y cumplimiento presupuestario.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};