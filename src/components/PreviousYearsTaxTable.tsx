import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const taxData = [
  { year: "2022", amount: 13631350 },
  { year: "2023", amount: 0 },
  { year: "2024", amount: 3126855 },
  { year: "2025", amount: 7389853 },
  { year: "2026", amount: 6006030 },
];

const formatCurrency = (value: number): string => {
  if (value === 0) return "-";
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const PreviousYearsTaxTable = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          {t('previousYearsTax')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">{t('year')}</TableHead>
              <TableHead className="text-right font-bold">{t('amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxData.map((item) => (
              <TableRow key={item.year}>
                <TableCell className="font-medium">{item.year}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
