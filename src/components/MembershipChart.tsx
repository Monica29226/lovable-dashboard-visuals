import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const membershipData = [
  { 
    name: 'Contratos',
    value: 25,
    color: 'hsl(217, 33%, 51%)'
  },
  { 
    name: 'Disponibles',
    value: 55,
    color: 'hsl(217, 20%, 88%)'
  }
];

const totalCapacity = 80;

export const MembershipChart = () => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} Empresas ({Math.round((data.value / totalCapacity) * 100)}%)
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-[hsl(217,33%,51%)] uppercase">
          Contratos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribución de empresas - Diciembre 2025
        </p>
        <div className="text-2xl font-bold text-[hsl(217,33%,51%)]">
          Total: {membershipData[0].value}/{totalCapacity} Empresas
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={membershipData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={0}
              dataKey="value"
            >
              {membershipData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="square"
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="flex justify-center mt-4">
          <div className="text-center p-3 bg-[hsl(217,33%,51%)]/10 rounded-lg w-1/2">
            <div className="text-2xl font-bold text-[hsl(217,33%,51%)]">25</div>
            <div className="text-sm text-muted-foreground">Contratos</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
