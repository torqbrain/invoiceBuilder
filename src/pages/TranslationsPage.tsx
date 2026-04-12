import { useAllTranslations } from "@/hooks/useTranslations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import type { TranslationMap } from "@/lib/types";

export default function TranslationsPage() {
  const { data: translations = [], isLoading } = useAllTranslations();

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Translations</h1>
        <p className="text-muted-foreground text-sm">Manage invoice labels in different languages</p>
      </div>

      <div className="grid gap-4">
        {translations.map((t) => {
          const map = (t.translations || {}) as TranslationMap;
          const keys = Object.keys(map);
          return (
            <Card key={t.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-accent" />
                    <CardTitle className="text-base">{t.language_name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{t.language_code}</Badge>
                    {t.is_rtl && <Badge variant="outline" className="text-xs">RTL</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{keys.length} labels</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                  {keys.slice(0, 12).map((key) => (
                    <div key={key} className="p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">{key}:</span>{" "}
                      <span className="font-medium">{map[key]}</span>
                    </div>
                  ))}
                  {keys.length > 12 && <div className="p-2 text-muted-foreground">+{keys.length - 12} more...</div>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
