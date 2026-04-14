import { useTaxConfigs, useCurrencies } from "@/hooks/useInvoiceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TaxSettingsPage() {
  const { data: taxes = [] } = useTaxConfigs();
  const { data: currencies = [] } = useCurrencies();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tax & Currency Settings</h1>
        <p className="text-muted-foreground text-sm">Manage tax rules and currencies</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tax Configurations</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {taxes.map((t) => (
              <div key={t.id} className="flex flex-col gap-3 rounded-lg bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="break-words text-xs text-muted-foreground">{t.label}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{t.rate}%</Badge>
                  {t.is_active && <Badge className="bg-success/10 text-success">Active</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Currencies</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currencies.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{c.symbol}</span>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.code}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
