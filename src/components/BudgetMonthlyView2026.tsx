import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudget, BudgetRow } from "@/contexts/BudgetContext";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS_MAP: Record<string, string> = {
  january: 'Enero', february: 'Febrero', march: 'Marzo', april: 'Abril',
  may: 'Mayo', june: 'Junio', july: 'Julio', august: 'Agosto',
  september: 'Septiembre', october: 'Octubre', november: 'Noviembre', december: 'Diciembre',
};

const MONTH_KEYS = Object.keys(MONTHS_MAP);

const formatCurrency = (value: number): string => {
  if (value === 0) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const BudgetMonthlyView2026 = () => {
  const { budgetData } = useBudget();
  const [selectedMonth, setSelectedMonth] = useState('february');

  const monthKey = selectedMonth as keyof BudgetRow;

  // Get income and expense level 0 rows
  const incomeRoot = budgetData.find(r => r.level === 0 && (r.category.includes('INGRESO') || r.category === 'INCOME'));
  const expenseRoot = budgetData.find(r => r.level === 0 && (r.category.includes('EGRESO') || r.category === 'EXPENSES'));

  const incomeL1 = budgetData.filter(r => r.level === 1 && r.parent_category === incomeRoot?.category);
  const expenseL1 = budgetData.filter(r => r.level === 1 && r.parent_category === expenseRoot?.category);

  const totalIncome = Number((incomeRoot as any)?.[monthKey]) || 0;
  const totalExpenses = Number((expenseRoot as any)?.[monthKey]) || 0;
  const netResult = totalIncome - totalExpenses;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              Estado de Resultados Mensual 2026
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Presupuesto por mes (US$)
            </p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_KEYS.map(key => (
                <SelectItem key={key} value={key}>{MONTHS_MAP[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border px-4 py-3 text-left font-semibold"></th>
                <th className="border px-4 py-3 text-right font-semibold w-[150px]">{MONTHS_MAP[selectedMonth]}</th>
              </tr>
            </thead>
            <tbody>
              {/* Income */}
              <tr className="bg-primary/5">
                <td className="border px-4 py-2 font-bold text-primary">Ingresos</td>
                <td className="border px-4 py-2 text-right"></td>
              </tr>
              {incomeL1.map((row, i) => (
                <tr key={`inc-${i}`} className="hover:bg-muted/50">
                  <td className="border px-4 py-2 pl-8 text-muted-foreground">{row.category}</td>
                  <td className="border px-4 py-2 text-right font-mono">
                    {formatCurrency(Number((row as any)[monthKey]) || 0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-primary/10 font-bold">
                <td className="border px-4 py-2 pl-8">Total ingresos</td>
                <td className="border px-4 py-2 text-right font-mono">{formatCurrency(totalIncome)}</td>
              </tr>

              {/* Spacer */}
              <tr><td colSpan={2} className="h-2"></td></tr>

              {/* Expenses */}
              <tr className="bg-secondary/5">
                <td className="border px-4 py-2 font-bold text-secondary">Egresos</td>
                <td className="border px-4 py-2 text-right"></td>
              </tr>
              {expenseL1.map((row, i) => (
                <tr key={`exp-${i}`} className="hover:bg-muted/50">
                  <td className="border px-4 py-2 pl-8 text-muted-foreground">{row.category}</td>
                  <td className="border px-4 py-2 text-right font-mono">
                    {formatCurrency(Number((row as any)[monthKey]) || 0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-secondary/10 font-bold">
                <td className="border px-4 py-2 pl-8">Total egresos</td>
                <td className="border px-4 py-2 text-right font-mono">{formatCurrency(totalExpenses)}</td>
              </tr>

              {/* Spacer */}
              <tr><td colSpan={2} className="h-2"></td></tr>

              {/* Net Result */}
              <tr
                className="font-bold text-lg"
                style={{
                  backgroundColor: netResult >= 0 ? '#1B5E20' : '#B71C1C',
                  color: 'white',
                  borderTop: '3px solid',
                  borderBottom: '3px solid',
                  borderColor: netResult >= 0 ? '#1B5E20' : '#B71C1C',
                }}
              >
                <td className="border px-4 py-3">Ingresos menos Gastos</td>
                <td className="border px-4 py-3 text-right font-mono">{formatCurrency(netResult)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
