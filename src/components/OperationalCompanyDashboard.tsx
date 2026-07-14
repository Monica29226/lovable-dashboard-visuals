import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { AlertTriangle, Banknote, BarChart3, Calculator, CreditCard, FileText, Users } from "lucide-react";
import {
  OperationalCompanyKind,
  calculateProgressiveTax,
  calculateSalaryTax2026,
  dentoIva2026Data,
  dentoTopSuppliers2026,
  raciEmployeeSample,
  raciPayrollData,
  rentTax2026,
} from "@/data/operationalDashboards";

interface Props {
  companyName: string;
  kind: OperationalCompanyKind;
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
const sumBy = <T,>(rows: T[], getter: (row: T) => number) => rows.reduce((sum, row) => sum + getter(row), 0);

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

const DentoDashboard = ({ companyName }: { companyName: string }) => {
  const income = sumBy(dentoIva2026Data, (row) => row.income);
  const expenses = sumBy(dentoIva2026Data, (row) => row.supportedExpenses);
  const estimatedDifference = sumBy(dentoIva2026Data, (row) => row.estimatedDifference);
  const incomeVat = sumBy(dentoIva2026Data, (row) => row.incomeVat);
  const supportedVat = sumBy(dentoIva2026Data, (row) => row.supportedVat);
  const netVat = sumBy(dentoIva2026Data, (row) => row.netVat);
  const annualizedGrossIncome = (income / dentoIva2026Data.length) * 12;
  const isSmallLegalEntityProjected = annualizedGrossIncome <= rentTax2026.smallLegalEntityGrossLimit;
  const projectedLegalTax = isSmallLegalEntityProjected
    ? calculateProgressiveTax(estimatedDifference, rentTax2026.smallLegalEntityAnnual)
    : estimatedDifference * 0.3;
  const chartData = dentoIva2026Data.map((row) => ({
    month: row.month,
    Ingresos: row.income,
    "Gastos soportados": row.supportedExpenses,
  }));

  return (
    <CompanyShell companyName={companyName} subtitle="Reporte IVA enero-abril 2026 con datos reales disponibles">
      <Tabs defaultValue="summary" className="w-full animate-grow">
        <TabsList className="grid w-full grid-cols-3 bg-card shadow-sm h-auto p-1 gap-1">
          <TabsTrigger value="summary" className="py-3">Resumen</TabsTrigger>
          <TabsTrigger value="charts" className="py-3">Reporte mensual</TabsTrigger>
          <TabsTrigger value="tax" className="py-3">Proyección de renta</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Kpi title="Ingresos declarados" value={fmt(income)} note="Enero-abril 2026, base sin IVA" icon={CreditCard} />
            <Kpi title="Gastos soportados" value={fmt(expenses)} note="Compras/gastos usados para crédito IVA" icon={FileText} />
            <Kpi title="Diferencia estimada" value={fmt(estimatedDifference)} note="Ingresos menos gastos soportados IVA" icon={BarChart3} />
            <Kpi title="IVA neto estimado" value={fmt(netVat)} note="IVA cobrado menos IVA soportado" icon={Calculator} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alcance del reporte</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <p>Esta vista usa los archivos IVA disponibles de enero a abril 2026. No usa el archivo histórico 2022.</p>
              <p>La diferencia estimada no es utilidad contable final: faltan partidas como planilla, bancos, depreciación y ajustes de cierre.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ingresos y gastos soportados por mes</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={compactCurrency} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Bar dataKey="Ingresos" fill="hsl(var(--co))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos soportados" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Reporte mensual enero-abril 2026</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Mes</th>
                    <th className="py-2 text-right">Ingresos</th>
                    <th className="py-2 text-right">IVA cobrado</th>
                    <th className="py-2 text-right">Gastos soportados</th>
                    <th className="py-2 text-right">IVA soportado</th>
                    <th className="py-2 text-right">Diferencia estimada</th>
                    <th className="py-2 text-right">IVA neto</th>
                  </tr>
                </thead>
                <tbody>
                  {dentoIva2026Data.map((row) => (
                    <tr key={row.month} className="border-b last:border-0">
                      <td className="py-3 font-medium">{row.month}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.income)}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.incomeVat)}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.supportedExpenses)}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.supportedVat)}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.estimatedDifference)}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.netVat)}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/40 font-bold">
                    <td className="py-3">Total</td>
                    <td className="py-3 text-right tabular-nums">{fmt(income)}</td>
                    <td className="py-3 text-right tabular-nums">{fmt(incomeVat)}</td>
                    <td className="py-3 text-right tabular-nums">{fmt(expenses)}</td>
                    <td className="py-3 text-right tabular-nums">{fmt(supportedVat)}</td>
                    <td className="py-3 text-right tabular-nums">{fmt(estimatedDifference)}</td>
                    <td className="py-3 text-right tabular-nums">{fmt(netVat)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Principales gastos/proveedores soportados</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {dentoTopSuppliers2026.map((row) => {
                const percent = expenses > 0 ? row.amount / expenses : 0;
                return (
                  <div key={row.supplier} className="grid gap-1">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-foreground">{row.supplier}</span>
                      <span className="tabular-nums text-muted-foreground">{fmt(row.amount)} · {fmtPct(percent)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-[hsl(var(--co))]" style={{ width: `${Math.min(percent * 100, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="mt-6 space-y-6">
          <TaxSourceNote />
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">Proyección de renta jurídica</CardTitle>
                <Badge variant={isSmallLegalEntityProjected ? "secondary" : "destructive"}>
                  {isSmallLegalEntityProjected ? "Proyección bajo límite pequeña empresa" : "Proyección supera límite pequeña empresa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Ingreso bruto enero-abril</p>
                <p className="text-xl font-semibold">{fmt(income)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Base estimada enero-abril</p>
                <p className="text-xl font-semibold">{fmt(estimatedDifference)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impuesto proyectado</p>
                <p className="text-xl font-semibold">{fmt(projectedLegalTax)}</p>
              </div>
              <p className="md:col-span-3 text-sm text-muted-foreground">
                Esta proyección parte de declaraciones IVA enero-abril 2026. No es impuesto definitivo: debe revisarse con contabilidad completa, gastos no sujetos a IVA, planilla, depreciación, pagos parciales y ajustes fiscales.
              </p>
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

export const OperationalCompanyDashboard = ({ companyName, kind }: Props) => {
  if (kind === "raci") {
    return <RaciDashboard companyName={companyName} />;
  }

  return <DentoDashboard companyName={companyName} />;
};
