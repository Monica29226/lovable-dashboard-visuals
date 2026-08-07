import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { tr } from "@/lib/panel2026I18n";

const associatesData = [
  { name: 'Pago completo', value: 11, color: 'hsl(142, 71%, 45%)' },
  { name: 'Gestión de cobro', value: 14, color: 'hsl(220, 9%, 60%)' },
  { name: 'Sin facturar', value: 7, color: 'hsl(271, 60%, 55%)' },
  { name: 'Detenido', value: 3, color: 'hsl(0, 72%, 51%)' },
  { name: 'Facturado', value: 3, color: 'hsl(217, 91%, 60%)' },
];

const totalAssociates = 38;

const contractsData = [
  { name: 'En curso', value: 5, color: 'hsl(35, 98%, 62%)' },
  { name: 'Listo', value: 16, color: 'hsl(159, 100%, 39%)' },
  { name: 'Detenido', value: 2, color: 'hsl(351, 72%, 58%)' },
  { name: 'facturado', value: 1, color: 'hsl(199, 100%, 38%)' },
  { name: 'Por iniciar proceso', value: 5, color: 'hsl(217, 16%, 78%)' },
];

const totalContracts = 29;

const CustomTooltip = ({ active, payload, total, unit }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value} {unit} ({Math.round((data.value / total) * 100)}%)
        </p>
      </div>
    );
  }
  return null;
};

export const MembershipCharts2026 = () => {
  const { language } = useLanguage();
  const t = (s: string) => tr(s, language);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Asociados */}
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-[hsl(217,33%,51%)] uppercase">
            {t("Asociados")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("Distribución de asociados")} - {t("Julio 2026")}
          </p>
          <div className="text-2xl font-bold text-[hsl(217,33%,51%)]">
            {t("Total")}: 38 {t("Asociados")}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={associatesData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value">
                {associatesData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip total={totalAssociates} unit={t("Asociados")} />} />
              <Legend verticalAlign="bottom" height={36} iconType="square"
                formatter={(value: string) => <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{t(value)}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            {associatesData.map((entry, index) => (
              <div key={index} className="text-center p-4 rounded-lg" style={{ backgroundColor: `${entry.color}1A` }}>
                <div className="text-3xl font-bold" style={{ color: entry.color }}>{entry.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(entry.name)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contratos */}
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-[hsl(217,33%,51%)] uppercase">
            {t("Contratos")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("Distribución de contratos")} - {t("Julio 2026")}
          </p>
          <div className="text-2xl font-bold text-[hsl(217,33%,51%)]">
            {t("Total")}: {totalContracts} {t("Contratos")}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={contractsData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={0} dataKey="value">
                {contractsData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip total={totalContracts} unit={t("Empresas")} />} />
              <Legend verticalAlign="bottom" height={36} iconType="square"
                formatter={(value: string) => <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{t(value)}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center mt-4">
            <div className="text-center p-3 rounded-lg w-1/2" style={{ backgroundColor: 'hsl(159, 100%, 39%)1A' }}>
              <div className="text-2xl font-bold" style={{ color: 'hsl(159, 100%, 39%)' }}>16</div>
              <div className="text-sm text-muted-foreground">{t("Listo")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
