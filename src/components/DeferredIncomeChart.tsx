import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const deferredIncomeData = [
  { year: "2022", amount: 146977, displayValue: "$146,977" },
  { year: "2023", amount: 76304, displayValue: "$76,304" },
  { year: "2024", amount: 92625, displayValue: "$92,625" },
  { year: "2025", amount: 103229, displayValue: "$103,229" }
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currencySign: 'accounting',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const DeferredIncomeChart = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Ingresos Diferidos por Período
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Evolución de ingresos diferidos 2022-2025 (US$)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deferredIncomeData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="year" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-foreground">{label}</p>
                        <p className="text-primary font-bold">
                          Ingresos Diferidos: {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {deferredIncomeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {deferredIncomeData.map((item) => (
            <div key={item.year} className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">{item.year}</div>
              <div className="text-lg font-bold text-primary">{item.displayValue}</div>
            </div>
          ))}
        </div>

        {/* Variación */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-foreground mb-2">Análisis de Variación</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">2022 vs 2023</div>
              <div className="font-bold text-destructive">
                {(((deferredIncomeData[1].amount - deferredIncomeData[0].amount) / deferredIncomeData[0].amount) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">2023 vs 2024</div>
              <div className="font-bold text-chart-5">
                +{(((deferredIncomeData[2].amount - deferredIncomeData[1].amount) / deferredIncomeData[1].amount) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">2024 vs 2025</div>
              <div className="font-bold text-chart-5">
                +{(((deferredIncomeData[3].amount - deferredIncomeData[2].amount) / deferredIncomeData[2].amount) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
