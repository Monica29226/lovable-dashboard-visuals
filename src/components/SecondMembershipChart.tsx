import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

const membershipData = [
  { 
    category: 'active',
    value: 26,
    color: 'hsl(217, 33%, 51%)'
  },
  { 
    category: 'pending',
    value: 11,
    color: 'hsl(45, 70%, 66%)'
  }
];

const pendingBreakdown = [
  { label: 'Deferido', value: 1 },
  { label: 'Sin Facturar', value: 1 },
  { label: 'Pendientes', value: 2 },
  { label: 'Sin Respuesta', value: 4 },
  { label: 'Facturados', value: 3 }
];

const totalMembers = 37;
const percentage = Math.round((membershipData[0].value / totalMembers) * 100);

export const SecondMembershipChart = () => {
  const { t } = useLanguage();
  
  const chartData = membershipData.map(item => ({
    name: item.category === 'active' ? 'Realizaron Aportes' : 'Faltan por Realizar',
    value: item.value,
    color: item.color
  }));
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} {t('associates')} ({Math.round((data.value / totalMembers) * 100)}%)
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-lg font-bold text-[hsl(217,33%,51%)] uppercase">
          {t('associates')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('associatesSubtitle')}
        </p>
        <div className="text-xl font-semibold text-[hsl(217,33%,51%)] mt-2">
          Total: {totalMembers} {t('associates')}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="square"
              formatter={(value, entry: any) => (
                <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-4 bg-[hsl(217,33%,51%)]/10 rounded-lg">
            <div className="text-3xl font-bold text-[hsl(217,33%,51%)]">{membershipData[0].value}</div>
            <div className="text-xs text-muted-foreground mt-1">Realizaron Aportes</div>
          </div>
          <div className="text-center p-4 bg-[hsl(45,70%,66%)]/10 rounded-lg">
            <div className="text-3xl font-bold text-[hsl(45,70%,66%)]">{membershipData[1].value}</div>
            <div className="text-xs text-muted-foreground mt-1">Faltan por Realizar</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">
            Desglose de Faltan por Realizar ({membershipData[1].value})
          </h4>
          <div className="space-y-2">
            {pendingBreakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-foreground">{item.label}</span>
                <span className="font-semibold text-[hsl(217,33%,51%)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
