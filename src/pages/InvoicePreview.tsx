import { useParams, Link } from "react-router-dom";
import { useInvoice } from "@/hooks/useInvoiceData";
import { useTranslations } from "@/hooks/useTranslations";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Edit } from "lucide-react";
import { getSignatureFontFamily } from "@/lib/signature-fonts";
import AppFooter from "@/components/AppFooter";

export default function InvoicePreview() {
  const { id } = useParams();
  const { data: invoice, isLoading } = useInvoice(id);
  const { t, isRtl } = useTranslations(invoice?.language_code || "en");

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (!invoice) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Invoice not found</div>;

  const business = (invoice as any).business_profiles;
  const customer = (invoice as any).customers;
  const currency = (invoice as any).currencies;
  const items = (invoice as any).invoice_items || [];
  const symbol = currency?.symbol || "₹";

  const handlePrint = () => window.print();
  const handleDownload = () => {
    // Using print dialog for PDF
    window.print();
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* Toolbar */}
      <div className="no-print bg-background border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/invoices">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          </Link>
          <div className="flex gap-2">
            <Link to={`/invoices/${id}/edit`}>
              <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" />Edit</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
            <Button size="sm" onClick={handleDownload}><Download className="h-4 w-4 mr-2" />PDF</Button>
          </div>
        </div>
      </div>

      {/* Invoice */}
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="invoice-print bg-card rounded-lg border p-8 md:p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-invoice-border">
            <div>
              <h1 className="text-2xl font-bold text-primary">{business?.name || "Company Name"}</h1>
              <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                {business?.address_line1 && <p>{business.address_line1}</p>}
                {business?.address_line2 && <p>{business.address_line2}</p>}
                <p>{[business?.city, business?.state, business?.postal_code].filter(Boolean).join(", ")}</p>
                {business?.country && <p>{business.country}</p>}
                {business?.phone && <p>Ph: {business.phone}</p>}
                {business?.email && <p>{business.email}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-invoice-accent uppercase tracking-wider">
                {invoice.is_export ? t("export_invoice", "EXPORT INVOICE") : t("tax_invoice", "TAX INVOICE")}
              </h2>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-end gap-4">
                  <span className="text-muted-foreground">{t("invoice_no")}:</span>
                  <span className="font-semibold">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="text-muted-foreground">{t("invoice_date")}:</span>
                  <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                </div>
                {invoice.due_date && (
                  <div className="flex justify-end gap-4">
                    <span className="text-muted-foreground">{t("due_date")}:</span>
                    <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tax details row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-invoice-muted rounded-lg text-sm">
            {business?.gstin && <div><span className="text-muted-foreground">{t("gstin")}:</span> <span className="font-medium">{business.gstin}</span></div>}
            {business?.pan && <div><span className="text-muted-foreground">{t("pan")}:</span> <span className="font-medium">{business.pan}</span></div>}
            {business?.lut_arn && invoice.is_export && <div><span className="text-muted-foreground">{t("lut_arn", "LUT ARN")}:</span> <span className="font-medium">{business.lut_arn}</span></div>}
            {invoice.place_of_supply && <div><span className="text-muted-foreground">{t("place_of_supply")}:</span> <span className="font-medium">{invoice.place_of_supply}</span></div>}
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("bill_to")}</h3>
            <div className="text-sm">
              <p className="font-semibold text-base">{customer?.name || "—"}</p>
              {customer?.address_line1 && <p>{customer.address_line1}</p>}
              {customer?.address_line2 && <p>{customer.address_line2}</p>}
              <p>{[customer?.city, customer?.state, customer?.postal_code].filter(Boolean).join(", ")}</p>
              {customer?.country && <p>{customer.country}</p>}
              {customer?.gstin && <p>{t("gstin")}: {customer.gstin}</p>}
              {customer?.email && <p>{customer.email}</p>}
            </div>
          </div>

          {/* Items table */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-2.5 text-left font-medium rounded-tl-md">{t("sl_no")}</th>
                  <th className="px-3 py-2.5 text-left font-medium">{t("description")}</th>
                  <th className="px-3 py-2.5 text-left font-medium">{t("hsn_sac")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("quantity")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("rate")}</th>
                  <th className="px-3 py-2.5 text-right font-medium rounded-tr-md">{t("amount")}</th>
                </tr>
              </thead>
              <tbody>
                {items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)).map((item: any, i: number) => (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-invoice-muted/50" : ""}>
                    <td className="px-3 py-2.5">{i + 1}</td>
                    <td className="px-3 py-2.5">{item.description}</td>
                    <td className="px-3 py-2.5">{item.hsn_sac || "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      {item.quantity}
                      {item.unit ? ` ${item.unit}` : ""}
                    </td>
                    <td className="px-3 py-2.5 text-right">{symbol}{(item.rate || 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{symbol}{(item.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-medium">{symbol}{(invoice.subtotal || 0).toLocaleString()}</span>
              </div>
              {(invoice.tax_amount || 0) > 0 && (
                <div className="flex justify-between py-2 text-sm border-t">
                  <span className="text-muted-foreground">{t("tax")}</span>
                  <span className="font-medium">{symbol}{(invoice.tax_amount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-primary">
                <span>{t("total_amount")}</span>
                <span className="text-primary">{symbol}{(invoice.total_amount || 0).toLocaleString()}</span>
              </div>
              {(invoice.received_amount || 0) > 0 && (
                <>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">{t("received_amount")}</span>
                    <span>{symbol}{(invoice.received_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-bold text-accent">
                    <span>{t("balance_due")}</span>
                    <span>{symbol}{((invoice.total_amount || 0) - (invoice.received_amount || 0)).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Amount in words */}
          {invoice.amount_in_words && (
            <div className="mb-6 p-3 bg-invoice-muted rounded text-sm">
              <span className="text-muted-foreground">{t("amount_in_words")}: </span>
              <span className="font-medium">{invoice.amount_in_words}</span>
            </div>
          )}

          {/* Bank details */}
          {business?.bank_name && (
            <div className="mb-6 text-sm">
              <h3 className="font-semibold mb-1">{t("bank_details")}</h3>
              <p>{t("bank_name")}: {business.bank_name}</p>
              {business.bank_account && <p>{t("account_no")}: {business.bank_account}</p>}
              {business.bank_ifsc && <p>{t("ifsc")}: {business.bank_ifsc}</p>}
              {business.bank_swift && <p>{t("swift")}: {business.bank_swift}</p>}
            </div>
          )}

          {/* Terms */}
          {invoice.terms_and_conditions && (
            <div className="mb-8 text-sm">
              <h3 className="font-semibold mb-2">{t("terms_and_conditions")}</h3>
              <pre className="whitespace-pre-wrap text-muted-foreground font-sans text-xs">{invoice.terms_and_conditions}</pre>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-end pt-6 border-t">
            <p className="text-sm text-muted-foreground italic">{t("thank_you")}</p>
            <div className="text-center">
              {business?.signature_text ? (
                <div
                  className="signature-ink mb-1 min-h-12 text-4xl leading-none"
                  style={{ fontFamily: getSignatureFontFamily(business.signature_font) }}
                >
                  {business.signature_text}
                </div>
              ) : (
                <div className="w-40 border-b border-foreground mb-1 h-12"></div>
              )}
              <p className="text-xs text-muted-foreground">{t("authorized_signatory")}</p>
              <p className="text-xs font-medium">{business?.name}</p>
            </div>
          </div>
        </div>
        <AppFooter className="no-print mt-6" />
      </div>
    </div>
  );
}
