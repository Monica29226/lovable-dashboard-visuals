import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const overBudgetItems = [
  'Prestaciones Legales',
  'Viáticos',
  'Comunicación y Mercado',
  'Tecnología',
  'Legal'
];

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
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:border-destructive/50 transition-colors"
            >
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              <span className="text-foreground font-medium">{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
