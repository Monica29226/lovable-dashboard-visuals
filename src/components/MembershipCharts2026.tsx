import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const associatesData = [
  { name: 'Pago completo', value: 11, color: 'hsl(142, 71%, 45%)' },
  { name: 'Gestión de cobro', value: 14, color: 'hsl(220, 9%, 60%)' },
  { name: 'Sin facturar', value: 7, color: 'hsl(271, 60%, 55%)' },
  { name: 'Detenido', value: 3, color: 'hsl(0, 72%, 51%)' },
  { name: 'Facturado', value: 3, color: 'hsl(217, 91%, 60%)' },
];

const totalAssociates = 38;

const contractsData = [
  { name: 'Pagados', value: 8, color: 'hsl(217, 33%, 51%)' },
  { name: 'Pendientes', value: 17, color: 'hsl(217, 20%, 88%)' },
];

const totalContracts = 25;

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Asociados */}
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-[hsl(217,33%,51%)] uppercase">
            Asociados
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribución de asociados - Febrero 2026
          </p>
          <div className="text-2xl font-bold text-[hsl(217,33%,51%)]">
            Total: {totalAssociates} Asociados
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
              <Tooltip content={<CustomTooltip total={totalAssociates} unit="Asociados" />} />
              <Legend verticalAlign="bottom" height={36} iconType="square"
                formatter={(value: string) => <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-4 bg-[hsl(217,33%,51%)]/10 rounded-lg">
              <div className="text-3xl font-bold text-[hsl(217,33%,51%)]">{associatesData[0].value}</div>
              <div className="text-xs text-muted-foreground mt-1">Realizaron Aportes</div>
            </div>
            <div className="text-center p-4 bg-[hsl(45,70%,66%)]/10 rounded-lg">
              <div className="text-3xl font-bold text-[hsl(45,70%,66%)]">{associatesData[1].value}</div>
              <div className="text-xs text-muted-foreground mt-1">Faltan por Realizar</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contratos */}
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-[hsl(217,33%,51%)] uppercase">
            Contratos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribución de empresas - Febrero 2026
          </p>
          <div className="text-2xl font-bold text-[hsl(217,33%,51%)]">
            Total: {contractsData[0].value}/{totalContracts} Empresas
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
              <Tooltip content={<CustomTooltip total={totalContracts} unit="Empresas" />} />
              <Legend verticalAlign="bottom" height={36} iconType="square"
                formatter={(value: string) => <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center mt-4">
            <div className="text-center p-3 bg-[hsl(217,33%,51%)]/10 rounded-lg w-1/2">
              <div className="text-2xl font-bold text-[hsl(217,33%,51%)]">8</div>
              <div className="text-sm text-muted-foreground">Pagados</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
