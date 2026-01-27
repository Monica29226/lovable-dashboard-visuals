// Datos compartidos del Balance General (en US$)
export const balanceSheetData = {
  assets: {
    current: {
      dec2024: {
        cashColones: 1621,
        cashDollars: 79893,
        totalCash: 81520,
        accountsReceivable: 32961,
        accountsReceivableBNCR: 0,
        deferredTax: 29038,
        anticipatedRent: 3652,
        totalCurrent: 147171
      },
      dec2025: {
        cashColones: 12687,
        cashDollars: 89835,
        totalCash: 102522,
        accountsReceivable: 46112,
        accountsReceivableBNCR: 0,
        deferredTax: 29693,
        anticipatedRent: 3854,
        totalCurrent: 182181
      }
    },
    nonCurrent: {
      dec2024: {
        furnitureEquipment: 0,
        computerEquipment: 26445,
        accumulatedDepreciation: -18932,
        totalNonCurrent: 7513,
        totalAssets: 154684
      },
      dec2025: {
        furnitureEquipment: 0,
        computerEquipment: 26358,
        accumulatedDepreciation: -22579,
        totalNonCurrent: 3779,
        totalAssets: 185961
      }
    }
  },
  liabilities: {
    current: {
      dec2024: {
        accountsPayable: 73,
        taxesPayable: 3386,
        incomeTaxPayable: 0,
        accumulatedExpenses: 16255,
        otherPayables: 0,
        totalCurrent: 19714,
        totalLiabilities: 19714
      },
      dec2025: {
        accountsPayable: 974,
        taxesPayable: 4854,
        incomeTaxPayable: 0,
        accumulatedExpenses: 1423,
        otherPayables: 855,
        totalCurrent: 8107,
        totalLiabilities: 8107
      }
    }
  },
  equity: {
    dec2024: {
      retainedEarnings: 51232,
      translationAdjustment: 39120,
      currentYearResult: 44618,
      totalEquity: 134970
    },
    dec2025: {
      retainedEarnings: 134970,
      translationAdjustment: -3019,
      currentYearResult: 45903,
      totalEquity: 177854
    }
  }
};

// Datos históricos de patrimonio (años anteriores a 2024)
export const historicalPatrimony = [
  {
    year: "2022",
    patrimony: 16835.96,
    displayValue: "$16,836"
  },
  {
    year: "2023", 
    patrimony: 51292.61,
    displayValue: "$51,293"
  }
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
