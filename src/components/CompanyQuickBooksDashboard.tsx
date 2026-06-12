import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Link2, Loader2, TrendingUp, TrendingDown, Wallet, BarChart3, Lock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface DetailLine {
  label: string;
  amount: number;
  group?: string;
}

interface BalanceRow {
  report_date: string;
  total_assets: number | null;
  total_liabilities: number | null;
  total_equity: number | null;
  raw_data?: { lines?: DetailLine[] } | null;
}

interface ProfitLossRow {
  report_date: string;
  start_date: string | null;
  end_date: string | null;
  total_income: number | null;
  total_expenses: number | null;
  net_income: number | null;
  raw_data?: { lines?: DetailLine[] } | null;
}

interface Props {
  companyId: string;
  companyName: string;
  isConnected: boolean;
  dataSource?: 'quickbooks' | 'excel';
}

const formatCurrency = (value: number | null | undefined) => {
  const v = value ?? 0;
  const formatted = new Intl.NumberFormat("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(v));
  return v < 0 ? `(${formatted})` : formatted;
};

export const CompanyQuickBooksDashboard = ({ companyId, companyName, isConnected, dataSource = 'quickbooks' }: Props) => {
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["company-balance", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quickbooks_balance_sheet")
        .select("report_date, total_assets, total_liabilities, total_equity, raw_data")
        .eq("company_id", companyId)
        .order("report_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as BalanceRow | null;
    },
  });

  const { data: profitLoss, isLoading: plLoading } = useQuery({
    queryKey: ["company-profit-loss", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quickbooks_profit_loss")
        .select("report_date, start_date, end_date, total_income, total_expenses, net_income, raw_data")
        .eq("company_id", companyId)
        .order("report_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ProfitLossRow | null;
    },
  });

  const isLoading = balanceLoading || plLoading;
  const hasData = !!balance || !!profitLoss;

  const balanceChartData = [
    { name: "Activos", value: balance?.total_assets ?? 0 },
    { name: "Pasivos", value: balance?.total_liabilities ?? 0 },
    { name: "Patrimonio", value: balance?.total_equity ?? 0 },
  ];

  const plChartData = [
    { name: "Ingresos", value: profitLoss?.total_income ?? 0 },
    { name: "Gastos", value: Math.abs(profitLoss?.total_expenses ?? 0) },
    { name: "Utilidad Neta", value: profitLoss?.net_income ?? 0 },
  ];



  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative w-full h-[240px] md:h-[300px] bg-ink mb-6">
        <div className="relative max-w-[1600px] mx-auto h-full flex flex-col items-center justify-center p-8 md:p-12">
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: "hsl(var(--co))" }}
            />
            <h1 className="font-display text-4xl md:text-5xl text-paper text-center">{companyName}</h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1 text-paper/90">
                <span className={`h-2 w-2 rounded-full ${dataSource === "excel" || isConnected ? "bg-success-live" : "bg-muted"}`} />
                {dataSource === "excel" ? "Excel" : `QuickBooks · ${isConnected ? "conectado" : "sin conexión"}`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1 text-paper/90">
                <Lock className="h-3 w-3 text-gold" /> Solo esta empresa
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 px-4 md:px-6">
        <div className="text-center mb-6 animate-fade-in">
          <h2 className="font-display text-3xl text-foreground mb-2">
            Panel Financiero
          </h2>
          <p className="text-base text-muted-foreground font-medium">
            {companyName} · {dataSource === "excel" ? "Datos desde Excel" : "Datos de QuickBooks"}
          </p>
        </div>


        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasData ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <Link2 className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {isConnected
                    ? "Sin datos sincronizados todavía"
                    : "Conecta esta empresa con QuickBooks para ver sus datos"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {isConnected
                    ? "Esta empresa está conectada pero aún no tiene datos sincronizados. Sincroniza desde la sección de QuickBooks."
                    : "Ve a la página de Empresas y usa el botón \"Conectar con QuickBooks\" para vincular esta empresa."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="balance" className="w-full animate-grow">
            <TabsList className="grid w-full grid-cols-3 bg-card shadow-sm h-auto p-1 gap-1">
              <TabsTrigger
                value="balance"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
              >
                Estado de Posición Financiera
              </TabsTrigger>
              <TabsTrigger
                value="statements"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
              >
                Estado de Resultados
              </TabsTrigger>
              <TabsTrigger
                value="charts"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-3"
              >
                Gráficos en Tiempo Real
              </TabsTrigger>
            </TabsList>


            <TabsContent value="balance" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-[hsl(var(--co))]" /> Activos Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      ₡ {formatCurrency(balance?.total_assets)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-[hsl(var(--co))]" /> Pasivos Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      ₡ {formatCurrency(balance?.total_liabilities)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[hsl(var(--co))]" /> Patrimonio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      ₡ {formatCurrency(balance?.total_equity)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {balance?.report_date && (
                <p className="text-sm text-muted-foreground text-center">
                  Al {new Date(balance.report_date).toLocaleDateString("es-CR")}
                </p>
              )}
              {balance?.raw_data?.lines && balance.raw_data.lines.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Detalle de cuentas</CardTitle></CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {balance.raw_data.lines.map((l, i) => (
                        <div key={i} className="flex justify-between py-1.5 text-sm">
                          <span className="text-muted-foreground">{l.label}</span>
                          <span className="font-medium tabular-nums">₡ {formatCurrency(l.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="statements" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[hsl(var(--co))]" /> Ingresos Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      ₡ {formatCurrency(profitLoss?.total_income)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-[hsl(var(--co))]" /> Gastos Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      ₡ {formatCurrency(profitLoss?.total_expenses)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-[hsl(var(--co))]" /> Utilidad Neta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      ₡ {formatCurrency(profitLoss?.net_income)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {profitLoss?.start_date && profitLoss?.end_date && (
                <p className="text-sm text-muted-foreground text-center">
                  Periodo: {new Date(profitLoss.start_date).toLocaleDateString("es-CR")} -{" "}
                  {new Date(profitLoss.end_date).toLocaleDateString("es-CR")}
                </p>
              )}
            </TabsContent>

            <TabsContent value="charts" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[hsl(var(--co))]" /> Posición Financiera
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={balanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₡${(v / 1000000).toFixed(0)}M`} />
                        <Tooltip formatter={(v: number) => `₡ ${formatCurrency(v)}`} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {balanceChartData.map((_, idx) => (
                            <Cell key={idx} fill={`hsl(var(--co))`} fillOpacity={0.6 + idx * 0.15} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[hsl(var(--co))]" /> Ingresos vs Gastos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={plChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₡${(v / 1000000).toFixed(0)}M`} />
                        <Tooltip formatter={(v: number) => `₡ ${formatCurrency(v)}`} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {plChartData.map((_, idx) => (
                            <Cell key={idx} fill={`hsl(var(--co))`} fillOpacity={0.6 + idx * 0.15} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
