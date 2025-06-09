
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle } from "lucide-react";

const kpiData = [
  { title: "Total Activos", value: 229208, color: "bg-blue-500", unit: "USD" },
  { title: "Total Pasivos", value: 24200, color: "bg-orange-500", unit: "USD" },
  { title: "Patrimonio", value: 205008, color: "bg-green-500", unit: "USD" },
  { title: "Beneficiarios Activos", value: 85, color: "bg-red-500", unit: "%" },
  { title: "Satisfacción Beneficiarios", value: 91, color: "bg-purple-500", unit: "%" },
  { title: "Ejecución Presupuestaria", value: 94, color: "bg-amber-600", unit: "%" },
];

const formatValue = (value: number, unit: string) => {
  if (unit === "USD") {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return `${value}${unit}`;
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
              {formatValue(kpi.value, kpi.unit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpi.title === "Total Activos" ? "Recursos disponibles" : 
               kpi.title === "Beneficiarios Activos" ? "vs. año anterior" : 
               kpi.title === "Satisfacción Beneficiarios" ? "Promedio encuestas" :
               kpi.title === "Ejecución Presupuestaria" ? "Cumplimiento anual" :
               "Monto registrado"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
