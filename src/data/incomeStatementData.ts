// Datos compartidos del Estado de Resultados (Income Statement)
// Actualiza estos valores y todos los componentes se actualizarán automáticamente

export const incomeStatementData = {
  period: 'Octubre 2025',
  periodEn: 'October 2025',
  
  income: {
    cuotasAsociados: 200650,
    comunidad: 215527,
    otros: 0,
    total: 416177
  },
  
  expenses: {
    personal: 200569,
    gastosAdministrativos: 15945,
    viaticos: 30093,
    comunicacionEventos: 27027,
    tecnologia: 0,
    alquiler: 0,
    serviciosProfesionales: 53012,
    impuestos: 0,
    depreciacion: 8097,
    total: 334743
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
        { name: 'Comunidad', amount: incomeStatementData.income.comunidad },
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
        { name: 'Viáticos', amount: incomeStatementData.expenses.viaticos },
        { name: 'Comunicación y Eventos', amount: incomeStatementData.expenses.comunicacionEventos },
        { name: 'Tecnología', amount: incomeStatementData.expenses.tecnologia },
        { name: 'Alquiler', amount: incomeStatementData.expenses.alquiler },
        { name: 'Servicios Profesionales', amount: incomeStatementData.expenses.serviciosProfesionales },
        { name: 'Impuestos', amount: incomeStatementData.expenses.impuestos },
        { name: 'Depreciación', amount: incomeStatementData.expenses.depreciacion }
      ]
    }
  ];
};
