import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle2, Chrome } from "lucide-react";
import AppFooter from "@/components/AppFooter";
import torqbrainLogo from "@/assets/torqbrain-logo.svg";

export default function AuthPage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Unable to start Google sign-in", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(43,97,168,0.08),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(159,180,35,0.08),_transparent_24%),linear-gradient(180deg,_#fcfdff_0%,_#f6f9fc_52%,_#edf3f7_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center gap-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
          <section className="mx-auto w-full max-w-2xl space-y-8 px-2 sm:px-4">
            <div className="space-y-4">
              <img
                src={torqbrainLogo}
                alt="TorqBrain"
                className="h-12 w-auto sm:h-14"
              />
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  InvoiceHub
                </h1>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/75">
                  Developed by TorqBrain
                </p>
                <p className="max-w-xl text-base leading-8 text-slate-600">
                  A clean invoicing workspace for businesses that want professional invoices, better payment tracking, and a setup that stays easy to manage.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                "Create polished invoices in minutes",
                "Manage business profiles, customers, and products in one place",
                "Track payments and due dates without messy spreadsheets",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <Card className="border-slate-200/80 bg-white/92 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <CardHeader className="space-y-3 pb-4">
              <div className="inline-flex w-fit items-center rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                Secure sign in
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl text-slate-950 sm:text-3xl">Get started</CardTitle>
                <CardDescription className="text-sm leading-7 text-slate-600">
                  Continue with Google to access your invoices, customers, business profiles, and workspace settings.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button className="h-12 w-full text-sm font-medium" onClick={handleGoogleSignIn}>
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">One login. Full workspace access.</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Your businesses, invoices, customer records, and generated documents stay connected in one secure flow.
                </p>
              </div>

              <p className="text-center text-xs leading-6 text-muted-foreground">
                Email and password login is intentionally hidden for now until custom SMTP or confirmation settings are finalized.
              </p>
            </CardContent>
          </Card>
        </div>

        <AppFooter className="pb-2" />
      </div>
    </div>
  );
}
