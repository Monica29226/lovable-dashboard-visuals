import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { financialData2026, formatCurrency2026 } from "@/data/financialData2026";
import { useLanguage } from "@/contexts/LanguageContext";
import { tr } from "@/lib/panel2026I18n";

const COLORS = [
  "hsl(220, 90%, 25%)", // Activos
  "hsl(220, 80%, 45%)", // Pasivos
  "hsl(15, 85%, 65%)",  // Patrimonio
];

export const FinancialPositionChart2026 = () => {
  const bs = financialData2026.balanceSheet;
  const { language } = useLanguage();
  const t = (s: string) => tr(s, language);
  const balancePeriod = language === "en" ? financialData2026.balancePeriodEn : financialData2026.balancePeriod;

  const data = [
    { name: t("Activos"), value: bs.assets.totalAssets, color: COLORS[0] },
    { name: t("Pasivos"), value: bs.liabilities.totalLiabilities, color: COLORS[1] },
    { name: t("Patrimonio"), value: bs.equity.totalEquity, color: COLORS[2] },
  ];


  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{d.name}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency2026(d.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Posición Financiera - {financialData2026.balancePeriod}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribución por categorías principales (US$)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
