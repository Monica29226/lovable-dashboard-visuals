import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

// Data for 2024 (Jan-Aug actual)
const data2024 = {
  income: [
    { account: "Cuotas Asociados", amount: 180060 },
    { account: "Proyectos", amount: 134854 },
    { account: "Otros", amount: 0 }
  ],
  expenses: [
    { account: "Personal", amount: 142573 },
    { account: "Gastos administrativos", amount: 3500 },
    { account: "Representación", amount: 5224 },
    { account: "Comunicación y Mercadeo", amount: 5831 },
    { account: "Alquiler Oficinas y Parqueos", amount: 8605 },
    { account: "Eventos", amount: 2800 },
    { account: "Servicios Profesionales", amount: 9023 },
    { account: "Tecnología", amount: 15460 },
    { account: "Impuestos", amount: 2971 },
    { account: "Otros Gastos", amount: 11576 },
    { account: "Depreciación", amount: 2097 }
  ]
};

// Data for 2025 (Aug actual)
const data2025 = {
  income: [
    { account: "Cuotas Asociados", amount: 135000 },
    { account: "Proyectos", amount: 148465 },
    { account: "Otros", amount: 0 }
  ],
  expenses: [
    { account: "Personal", amount: 166021 },
    { account: "Gastos administrativos", amount: 1721 },
    { account: "Representación", amount: 21760 },
    { account: "Comunicación y Mercadeo", amount: 20049 },
    { account: "Alquiler Oficinas y Parqueos", amount: 9697 },
    { account: "Eventos", amount: 0 },
    { account: "Servicios Profesionales", amount: 20304 },
    { account: "Tecnología", amount: 22591 },
    { account: "Impuestos", amount: 4493 },
    { account: "Otros Gastos", amount: 0 },
    { account: "Depreciación", amount: 1992 }
  ]
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const DetailedIncomeStatement = () => {
  const { t } = useLanguage();
  
  const totalIncome2024 = data2024.income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses2024 = data2024.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netResult2024 = totalIncome2024 - totalExpenses2024;
  
  const totalIncome2025 = data2025.income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses2025 = data2025.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netResult2025 = totalIncome2025 - totalExpenses2025;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 2024 Statement */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('resultsTitle')} - 2024
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enero-Diciembre 2024 (Real)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Income Section */}
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-3 border-b pb-2">
              {t('income')}
            </h3>
            <div className="space-y-2">
              {data2024.income.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">{item.account}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-foreground">Total {t('income')}</span>
                  <span className="text-primary">{formatCurrency(totalIncome2024)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-3 border-b pb-2">
              {t('expenses')}
            </h3>
            <div className="space-y-2">
              {data2024.expenses.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">{item.account}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-foreground">Total {t('expenses')}</span>
                  <span className="text-accent">{formatCurrency(totalExpenses2024)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Result */}
          <div className="border-t-2 border-primary/20 pt-3">
            <div className="flex justify-between items-center font-bold text-lg">
              <span className="text-foreground">{t('netResult')}</span>
              <span className={`${netResult2024 >= 0 ? 'text-chart-5' : 'text-chart-4'}`}>
                {formatCurrency(netResult2024)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2025 Statement */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {t('resultsTitle')} - 2025
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Agosto 2025 (Real)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Income Section */}
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-3 border-b pb-2">
              {t('income')}
            </h3>
            <div className="space-y-2">
              {data2025.income.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">{item.account}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-foreground">Total {t('income')}</span>
                  <span className="text-primary">{formatCurrency(totalIncome2025)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-3 border-b pb-2">
              {t('expenses')}
            </h3>
            <div className="space-y-2">
              {data2025.expenses.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">{item.account}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-foreground">Total {t('expenses')}</span>
                  <span className="text-accent">{formatCurrency(totalExpenses2025)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Result */}
          <div className="border-t-2 border-primary/20 pt-3">
            <div className="flex justify-between items-center font-bold text-lg">
              <span className="text-foreground">{t('netResult')}</span>
              <span className={`${netResult2025 >= 0 ? 'text-chart-5' : 'text-chart-4'}`}>
                {formatCurrency(netResult2025)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};