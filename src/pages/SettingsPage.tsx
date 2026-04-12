import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Application settings and preferences</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Settings page coming soon. You can manage your business profiles, customers, translations, and tax settings from the sidebar.</p>
        </CardContent>
      </Card>
    </div>
  );
}
