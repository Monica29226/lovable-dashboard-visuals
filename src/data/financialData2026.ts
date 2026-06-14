// Datos centralizados del Panel 2026 - Mayo 2026
// Actualiza estos valores y todos los componentes del Panel 2026 se actualizarán automáticamente

export const financialData2026 = {
  period: 'Mayo 2026',
  periodEn: 'May 2026',

  // ─── Estado de Resultados (Income Statement) ───────────────────
  incomeStatement: {
    income: {
      cuotasAsociados: 56902.72,
      comunidad: 78492.73,
      ingresoRentaDiferido: 0,
      total: 135395.45,
    },
    expenses: {
      personal: 69520.30,
      gastosAdministrativos: 7165.31,
      viaticosGiras: 11077.56,
      comunicacionMercadeo: 11674.37,
      serviciosProfesionales: 14943.82,
      tecnologia: 11230.87,
      otrosGastosPatente: 1362.37, // Impuestos 864.63 + Otros 0 + Depreciación 497.74
      impuestoRenta: 0,
      total: 126974.61,
    },
    netResult: 8420.84, // Ingresos menos Gastos
  },

  // ─── Estado de Posición Financiera (Balance Sheet) ─────────────
  balanceSheet: {
    assets: {
      current: {
        cashColones: 4155.16,
        cashDollars: 145020.55,
        totalCash: 149175.71,
        accountsReceivable: 22944.38,
        accountsReceivableBNCR: 0,
        otherAccountsReceivable: -1622.49,
        totalAccountsReceivable: 21321.89,
        deferredTax: 32837.60,
        anticipatedRent: 0,
        totalCurrent: 203335.20,
      },
      nonCurrent: {
        furnitureEquipment: 0,
        computerEquipment: 27555.60,
        accumulatedDepreciation: -23076.31,
        totalNonCurrent: 4479.29,
      },
      totalAssets: 207814.49,
    },
    liabilities: {
      accountsPayable: 6554.08,
      taxesPayable: 1826.62,
      incomeTaxPayable: -2715.08,
      accumulatedExpenses: 10724.86,
      otherPayables: 0,
      totalCurrent: 16390.48,
      totalLiabilities: 16390.48,
    },
    equity: {
      retainedEarnings: 171244.32,
      translationAdjustment: 11758.85,
      currentYearResult: 8420.84,
      totalEquity: 191424.02,
    },
    totalLiabilitiesAndEquity: 207814.49,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────
export const getNetResult2026 = () => {
  return financialData2026.incomeStatement.netResult;
};

export const formatCurrency2026 = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const getIncomeExpensesChartData2026 = () => {
  const { income, expenses } = financialData2026.incomeStatement;
  return [
    {
      category: 'Ingresos',
      categoryEn: 'Income',
      amount: income.total,
      color: 'hsl(207, 100%, 28%)',
      details: [
        { name: 'Cuotas Asociados', amount: income.cuotasAsociados },
        { name: 'Comunidad', amount: income.comunidad },
        { name: 'Ingreso Renta Diferido', amount: income.ingresoRentaDiferido },
      ],
    },
    {
      category: 'Egresos',
      categoryEn: 'Expenses',
      amount: expenses.total,
      color: 'hsl(45, 98%, 59%)',
      details: [
        { name: 'Personal', amount: expenses.personal },
        { name: 'Gastos Administrativos', amount: expenses.gastosAdministrativos },
        { name: 'Viáticos y Giras', amount: expenses.viaticosGiras },
        { name: 'Comunicación y Mercadeo', amount: expenses.comunicacionMercadeo },
        { name: 'Servicios Profesionales', amount: expenses.serviciosProfesionales },
        { name: 'Tecnología', amount: expenses.tecnologia },
        { name: 'Otros Gastos / Patente / IVA', amount: expenses.otrosGastosPatente },
        { name: 'Impuesto de Renta', amount: expenses.impuestoRenta },
      ],
    },
  ];
};
