
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Paleta de colores Seaborn
const seabornColors = {
  blue: '#4c72b0',
  orange: '#dd8452', 
  green: '#55a868',
  red: '#c44e52',
  purple: '#8172b3',
  brown: '#937860'
};

const okrData = [
  {
    objective: "Aumentar el impacto positivo en las comunidades",
    keyResults: [
      { name: "Beneficiarios activos", value: 85, target: 100, color: seabornColors.blue },
      { name: "Satisfacción beneficiarios", value: 91, target: 100, color: seabornColors.orange },
      { name: "Nuevos programas lanzados", value: 2, target: 3, color: seabornColors.green }
    ]
  },
  {
    objective: "Fortalecer la sostenibilidad financiera",
    keyResults: [
      { name: "Incremento membresías", value: 28, target: 30, color: seabornColors.red },
      { name: "Nuevas alianzas logradas", value: 3, target: 5, color: seabornColors.purple },
      { name: "Ejecución presupuestaria", value: 94, target: 100, color: seabornColors.brown }
    ]
  }
];

export const OKRProgressChart = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {okrData.map((okr, okrIndex) => (
        <Card key={okrIndex} className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              {okr.objective}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Progreso de Key Results (KRs)
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {okr.keyResults.map((kr, krIndex) => {
              const percentage = Math.round((kr.value / kr.target) * 100);
              return (
                <div key={krIndex} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{kr.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {kr.value}/{kr.target} ({percentage}%)
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{
                      '--progress-background': kr.color
                    } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
