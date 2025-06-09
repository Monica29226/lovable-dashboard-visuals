
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useState } from 'react';

// Paleta de colores Seaborn
const seabornColors = {
  blue: '#4c72b0',
  orange: '#dd8452', 
  green: '#55a868',
  red: '#c44e52',
  purple: '#8172b3',
  brown: '#937860'
};

// Datos de gastos principales por mes
const mainExpenseData = [
  {
    category: 'Personal',
    mayo: 20473,
    junio: 19248,
    julio: 21582,
    agosto: 20213,
    septiembre: 20265,
    total: 101781,
    color: seabornColors.blue,
    subcuentas: [
      { name: 'Salarios', mayo: 14436, junio: 14143, julio: 14873, agosto: 14923, septiembre: 14370, total: 73404 },
      { name: 'Aguinaldo 8.33%', mayo: 1208, junio: 1178, julio: 1239, agosto: 1243, septiembre: 1247, total: 6115 },
      { name: 'CCSS - I.P.T Otros 26.67%', mayo: 3866, junio: 3767, julio: 3967, agosto: 3980, septiembre: 3983, total: 19563 },
      { name: 'Pólizas', mayo: 46, junio: 0, julio: 1430, agosto: 0, septiembre: 0, total: 1476 },
      { name: 'Prestaciones Sociales', mayo: 740, junio: 0, julio: 0, agosto: 0, septiembre: 0, total: 740 },
      { name: 'Beneficios Salud', mayo: 116, junio: 160, julio: 73, agosto: 67, septiembre: 60, total: 476 }
    ]
  },
  {
    category: 'Gastos administrativos',
    mayo: 1214,
    junio: 1204,
    julio: 1900,
    agosto: 2204,
    septiembre: 1020,
    total: 7542,
    color: seabornColors.orange,
    subcuentas: [
      { name: 'Alquiler Oficinas y Parqueos', mayo: 854, junio: 951, julio: 1664, agosto: 1950, septiembre: 864, total: 6343 },
      { name: 'Telefonía Celular', mayo: 86, junio: 86, julio: 67, agosto: 86, septiembre: 13, total: 357 },
      { name: 'Suministros de Oficina', mayo: 268, junio: 126, julio: 144, agosto: 172, septiembre: 120, total: 831 },
      { name: 'Combustibles', mayo: 5, junio: 1, julio: 5, agosto: 4, septiembre: 4, total: 11 }
    ]
  },
  {
    category: 'Representación',
    mayo: 2365,
    junio: 3003,
    julio: 2144,
    agosto: 2316,
    septiembre: 2419,
    total: 12246,
    color: seabornColors.green,
    subcuentas: [
      { name: 'Viáticos', mayo: 1345, junio: 1550, julio: 1467, agosto: 1534, septiembre: 1092, total: 7068 },
      { name: 'Combustible', mayo: 313, junio: 370, julio: 312, agosto: 344, septiembre: 367, total: 1706 },
      { name: 'Viajes', mayo: 553, junio: 743, julio: 0, agosto: 200, septiembre: 628, total: 2124 },
      { name: 'Otros gastos de representación', mayo: 155, junio: 339, julio: 345, agosto: 178, septiembre: 333, total: 1349 }
    ]
  },
  {
    category: 'Comunicación y Mercadeo',
    mayo: 76,
    junio: 860,
    julio: 248,
    agosto: 448,
    septiembre: 2324,
    total: 3957,
    color: seabornColors.red,
    subcuentas: [
      { name: 'Pauta Redes Sociales', mayo: 76, junio: 79, julio: 248, agosto: 448, septiembre: 334, total: 1186 },
      { name: 'Pauta Medios de Comunicación', mayo: 0, junio: 781, julio: 0, agosto: 0, septiembre: 1990, total: 2771 }
    ]
  },
  {
    category: 'Servicios Profesionales',
    mayo: 1498,
    junio: 1646,
    julio: 2068,
    agosto: 2208,
    septiembre: 2580,
    total: 10019,
    color: seabornColors.purple,
    subcuentas: [
      { name: 'Legal', mayo: 33, junio: 120, julio: 525, agosto: 808, septiembre: 0, total: 1546 },
      { name: 'Contabilidad', mayo: 401, junio: 393, julio: 393, agosto: 400, septiembre: 401, total: 2000 },
      { name: 'Otros servicios profesionales', mayo: 1004, junio: 1127, julio: 1164, agosto: 999, septiembre: 2179, total: 6473 }
    ]
  },
  {
    category: 'Tecnología',
    mayo: 3937,
    junio: 2413,
    julio: 2332,
    agosto: 2405,
    septiembre: 2272,
    total: 13440,
    color: seabornColors.brown,
    subcuentas: [
      { name: 'Soporte TI', mayo: 63, junio: 62, julio: 71, agosto: 71, septiembre: 63, total: 323 },
      { name: 'Soporte desarrollos tecnológicos', mayo: 2323, junio: 1587, julio: 1364, agosto: 1535, septiembre: 1246, total: 8155 },
      { name: 'Seguridad de la información', mayo: 0, junio: 0, julio: 0, agosto: 0, septiembre: 0, total: 0 },
      { name: 'Cuotas y Suscripciones', mayo: 1551, junio: 765, julio: 897, agosto: 799, septiembre: 964, total: 4376 }
    ]
  }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const ExpensesByMonthChart = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('total');

  const months = ['mayo', 'junio', 'julio', 'agosto', 'septiembre', 'total'];
  const monthLabels = {
    mayo: 'Mayo',
    junio: 'Junio', 
    julio: 'Julio',
    agosto: 'Agosto',
    septiembre: 'Septiembre',
    total: 'Total'
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const getCurrentData = () => {
    return mainExpenseData.map(item => ({
      category: item.category,
      value: item[selectedMonth as keyof typeof item] as number,
      color: item.color
    }));
  };

  const getSubcuentaData = (category: string) => {
    const mainCategory = mainExpenseData.find(item => item.category === category);
    if (!mainCategory) return [];
    
    return mainCategory.subcuentas.map(sub => ({
      category: sub.name,
      value: sub[selectedMonth as keyof typeof sub] as number,
      color: mainCategory.color
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Gastos por Categoría - 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground mb-4">
          Haga clic en las categorías para ver el detalle de subcuentas
        </p>
        
        {/* Selector de mes */}
        <div className="flex flex-wrap gap-2">
          {months.map(month => (
            <Button
              key={month}
              variant={selectedMonth === month ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMonth(month)}
              className="text-xs"
            >
              {monthLabels[month as keyof typeof monthLabels]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={getCurrentData()} 
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Gasto']}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
              cursor="pointer"
            >
              {getCurrentData().map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  onClick={() => toggleCategory(entry.category)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Botones de expansión por categoría */}
        <div className="mt-6 space-y-4">
          {mainExpenseData.map((category) => (
            <div key={category.category} className="border rounded-lg p-4">
              <Button
                variant="ghost"
                onClick={() => toggleCategory(category.category)}
                className="w-full flex justify-between items-center p-2 hover:bg-muted"
              >
                <span className="font-medium">{category.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(category[selectedMonth as keyof typeof category] as number)}
                  </span>
                  {expandedCategory === category.category ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </Button>
              
              {expandedCategory === category.category && (
                <div className="mt-4 pl-4 border-l-2 border-muted">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart 
                      data={getSubcuentaData(category.category)}
                      margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 9 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickFormatter={formatCurrency}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Subcuenta']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill={category.color}
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
