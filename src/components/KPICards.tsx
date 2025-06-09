
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle } from "lucide-react";

const kpiData = [
  { title: "Total Activo Corriente", value: 205008, color: "bg-blue-500" },
  { title: "Total Pasivos", value: 0, color: "bg-orange-500" }, // No se muestra pasivos en las imágenes
  { title: "Patrimonio", value: 205008, color: "bg-green-500" }, // Asumiendo que Patrimonio = Activos - Pasivos
  { title: "Presupuesto Total Ingresos", value: 562709, color: "bg-red-500" },
  { title: "Ejecución Real Ingresos (Mayo)", value: 227717, color: "bg-purple-500" },
  { title: "Pendiente Ejecución", value: 334992, color: "bg-amber-600" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
              {kpi.title === "Total Activo Corriente" ? "Recursos disponibles" : 
               kpi.title === "Pendiente Ejecución" ? "Por ejecutar en el año" : 
               "Monto registrado"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
