import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { balanceSheetData, historicalPatrimony, formatCurrency } from "@/data/balanceSheetData";
import { financialData2026 } from "@/data/financialData2026";

const getPatrimonyData = () => {
  return [
    ...historicalPatrimony,
    {
      year: "2024",
      patrimony: balanceSheetData.equity.dec2024.totalEquity,
      displayValue: formatCurrency(balanceSheetData.equity.dec2024.totalEquity),
    },
    {
      year: "2025 (Dic)",
      patrimony: balanceSheetData.equity.dec2025.totalEquity,
      displayValue: formatCurrency(balanceSheetData.equity.dec2025.totalEquity),
    },
    {
      year: `2026 (${financialData2026.period.split(" ")[0]})`,
      patrimony: financialData2026.balanceSheet.equity.totalEquity,
      displayValue: formatCurrency(financialData2026.balanceSheet.equity.totalEquity),
    },
  ];
};

export const PatrimonyMovementChart2026 = () => {
  const patrimonyData = getPatrimonyData();
  const first = patrimonyData[0].patrimony;
  const last = patrimonyData[patrimonyData.length - 1].patrimony;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Movimiento del Patrimonio
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Evolución del patrimonio neto 2022-{financialData2026.period} (US$)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={patrimonyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
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
                          Patrimonio: {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="patrimony"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
          {patrimonyData.map((item, index) => (
            <div key={item.year} className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">{item.year}</div>
              <div className="text-lg font-bold text-primary">{item.displayValue}</div>
              {index > 0 && (
                <div className="text-xs text-chart-5">
                  +{((item.patrimony - patrimonyData[index - 1].patrimony) / patrimonyData[index - 1].patrimony * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-foreground mb-2">Crecimiento Total</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Período</div>
              <div className="font-bold text-foreground">2022 - {financialData2026.period}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Crecimiento Absoluto</div>
              <div className="font-bold text-primary">{formatCurrency(last - first)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Crecimiento Relativo</div>
              <div className="font-bold text-chart-5">
                {(((last - first) / first) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
