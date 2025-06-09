
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

// Datos de gastos totales por mes
const monthlyTotalExpenses = [
  { month: 'Enero', total: 29563, color: seabornColors.blue },
  { month: 'Febrero', total: 28374, color: seabornColors.orange },
  { month: 'Marzo', total: 30272, color: seabornColors.green },
  { month: 'Abril', total: 29794, color: seabornColors.red },
  { month: 'Mayo', total: 29563, color: seabornColors.purple }
];

// Datos de gastos por categoría para el drill-down (mantenemos los datos originales)
const categoryExpenseData = [
  {
    category: 'Personal',
    enero: 20473,
    febrero: 19248,
    marzo: 21582,
    abril: 20213,
    mayo: 20265,
    total: 101781,
    color: seabornColors.blue,
    subcuentas: [
      { name: 'Salarios', enero: 14436, febrero: 14143, marzo: 14873, abril: 14923, mayo: 14370, total: 73404 },
      { name: 'Aguinaldo 8.33%', enero: 1208, febrero: 1178, marzo: 1239, abril: 1243, mayo: 1247, total: 6115 },
      { name: 'CCSS - I.P.T Otros 26.67%', enero: 3866, febrero: 3767, marzo: 3967, abril: 3980, mayo: 3983, total: 19563 },
      { name: 'Pólizas', enero: 46, febrero: 0, marzo: 1430, abril: 0, mayo: 0, total: 1476 },
      { name: 'Prestaciones Sociales', enero: 740, febrero: 0, marzo: 0, abril: 0, mayo: 0, total: 740 },
      { name: 'Beneficios Salud', enero: 116, febrero: 160, marzo: 73, abril: 67, mayo: 60, total: 476 }
    ]
  },
  {
    category: 'Gastos administrativos',
    enero: 1214,
    febrero: 1204,
    marzo: 1900,
    abril: 2204,
    mayo: 1020,
    total: 7542,
    color: seabornColors.orange,
    subcuentas: [
      { name: 'Alquiler Oficinas y Parqueos', enero: 854, febrero: 951, marzo: 1664, abril: 1950, mayo: 864, total: 6343 },
      { name: 'Telefonía Celular', enero: 86, febrero: 86, marzo: 67, abril: 86, mayo: 13, total: 357 },
      { name: 'Suministros de Oficina', enero: 268, febrero: 126, marzo: 144, abril: 172, mayo: 120, total: 831 },
      { name: 'Combustibles', enero: 5, febrero: 1, marzo: 5, abril: 4, mayo: 4, total: 11 }
    ]
  },
  {
    category: 'Representación',
    enero: 2365,
    febrero: 3003,
    marzo: 2144,
    abril: 2316,
    mayo: 2419,
    total: 12246,
    color: seabornColors.green,
    subcuentas: [
      { name: 'Viáticos', enero: 1345, febrero: 1550, marzo: 1467, abril: 1534, mayo: 1092, total: 7068 },
      { name: 'Combustible', enero: 313, febrero: 370, marzo: 312, abril: 344, mayo: 367, total: 1706 },
      { name: 'Viajes', enero: 553, febrero: 743, marzo: 0, abril: 200, mayo: 628, total: 2124 },
      { name: 'Otros gastos de representación', enero: 155, febrero: 339, marzo: 345, abril: 178, mayo: 333, total: 1349 }
    ]
  },
  {
    category: 'Comunicación y Mercadeo',
    enero: 76,
    febrero: 860,
    marzo: 248,
    abril: 448,
    mayo: 2324,
    total: 3957,
    color: seabornColors.red,
    subcuentas: [
      { name: 'Pauta Redes Sociales', enero: 76, febrero: 79, marzo: 248, abril: 448, mayo: 334, total: 1186 },
      { name: 'Pauta Medios de Comunicación', enero: 0, febrero: 781, marzo: 0, abril: 0, mayo: 1990, total: 2771 }
    ]
  },
  {
    category: 'Servicios Profesionales',
    enero: 1498,
    febrero: 1646,
    marzo: 2068,
    abril: 2208,
    mayo: 2580,
    total: 10019,
    color: seabornColors.purple,
    subcuentas: [
      { name: 'Legal', enero: 33, febrero: 120, marzo: 525, abril: 808, mayo: 0, total: 1546 },
      { name: 'Contabilidad', enero: 401, febrero: 393, marzo: 393, abril: 400, mayo: 401, total: 2000 },
      { name: 'Otros servicios profesionales', enero: 1004, febrero: 1127, marzo: 1164, abril: 999, mayo: 2179, total: 6473 }
    ]
  },
  {
    category: 'Tecnología',
    enero: 3937,
    febrero: 2413,
    marzo: 2332,
    abril: 2405,
    mayo: 2272,
    total: 13440,
    color: seabornColors.brown,
    subcuentas: [
      { name: 'Soporte TI', enero: 63, febrero: 62, marzo: 71, abril: 71, mayo: 63, total: 323 },
      { name: 'Soporte desarrollos tecnológicos', enero: 2323, febrero: 1587, marzo: 1364, abril: 1535, mayo: 1246, total: 8155 },
      { name: 'Seguridad de la información', enero: 0, febrero: 0, marzo: 0, abril: 0, mayo: 0, total: 0 },
      { name: 'Cuotas y Suscripciones', enero: 1551, febrero: 765, marzo: 897, abril: 799, mayo: 964, total: 4376 }
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
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('total');

  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'total'];
  const monthLabels = {
    enero: 'Enero',
    febrero: 'Febrero', 
    marzo: 'Marzo',
    abril: 'Abril',
    mayo: 'Mayo',
    total: 'Total'
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const getCategoryData = () => {
    return categoryExpenseData.map(item => ({
      category: item.category,
      value: item[selectedMonth as keyof typeof item] as number,
      color: item.color
    }));
  };

  const getSubcuentaData = (category: string) => {
    const mainCategory = categoryExpenseData.find(item => item.category === category);
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
          Gastos Totales por Mes - 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground mb-4">
          Vista general de gastos mensuales y desglose por categorías
        </p>
        
        <div className="flex gap-4">
          <Button
            variant={!showCategoryDetails ? "default" : "outline"}
            onClick={() => setShowCategoryDetails(false)}
            size="sm"
          >
            Totales por Mes
          </Button>
          <Button
            variant={showCategoryDetails ? "default" : "outline"}
            onClick={() => setShowCategoryDetails(true)}
            size="sm"
          >
            Por Categorías
          </Button>
        </div>

        {showCategoryDetails && (
          <div className="flex flex-wrap gap-2 mt-4">
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
        )}
      </CardHeader>
      <CardContent>
        {!showCategoryDetails ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={monthlyTotalExpenses} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 16, fontWeight: 'bold' }}
                className="text-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Gasto Total']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="total" 
                radius={[4, 4, 0, 0]}
              >
                {monthlyTotalExpenses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={getCategoryData()} 
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  className="text-foreground"
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
                  {getCategoryData().map((entry, index) => (
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
              {categoryExpenseData.map((category) => (
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
                            tick={{ fontSize: 10, fontWeight: 'bold' }}
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
          </>
        )}
      </CardContent>
    </Card>
  );
};
