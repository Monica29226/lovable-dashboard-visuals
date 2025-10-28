import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import { useState } from "react";

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const TaxProjectionCard = () => {
  // Ingresos
  const [cuotasAsociadosSep, setCuotasAsociadosSep] = useState(95957791.10);
  const [cuotasAsociadosOctDic, setCuotasAsociadosOctDic] = useState(20200000.00);
  const [comunidadSep, setComunidadSep] = useState(114726528.64);
  const [comunidadOctDic, setComunidadOctDic] = useState(5639335.00);
  const [otrosSep, setOtrosSep] = useState(0);
  const [otrosOctDic, setOtrosOctDic] = useState(0);

  // Egresos
  const [personalSep, setPersonalSep] = useState(101490722.80);
  const [personalOctDic, setPersonalOctDic] = useState(25946357.40);
  const [gastosAdminSep, setGastosAdminSep] = useState(15246669.64);
  const [gastosAdminOctDic, setGastosAdminOctDic] = useState(4096226.76);
  const [viaticosSep, setViaticosSep] = useState(14114606.73);
  const [viaticosOctDic, setViaticosOctDic] = useState(3877554.28);
  const [comunicacionSep, setComunicacionSep] = useState(13287951.74);
  const [comunicacionOctDic, setComunicacionOctDic] = useState(2781287.75);
  const [serviciosProfSep, setServiciosProfSep] = useState(21531719.93);
  const [serviciosProfOctDic, setServiciosProfOctDic] = useState(5304271.25);
  const [otrosGastosSep, setOtrosGastosSep] = useState(2848629.36);
  const [otrosGastosOctDic, setOtrosGastosOctDic] = useState(593949.85);

  // Anticipos y otros
  const [anticipoRenta, setAnticipoRenta] = useState(3268930.32);
  const [tasaCambio, setTasaCambio] = useState(505);

  // Cálculos
  const totalIngresosSep = cuotasAsociadosSep + comunidadSep + otrosSep;
  const totalIngresosOctDic = cuotasAsociadosOctDic + comunidadOctDic + otrosOctDic;
  const totalIngresos = totalIngresosSep + totalIngresosOctDic;

  const totalEgresosSep = personalSep + gastosAdminSep + viaticosSep + comunicacionSep + serviciosProfSep + otrosGastosSep;
  const totalEgresosOctDic = personalOctDic + gastosAdminOctDic + viaticosOctDic + comunicacionOctDic + serviciosProfOctDic + otrosGastosOctDic;
  const totalEgresos = totalEgresosSep + totalEgresosOctDic;

  const resultadoNetoSep = totalIngresosSep - totalEgresosSep;
  const resultadoNetoOctDic = totalIngresosOctDic - totalEgresosOctDic;
  const resultadoNetoTotal = resultadoNetoSep + resultadoNetoOctDic;

  const impuestoRentaSep = resultadoNetoSep * 0.20;
  const impuestoRentaOctDic = resultadoNetoOctDic * 0.20;
  const impuestoRentaTotal = impuestoRentaSep + impuestoRentaOctDic;

  const saldoImpuestoPorPagar = impuestoRentaTotal - anticipoRenta;
  const impuestoRentaTotalUSD = impuestoRentaTotal / tasaCambio;
  const impuestoPendienteUSD = saldoImpuestoPorPagar / tasaCambio;

  const EditableField = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) => (
    <div className="flex justify-between items-center gap-2">
      <span className="text-sm text-muted-foreground min-w-[200px]">{label}</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="text-right font-mono text-sm max-w-[150px]"
        step="0.01"
      />
    </div>
  );

  return (
    <Card className="w-full border-primary/20">
      <CardHeader className="bg-primary/5">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold text-foreground">
              Asociación Horizonte Positivo
            </CardTitle>
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Cálculo Impuesto sobre las Utilidades, Proyectado a Diciembre 2025
          </h3>
          <p className="text-sm text-muted-foreground">
            Período fiscal del 01 de enero al 31 de diciembre 2025
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Tabla Principal */}
        <div className="overflow-x-auto">
          <div className="border rounded-lg">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 font-semibold border-b">
              <div></div>
              <div className="text-center">Saldo<br/>Setiembre</div>
              <div className="text-center">Octubre<br/>Diciembre</div>
              <div className="text-center">Total<br/>Ingresos</div>
            </div>

            {/* Ingresos */}
            <div className="p-4 space-y-3 border-b">
              <h4 className="font-bold text-foreground mb-3">Ingresos</h4>
              <EditableField value={cuotasAsociadosSep} onChange={setCuotasAsociadosSep} label="Cuotas Asociados" />
              <div className="grid grid-cols-4 gap-4 text-right font-mono text-sm">
                <div></div>
                <div>{formatNumber(cuotasAsociadosSep)}</div>
                <Input
                  type="number"
                  value={cuotasAsociadosOctDic}
                  onChange={(e) => setCuotasAsociadosOctDic(parseFloat(e.target.value) || 0)}
                  className="text-right font-mono text-sm"
                  step="0.01"
                />
                <div className="font-bold">{formatNumber(cuotasAsociadosSep + cuotasAsociadosOctDic)}</div>
              </div>

              <EditableField value={comunidadSep} onChange={setComunidadSep} label="Comunidad" />
              <div className="grid grid-cols-4 gap-4 text-right font-mono text-sm">
                <div></div>
                <div>{formatNumber(comunidadSep)}</div>
                <Input
                  type="number"
                  value={comunidadOctDic}
                  onChange={(e) => setComunidadOctDic(parseFloat(e.target.value) || 0)}
                  className="text-right font-mono text-sm"
                  step="0.01"
                />
                <div className="font-bold">{formatNumber(comunidadSep + comunidadOctDic)}</div>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[200px]">Otros</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-right font-mono text-sm">
                <div></div>
                <Input
                  type="number"
                  value={otrosSep}
                  onChange={(e) => setOtrosSep(parseFloat(e.target.value) || 0)}
                  className="text-right font-mono text-sm"
                  step="0.01"
                />
                <Input
                  type="number"
                  value={otrosOctDic}
                  onChange={(e) => setOtrosOctDic(parseFloat(e.target.value) || 0)}
                  className="text-right font-mono text-sm"
                  step="0.01"
                />
                <div className="font-bold">{formatNumber(otrosSep + otrosOctDic)}</div>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-2 border-t mt-2 font-bold text-primary">
                <div>Total ingresos</div>
                <div className="text-right">{formatNumber(totalIngresosSep)}</div>
                <div className="text-right">{formatNumber(totalIngresosOctDic)}</div>
                <div className="text-right">{formatNumber(totalIngresos)}</div>
              </div>
            </div>

            {/* Egresos */}
            <div className="p-4 space-y-3 border-b">
              <h4 className="font-bold text-foreground mb-3">Egresos</h4>
              
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Personal</span>
                <div className="grid grid-cols-4 gap-4 text-right font-mono text-sm">
                  <div></div>
                  <Input
                    type="number"
                    value={personalSep}
                    onChange={(e) => setPersonalSep(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    value={personalOctDic}
                    onChange={(e) => setPersonalOctDic(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <div className="font-bold">{formatNumber(personalSep + personalOctDic)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Gastos administrativos</span>
                <div className="grid grid-cols-4 gap-4 text-right font-mono text-sm">
                  <div></div>
                  <Input
                    type="number"
                    value={gastosAdminSep}
                    onChange={(e) => setGastosAdminSep(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    value={gastosAdminOctDic}
                    onChange={(e) => setGastosAdminOctDic(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <div className="font-bold">{formatNumber(gastosAdminSep + gastosAdminOctDic)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Viáticos</span>
                <div className="grid grid-cols-4 gap-4 text-right font-mono text-sm">
                  <div></div>
                  <Input
                    type="number"
                    value={viaticosSep}
                    onChange={(e) => setViaticosSep(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    value={viaticosOctDic}
                    onChange={(e) => setViaticosOctDic(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <div className="font-bold">{formatNumber(viaticosSep + viaticosOctDic)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Comunicación y Mercadeo</span>
                <div className="grid grid-cols-4 gap-4 text-right font-mono text-sm">
                  <div></div>
                  <Input
                    type="number"
                    value={comunicacionSep}
                    onChange={(e) => setComunicacionSep(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    value={comunicacionOctDic}
                    onChange={(e) => setComunicacionOctDic(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <div className="font-bold">{formatNumber(comunicacionSep + comunicacionOctDic)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Servicios Profesionales</span>
                <div className="grid grid-cols-4 gap-4 text-right font-mono text-sm">
                  <div></div>
                  <Input
                    type="number"
                    value={serviciosProfSep}
                    onChange={(e) => setServiciosProfSep(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    value={serviciosProfOctDic}
                    onChange={(e) => setServiciosProfOctDic(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <div className="font-bold">{formatNumber(serviciosProfSep + serviciosProfOctDic)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Otros Gastos</span>
                <div className="grid grid-cols-4 gap-4 text-right font-mono text-sm">
                  <div></div>
                  <Input
                    type="number"
                    value={otrosGastosSep}
                    onChange={(e) => setOtrosGastosSep(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <Input
                    type="number"
                    value={otrosGastosOctDic}
                    onChange={(e) => setOtrosGastosOctDic(parseFloat(e.target.value) || 0)}
                    className="text-right font-mono text-sm"
                    step="0.01"
                  />
                  <div className="font-bold">{formatNumber(otrosGastosSep + otrosGastosOctDic)}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-2 border-t mt-2 font-bold text-destructive">
                <div>Total</div>
                <div className="text-right">{formatNumber(totalEgresosSep)}</div>
                <div className="text-right">{formatNumber(totalEgresosOctDic)}</div>
                <div className="text-right">{formatNumber(totalEgresos)}</div>
              </div>
            </div>

            {/* Resultado Neto */}
            <div className="p-4 bg-primary/5 border-b">
              <div className="grid grid-cols-4 gap-4 font-bold text-lg">
                <div>Resultado neto</div>
                <div className="text-right">{formatNumber(resultadoNetoSep)}</div>
                <div className="text-right">{formatNumber(resultadoNetoOctDic)}</div>
                <div className="text-right text-primary">{formatNumber(resultadoNetoTotal)}</div>
              </div>
            </div>

            {/* Impuesto de Renta */}
            <div className="p-4 bg-chart-4/10 border-b">
              <div className="grid grid-cols-4 gap-4 font-bold text-lg">
                <div>Impuesto de Renta</div>
                <div className="text-right">{formatNumber(impuestoRentaSep)}</div>
                <div className="text-right">{formatNumber(impuestoRentaOctDic)}</div>
                <div className="text-right text-chart-4">{formatNumber(impuestoRentaTotal)}</div>
              </div>
            </div>

            {/* Anticipo y Saldo */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Anticipo de renta</span>
                <Input
                  type="number"
                  value={anticipoRenta}
                  onChange={(e) => setAnticipoRenta(parseFloat(e.target.value) || 0)}
                  className="text-right font-mono max-w-[200px]"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Saldo impuesto por pagar</span>
                <span className="text-chart-5">{formatNumber(saldoImpuestoPorPagar)}</span>
              </div>
            </div>

            {/* Conversión a USD */}
            <div className="p-4 bg-muted/30 space-y-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tasa de cambio (₡/$)</span>
                <Input
                  type="number"
                  value={tasaCambio}
                  onChange={(e) => setTasaCambio(parseFloat(e.target.value) || 505)}
                  className="text-right font-mono max-w-[120px]"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Impuesto de renta total en $</span>
                <span className="font-bold text-primary">{formatCurrency(impuestoRentaTotalUSD)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Impuesto Pendiente de pagar en $</span>
                <span className="font-bold text-chart-5">{formatCurrency(impuestoPendienteUSD)}</span>
              </div>
            </div>

            {/* Notas */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-t">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Falta</p>
                <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>Detalle de los ingresos pendientes</span>
                    <span>Huella/ Grupo Vargas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evento Asociados Tecnologia</span>
                    <span>9000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
