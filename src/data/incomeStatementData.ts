// Datos compartidos del Estado de Resultados (Income Statement)
// Actualiza estos valores y todos los componentes se actualizarán automáticamente

export const incomeStatementData = {
  period: 'Diciembre 2025',
  periodEn: 'December 2025',
  
  income: {
    cuotasAsociados: 220650,
    membresia: 222522,
    ingresoRentaDiferido: 2400,
    otros: 0,
    total: 445572
  },
  
  expenses: {
    personal: 233741,
    gastosAdministrativos: 20269,
    viaticos: 34288,
    comunicacionEventos: 30141,
    serviciosProfesionales: 32317,
    tecnologia: 31990,
    otrosGastosPatenteIVA: 14534,
    impuestoRenta: 11841,
    alquiler: 0,
    impuestos: 0,
    otrosGastos: 0,
    total: 409122
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
      color: 'hsl(207, 100%, 28%)',
      details: [
        { name: 'Cuotas Asociados', amount: incomeStatementData.income.cuotasAsociados },
        { name: 'Membresía', amount: incomeStatementData.income.membresia },
        { name: 'Ingreso Renta Diferido', amount: incomeStatementData.income.ingresoRentaDiferido }
      ]
    },
    {
      category: 'Egresos',
      categoryEn: 'Expenses', 
      amount: incomeStatementData.expenses.total,
      color: 'hsl(45, 98%, 59%)',
      details: [
        { name: 'Personal', amount: incomeStatementData.expenses.personal },
        { name: 'Gastos Administrativos', amount: incomeStatementData.expenses.gastosAdministrativos },
        { name: 'Viáticos y Giras', amount: incomeStatementData.expenses.viaticos },
        { name: 'Comunicación y Mercadeo', amount: incomeStatementData.expenses.comunicacionEventos },
        { name: 'Servicios Profesionales', amount: incomeStatementData.expenses.serviciosProfesionales },
        { name: 'Tecnología', amount: incomeStatementData.expenses.tecnologia },
        { name: 'Otros Gastos / Patente / IVA', amount: incomeStatementData.expenses.otrosGastosPatenteIVA },
        { name: 'Impuesto de Renta', amount: incomeStatementData.expenses.impuestoRenta }
      ]
    }
  ];
};
