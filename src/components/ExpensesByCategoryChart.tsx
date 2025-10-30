import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const overBudgetItems = [
  { name: 'Comunicación y Mercadeo', amount: 15039 },
  { name: 'Servicios Profesionales', amount: 10059 },
  { name: 'Viáticos', amount: 9999 },
  { name: 'Tencología', amount: 3063 },
  { name: 'Depreciación', amount: 2242 }
];

const totalAmount = 40401;

export const ExpensesByCategoryChart = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Partidas con gastos mayores al Presupuesto
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          a setiembre 2025
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {overBudgetItems.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:border-destructive/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-destructive rounded-full flex-shrink-0"></div>
                <span className="text-foreground font-medium">{item.name}</span>
              </div>
              <span className="text-lg font-bold text-foreground whitespace-nowrap">
                ${item.amount.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between px-3">
            <span className="text-foreground font-bold">Total</span>
            <span className="text-xl font-bold text-foreground">
              ${totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
