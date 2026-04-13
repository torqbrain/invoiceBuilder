import { useInvoices } from "@/hooks/useInvoiceData";
import { useCustomers } from "@/hooks/useInvoiceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Users, Plus, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import type { InvoiceWithRelations } from "@/lib/types";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-accent/10 text-accent",
  paid: "bg-success/10 text-success",
  partially_paid: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

function sumInvoicesByCurrency(
  invoices: InvoiceWithRelations[],
  getAmount: (invoice: InvoiceWithRelations) => number
) {
  const totals = new Map<string, { symbol: string; total: number }>();

  invoices.forEach((invoice) => {
    const currencyCode = invoice.currencies?.code || "UNKNOWN";
    const symbol = invoice.currencies?.symbol || currencyCode;
    const amount = getAmount(invoice);

    if (amount <= 0) return;

    const current = totals.get(currencyCode);
    if (current) {
      current.total += amount;
    } else {
      totals.set(currencyCode, { symbol, total: amount });
    }
  });

  return Array.from(totals.values());
}

export default function Dashboard() {
  const { data: invoices = [] } = useInvoices();
  const { data: customers = [] } = useCustomers();

  const receivedInvoices = invoices.filter((invoice) => ["paid", "partially_paid"].includes(invoice.status || ""));
  const pendingInvoices = invoices.filter((invoice) => ["sent", "partially_paid", "overdue"].includes(invoice.status || ""));
  const revenueByCurrency = sumInvoicesByCurrency(receivedInvoices, (invoice) => {
    if (invoice.status === "paid") {
      return invoice.total_amount || invoice.received_amount || 0;
    }

    return invoice.received_amount || 0;
  });
  const pendingByCurrency = sumInvoicesByCurrency(
    pendingInvoices,
    (invoice) => (invoice.total_amount || 0) - (invoice.received_amount || 0)
  );
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your invoicing activity</p>
        </div>
        <Link to="/invoices/new">
          <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{invoices.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{customers.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Received)</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {revenueByCurrency.length === 0 ? (
              <div className="text-2xl font-bold">0</div>
            ) : (
              <div className="space-y-1">
                {revenueByCurrency.map(({ symbol, total }) => (
                  <div key={symbol} className="text-2xl font-bold">
                    {symbol}{total.toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {pendingByCurrency.length === 0 ? (
              <div className="text-2xl font-bold">0</div>
            ) : (
              <div className="space-y-1">
                {pendingByCurrency.map(({ symbol, total }) => (
                  <div key={symbol} className="text-2xl font-bold">
                    {symbol}{total.toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No invoices yet. Create your first invoice!</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}/preview`}
                  className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{(inv as any).customers?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium">
                      {(inv as any).currencies?.symbol || "₹"}{(inv.total_amount || 0).toLocaleString()}
                    </span>
                    <Badge variant="secondary" className={statusColors[inv.status || "draft"]}>
                      {inv.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
