import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeeRow {
  description: string;
  associates: number;
  quota: number | null;
  amount: number;
}

const AssociateFeeComposition = () => {
  const feeData: FeeRow[] = [
    { description: "Cuota Regular", associates: 30.00, quota: 5000.00, amount: 150000.00 },
    { description: "Cuota Especial 1", associates: 1.00, quota: 15000.00, amount: 15000.00 },
    { description: "Cuota Especial 2", associates: 2.00, quota: 30000.00, amount: 60000.00 },
    { description: "Sin Cuota", associates: 2.00, quota: null, amount: 0 },
    { description: "Cuota Reducida 1", associates: 1.00, quota: 5650.00, amount: 5650.00 },
    { description: "Cuota Reducida 2", associates: 1.00, quota: 10000.00, amount: 10000.00 },
  ];

  const totalAssociates = feeData.reduce((sum, row) => sum + row.associates, 0);
  const totalAmount = feeData.reduce((sum, row) => sum + row.amount, 0);

  const formatNumber = (value: number | null): string => {
    if (value === null) return "-";
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary">
          Composición de Cuotas de Asociados 2026
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="border p-2 text-left">Asociados</th>
                <th className="border p-2 text-right">Asociados</th>
                <th className="border p-2 text-right">Cuota</th>
                <th className="border p-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {feeData.map((row, index) => (
                <tr key={index} className="hover:bg-muted/50 transition-colors">
                  <td className="border p-2">{row.description}</td>
                  <td className="border p-2 text-right">{formatNumber(row.associates)}</td>
                  <td className="border p-2 text-right">{formatNumber(row.quota)}</td>
                  <td className="border p-2 text-right">${formatNumber(row.amount)}</td>
                </tr>
              ))}
              <tr className="bg-primary/10 font-bold">
                <td className="border p-2">Total</td>
                <td className="border p-2 text-right text-primary">{formatNumber(totalAssociates)}</td>
                <td className="border p-2"></td>
                <td className="border p-2 text-right text-primary border-2 border-primary">
                  ${formatNumber(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssociateFeeComposition;
