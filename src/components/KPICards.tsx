
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle } from "lucide-react";

const kpiData = [
  { title: "Activos", value: 212521.39, color: "bg-blue-500" },
  { title: "Pasivos", value: 16613.06, color: "bg-orange-500" },
  { title: "Patrimonio", value: 195908.41, color: "bg-green-500" },
  { title: "Presupuesto Ingresos", value: 162868198.63, color: "bg-red-500" },
  { title: "Ejecución Real Ingresos", value: 85420038.63, color: "bg-purple-500" },
  { title: "Faltante por Ejecutar", value: 77448160.0, color: "bg-amber-600" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const KPICards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpiData.map((kpi, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <Circle className={`h-4 w-4 ${kpi.color} rounded-full`} fill="currentColor" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(kpi.value)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpi.title === "Patrimonio" ? "Capital neto disponible" : 
               kpi.title === "Faltante por Ejecutar" ? "Pendiente de ejecución" : 
               "Monto total registrado"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
