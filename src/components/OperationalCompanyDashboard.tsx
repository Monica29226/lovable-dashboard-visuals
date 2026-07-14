import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Banknote, BarChart3, Calculator, FileText, Users } from "lucide-react";
import {
  calculateSalaryTax2026,
  raciEmployeeSample,
  raciPayrollData,
  rentTax2026,
} from "@/data/operationalDashboards";

interface Props {
  companyName: string;
}

const fmt = (value: number) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);

const fmtPct = (value: number) =>
  new Intl.NumberFormat("es-CR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

const compactCurrency = (value: number) => `₡${(value / 1000000).toFixed(1)}M`;

const Kpi = ({ title, value, note, icon: Icon }: { title: string; value: string; note: string; icon: typeof BarChart3 }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4 text-[hsl(var(--co))]" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </CardContent>
  </Card>
);

const RaciDashboard = ({ companyName }: { companyName: string }) => {
  const payroll2025 = raciPayrollData.filter((row) => row.month.includes("2025"));
  const payroll2026 = raciPayrollData.filter((row) => row.month.includes("2026"));
  const latest = payroll2026[payroll2026.length - 1];
  const totalSalary2025 = payroll2025.reduce((sum, row) => sum + row.salary, 0);
  const totalLaborCost2026 = payroll2026.reduce((sum, row) => sum + row.salary + row.ccss + row.aguinaldo, 0);
  const projectedAnnualLaborCost = (totalLaborCost2026 / payroll2026.length) * 12;
  const totalCostByMonth = raciPayrollData.map((row) => ({
    month: row.month,
    total: row.salary + row.ccss + row.aguinaldo,
  }));
  const latestBreakdown = [
    { name: "Salario", value: latest.salary },
    { name: "CCSS", value: latest.ccss },
    { name: "Aguinaldo", value: latest.aguinaldo },
  ];
  const latestTaxProjection = raciEmployeeSample.map((employee) => ({
    ...employee,
    tax: calculateSalaryTax2026(employee.salary, employee.spouse, employee.children),
  }));

  return (
    <CompanyShell companyName={companyName} subtitle="Panel de planilla, cargas sociales y proyección de renta 2026">
      <Tabs defaultValue="summary" className="w-full animate-grow">
        <TabsList className="grid w-full grid-cols-3 bg-card shadow-sm h-auto p-1 gap-1">
          <TabsTrigger value="summary" className="py-3">Resumen</TabsTrigger>
          <TabsTrigger value="charts" className="py-3">Gráficos</TabsTrigger>
          <TabsTrigger value="tax" className="py-3">Proyección de renta</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Kpi title="Última planilla" value={fmt(latest.salary)} note={`${latest.month} · ${latest.employees} personas`} icon={Users} />
            <Kpi title="CCSS mensual" value={fmt(latest.ccss)} note="Carga patronal registrada en la planilla" icon={Banknote} />
            <Kpi title="Salarios 2025" value={fmt(totalSalary2025)} note="Base para comparar tendencia anual" icon={FileText} />
            <Kpi title="Proyección anual 2026" value={fmt(projectedAnnualLaborCost)} note="Salario + CCSS + aguinaldo, promedio enero-mayo" icon={Calculator} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Qué se debe entender</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <p>RACI se lee como planilla: cuánto cuesta el equipo cada mes y cuánto se debe retener por renta.</p>
              <p>La señal principal es la baja del costo desde mayo 2025 y una planilla 2026 más estable.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Cuánto costó la planilla por mes</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={totalCostByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={70} />
                    <YAxis tickFormatter={compactCurrency} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Bar dataKey="total" name="Costo total" fill="hsl(var(--co))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">De qué se compone el último mes</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={latestBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={compactCurrency} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Bar dataKey="value" name={latest.month} radius={[4, 4, 0, 0]}>
                      {latestBreakdown.map((_, index) => (
                        <Cell key={index} fill={["hsl(var(--co))", "#64748b", "#d4af37"][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tax" className="mt-6 space-y-6">
          <TaxSourceNote />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Retención salarial estimada 2026</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Colaborador</th>
                    <th className="py-2 text-right">Base imponible</th>
                    <th className="py-2 text-right">Renta mensual</th>
                    <th className="py-2 text-right">Renta anualizada</th>
                  </tr>
                </thead>
                <tbody>
                  {latestTaxProjection.map((row) => (
                    <tr key={row.name} className="border-b last:border-0">
                      <td className="py-3 font-medium">{row.name}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.salary)}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.tax)}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.tax * 12)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </CompanyShell>
  );
};

const TaxSourceNote = () => (
  <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
    <CardContent className="flex flex-col gap-2 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <span>Tramos usados: periodo fiscal 2026 de Hacienda. La proyección es gerencial y debe cerrarse contra la declaración final.</span>
      <a className="font-medium text-primary underline-offset-4 hover:underline" href={rentTax2026.sourceUrl} target="_blank" rel="noreferrer">
        Ver PDF oficial
      </a>
    </CardContent>
  </Card>
);

const CompanyShell = ({ companyName, subtitle, children }: { companyName: string; subtitle: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <div className="relative w-full h-[240px] md:h-[300px] bg-ink mb-6">
      <div className="relative max-w-[1600px] mx-auto h-full flex flex-col items-center justify-center p-8 md:p-12">
        <span className="h-3 w-3 rounded-full bg-[hsl(var(--co))]" />
        <h1 className="mt-4 font-display text-4xl md:text-5xl text-paper text-center">{companyName}</h1>
        <p className="mt-3 max-w-2xl text-center text-sm md:text-base text-paper/75">{subtitle}</p>
      </div>
    </div>
    <div className="max-w-[1600px] mx-auto space-y-6 px-4 md:px-6 pb-10">{children}</div>
  </div>
);

export const OperationalCompanyDashboard = ({ companyName }: Props) => <RaciDashboard companyName={companyName} />;
