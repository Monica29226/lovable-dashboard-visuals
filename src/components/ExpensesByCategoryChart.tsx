import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const expensesData = [
  {
    category: 'Prestaciones Legales',
    amount: 0,
  },
  {
    category: 'Viáticos',
    amount: 0,
  },
  {
    category: 'Comunicación y Mercado',
    amount: 0,
  },
  {
    category: 'Tecnología',
    amount: 0,
  },
  {
    category: 'Legal',
    amount: 0,
  },
];

export const ExpensesByCategoryChart = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Gastos por Categoría
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribución de gastos operativos
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expensesData.map((expense, index) => (
            <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary transition-colors">
              <div className="text-sm text-muted-foreground mb-2">{expense.category}</div>
              <div className="text-2xl font-bold text-foreground">
                ${expense.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
