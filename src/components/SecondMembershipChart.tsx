import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

const membershipData = [
  { 
    category: 'active',
    value: 24,
    color: 'hsl(var(--primary))'
  },
  { 
    category: 'pending',
    value: 13,
    color: 'hsl(var(--accent))'
  }
];

const totalMembers = 37;

export const SecondMembershipChart = () => {
  const { t } = useLanguage();
  
  const chartData = membershipData.map(item => ({
    name: t(item.category === 'active' ? 'associatesActive' : 'associatesPending'),
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
        <CardTitle className="text-xl font-bold text-foreground">
          {t('associates')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('associatesSubtitle')}
        </p>
        <div className="text-2xl font-bold text-primary">
          {t('total')}: {totalMembers} {t('associates')}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
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
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{membershipData[0].value}</div>
            <div className="text-sm text-muted-foreground">{t('associatesActive')}</div>
          </div>
          <div className="text-center p-3 bg-accent/10 rounded-lg">
            <div className="text-2xl font-bold text-accent">{membershipData[1].value}</div>
            <div className="text-sm text-muted-foreground">{t('associatesPending')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
