// Datos compartidos del Estado de Resultados (Income Statement)
// Actualiza estos valores y todos los componentes se actualizarán automáticamente

export const incomeStatementData = {
  period: 'Diciembre 2025',
  periodEn: 'December 2025',
  
  income: {
    cuotasAsociados: 220650,
    membresia: 222522,
    otros: 0,
    total: 443172
  },
  
  expenses: {
    personal: 233741,
    gastosAdministrativos: 20257,
    viaticos: 34288,
    comunicacionEventos: 30141,
    tecnologia: 0,
    alquiler: 0,
    serviciosProfesionales: 64307,
    impuestos: 0,
    otrosGastos: 14534,
    total: 397268
  }
};

// Calcular resultado neto automáticamente
export const getNetResult = () => {
  return incomeStatementData.income.total - incomeStatementData.expenses.total;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Datos estructurados para gráficos
export const getIncomeExpensesChartData = () => {
  return [
    {
      category: 'Ingresos',
      categoryEn: 'Income',
      amount: incomeStatementData.income.total,
      color: 'hsl(207, 100%, 28%)', // Azul institucional
      details: [
        { name: 'Cuotas Asociados', amount: incomeStatementData.income.cuotasAsociados },
        { name: 'Membresía', amount: incomeStatementData.income.membresia },
        { name: 'Otros', amount: incomeStatementData.income.otros }
      ]
    },
    {
      category: 'Egresos',
      categoryEn: 'Expenses', 
      amount: incomeStatementData.expenses.total,
      color: 'hsl(45, 98%, 59%)', // Amarillo energía
      details: [
        { name: 'Personal', amount: incomeStatementData.expenses.personal },
        { name: 'Gastos Administrativos', amount: incomeStatementData.expenses.gastosAdministrativos },
        { name: 'Viáticos y Giras', amount: incomeStatementData.expenses.viaticos },
        { name: 'Comunicación y Mercadeo', amount: incomeStatementData.expenses.comunicacionEventos },
        { name: 'Servicios Profesionales', amount: incomeStatementData.expenses.serviciosProfesionales },
        { name: 'Otros Gastos', amount: incomeStatementData.expenses.otrosGastos }
      ]
    }
  ];
};
