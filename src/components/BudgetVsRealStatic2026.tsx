import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { tr } from "@/lib/panel2026I18n";

type Row = {
  label: string;
  annual: number | null;
  projection: number | null;
  budget: number | null;
  actual: number | null;
  variance: number | null;
  pending: number | null;
  progress: string; // pre-formatted (e.g. "28%", "n/a")
  bold?: boolean;
  isHeader?: boolean;
};

const fmt = (v: number | null): string => {
  if (v === null || v === 0) return "-";
  const abs = Math.abs(v).toLocaleString("en-US");
  return v < 0 ? `(${abs})` : abs;
};

const income: Row[] = [
  { label: "INGRESOS", annual: null, projection: null, budget: null, actual: null, variance: null, pending: null, progress: "", isHeader: true },
  { label: "Membresía", annual: 230000, projection: 233673, budget: 190650, actual: 117918, variance: -72732, pending: 102082, progress: "54%" },
  { label: "Cuotas Asociados", annual: 220000, projection: 255000, budget: 128585, actual: 155000, variance: 26415, pending: 75000, progress: "67%" },
  { label: "Otros", annual: 0, projection: 0, budget: 0, actual: 0, variance: 0, pending: 0, progress: "n/a" },
  { label: "Total ingresos", annual: 450000, projection: 488673, budget: 319235, actual: 272918, variance: -46317, pending: 177082, progress: "61%", bold: true },
];

const expenses: Row[] = [
  { label: "EGRESOS", annual: null, projection: null, budget: null, actual: null, variance: null, pending: null, progress: "", isHeader: true },
  { label: "Personal", annual: 223079, projection: 226428, budget: 130129, actual: 150675, variance: -20546, pending: 72404, progress: "68%" },
  { label: "Gastos administrativos", annual: 20493, projection: 20640, budget: 11954, actual: 13809, variance: -1855, pending: 6684, progress: "67%" },
  { label: "Viáticos", annual: 24000, projection: 28252, budget: 14000, actual: 23547, variance: -9547, pending: 453, progress: "98%" },
  { label: "Comunicación y Mercadeo", annual: 15635, projection: 32539, budget: 6395, actual: 23499, variance: -17104, pending: -7864, progress: "150%" },
  { label: "Servicios Profesionales", annual: 24048, projection: 26699, budget: 14028, actual: 18683, variance: -4655, pending: 5365, progress: "78%" },
  { label: "Tecnología", annual: 21840, projection: 30977, budget: 13865, actual: 24197, variance: -10332, pending: -2357, progress: "111%" },
  { label: "Impuestos", annual: 8000, projection: 9164, budget: 5200, actual: 6764, variance: -1564, pending: 1236, progress: "85%" },
  { label: "Otros Gastos", annual: 400, projection: 100, budget: 200, actual: 0, variance: 200, pending: 400, progress: "0%" },
  { label: "Depreciación", annual: 3000, projection: 3389, budget: 1750, actual: 2389, variance: -639, pending: 611, progress: "n/a" },
  { label: "Impuesto de Renta", annual: 0, projection: 0, budget: 0, actual: 0, variance: 0, pending: 0, progress: "n/a" },
  { label: "Total egresos", annual: 340495, projection: 378187, budget: 197522, actual: 263563, variance: -66041, pending: 76932, progress: "77%", bold: true },
];

const net: Row = {
  label: "Ingresos menos Gastos",
  annual: 109505,
  projection: 110486,
  budget: 121713,
  actual: 9354,
  variance: 112358,
  pending: 100150,
  progress: "9%",
  bold: true,
};


const rows: Row[] = [...income, ...expenses, net];

const SummaryCard = ({ title, actual, budget, budgetLabel }: { title: string; actual: number; budget: number; budgetLabel: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold">{fmt(actual)}</div>
      <div className="text-xs text-muted-foreground mt-1">{budgetLabel}: {fmt(budget)}</div>
    </CardContent>
  </Card>
);

const BudgetVsRealStatic2026 = () => {
  const { language } = useLanguage();
  const t = (s: string) => tr(s, language);
  const month = t("Agosto");
  const monthYear = t("Agosto 2026");
  const budgetLabel = `${t("Presupuesto")} ${month}`;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("Presupuesto vs. Real — 2026")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Valores en US$")} · {t("Acumulado a")} {monthYear} · {t("Cuadro de referencia (no en tiempo real)")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title={t("Ingresos")} budgetLabel={budgetLabel} actual={272918} budget={319235} />
        <SummaryCard title={t("Egresos")} budgetLabel={budgetLabel} actual={263563} budget={197522} />
        <SummaryCard title={t("Ingresos menos Egresos")} budgetLabel={budgetLabel} actual={9354} budget={121713} />

      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[hsl(var(--primary))] text-primary-foreground">
                  <th className="border border-border p-2 text-left font-semibold">{t("Cuenta")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Presupuesto Total Anual")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Proyección Diciembre")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{budgetLabel}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Acum. Real")} {month}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Variación")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Pendiente Ejecución")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("% Avance")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  if (r.isHeader) {
                    return (
                      <tr key={i} className="bg-muted">
                        <td className="border border-border p-2 font-bold" colSpan={8}>{t(r.label)}</td>
                      </tr>
                    );
                  }
                  const cls = r.bold ? "font-bold bg-muted/60" : "";
                  return (
                    <tr key={i} className={`${cls} hover:bg-muted/40`}>
                      <td className={`border border-border p-2 ${r.bold ? "" : "pl-6"}`}>{t(r.label)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.annual)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.projection)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.budget)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.actual)}</td>

                      <td className="border border-border p-2 text-right">{fmt(r.variance)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.pending)}</td>
                      <td className="border border-border p-2 text-right">{r.progress || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetVsRealStatic2026;
