import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const financialData = {
  income: {
    actual: 283465,
    budget: 562709,
    progress: 50
  },
  expenses: {
    actual: 268626, 
    budget: 353078,
    progress: 76
  },
  netResult: 14838
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value}%`;
};

export const TotalIncomeStatement = () => {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('totalResults')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('totalResultsSubtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">{t('income')}</TableHead>
                <TableHead className="font-semibold">{t('expenses')}</TableHead>
                <TableHead className="font-semibold">{t('netResult')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-green-600">
                  {formatCurrency(financialData.income.actual)}
                </TableCell>
                <TableCell className="font-medium text-red-600">
                  {formatCurrency(financialData.expenses.actual)}
                </TableCell>
                <TableCell className="font-bold text-primary">
                  {formatCurrency(financialData.netResult)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('budget')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('budgetSubtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('incomeProgress')}</span>
                <Badge variant="secondary">
                  {formatPercentage(financialData.income.progress)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(financialData.income.actual)} / {formatCurrency(financialData.income.budget)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('expensesProgress')}</span>
                <Badge variant="destructive">
                  {formatPercentage(financialData.expenses.progress)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(financialData.expenses.actual)} / {formatCurrency(financialData.expenses.budget)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};