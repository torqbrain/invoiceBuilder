import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useBusinessProfiles, useCustomers, useCurrencies, useInvoiceTemplates, useProducts,
  useSaveInvoice, useInvoice, useNextInvoiceNumber,
} from "@/hooks/useInvoiceData";
import { useAllTranslations } from "@/hooks/useTranslations";
import type { InvoiceFormData, InvoiceItemFormData, InvoiceStatus, Product } from "@/lib/types";
import { numberToWords } from "@/lib/number-to-words";
import { COMMON_UNITS } from "@/lib/units";
import { normalizeInvoicePattern } from "@/lib/invoice-number";
import { getEffectiveInvoiceStatus } from "@/lib/invoice-status";

const LEGACY_DEFAULT_TERMS = "1. Payment is due within 30 days.\n2. Please include invoice number in payment reference.";

const emptyItem = (): InvoiceItemFormData => ({
  product_id: undefined,
  description: "",
  hsn_sac: "",
  quantity: 1,
  unit: "Qty",
  rate: 0,
  amount: 0,
});

export default function InvoiceEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get("duplicate");
  const navigate = useNavigate();
  const isEdit = !!id;
  const [invoiceNumberTouched, setInvoiceNumberTouched] = useState(false);
  const [statusTouched, setStatusTouched] = useState(false);
  const [missingDataDialog, setMissingDataDialog] = useState<"business" | "customer" | null>(null);
  const [lastScopedBusinessId, setLastScopedBusinessId] = useState<string | null>(null);

  const { data: profiles = [] } = useBusinessProfiles();
  const { data: currencies = [] } = useCurrencies();
  const { data: templates = [] } = useInvoiceTemplates();
  const { data: languages = [] } = useAllTranslations();
  const { data: existingInvoice } = useInvoice(id || duplicateId || undefined);
  const saveMutation = useSaveInvoice();

  const [form, setForm] = useState<InvoiceFormData>({
    invoice_number: "",
    business_profile_id: "",
    customer_id: "",
    template_id: "",
    currency_id: "",
    language_code: "en",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    place_of_supply: "",
    notes: "",
    terms_and_conditions: "",
    is_export: false,
    status: "draft" as InvoiceStatus,
    received_amount: 0,
    items: [emptyItem()],
    tax_ids: [],
  });

  const { data: customers = [] } = useCustomers({ businessProfileId: form.business_profile_id || undefined });
  const { data: products = [] } = useProducts({
    businessProfileId: form.business_profile_id || undefined,
    activeOnly: true,
  });
  const selectedProfile = profiles.find((profile) => profile.id === form.business_profile_id);
  const initialProfileId = existingInvoice?.business_profile_id || profiles.find((profile) => profile.is_default)?.id || profiles[0]?.id;
  const nextNumberProfileId = form.business_profile_id || initialProfileId;
  const nextNumberPattern = profiles.find((profile) => profile.id === nextNumberProfileId)?.invoice_number_pattern;
  const { data: nextNumber = normalizeInvoicePattern(nextNumberPattern) } = useNextInvoiceNumber(nextNumberProfileId, nextNumberPattern);

  useEffect(() => {
    if (existingInvoice) {
      const items = ((existingInvoice as any).invoice_items || []).map((it: any) => ({
        id: it.id,
        product_id: it.product_id || undefined,
        description: it.description,
        hsn_sac: it.hsn_sac || "",
        quantity: it.quantity || 1,
        unit: it.unit || "Qty",
        rate: it.rate || 0,
        amount: it.amount || 0,
      }));
      setForm({
        invoice_number: duplicateId ? nextNumber : existingInvoice.invoice_number,
        business_profile_id: existingInvoice.business_profile_id || "",
        customer_id: existingInvoice.customer_id || "",
        template_id: existingInvoice.template_id || "",
        currency_id: existingInvoice.currency_id || "",
        language_code: existingInvoice.language_code || "en",
        invoice_date: existingInvoice.invoice_date,
        due_date: existingInvoice.due_date || "",
        place_of_supply: existingInvoice.place_of_supply || "",
        notes: existingInvoice.notes || "",
        terms_and_conditions: existingInvoice.terms_and_conditions || "",
        is_export: existingInvoice.is_export || false,
        status: (duplicateId ? "draft" : existingInvoice.status || "draft") as InvoiceStatus,
        received_amount: existingInvoice.received_amount || 0,
        items: items.length > 0 ? items : [emptyItem()],
        tax_ids: [],
      });
      setStatusTouched(!duplicateId);
    } else if (!isEdit) {
      setForm((f) => ({
        ...f,
        business_profile_id: f.business_profile_id || profiles.find((p) => p.is_default)?.id || profiles[0]?.id || "",
        template_id: f.template_id || templates.find((t) => t.is_default)?.id || templates[0]?.id || "",
        currency_id: f.currency_id || currencies.find((c) => c.code === "INR")?.id || currencies[0]?.id || "",
        terms_and_conditions:
          f.terms_and_conditions ||
          profiles.find((p) => p.is_default)?.default_terms_and_conditions ||
          profiles[0]?.default_terms_and_conditions ||
          LEGACY_DEFAULT_TERMS,
      }));
      setStatusTouched(false);
    }
  }, [existingInvoice, nextNumber, profiles, templates, currencies, isEdit, duplicateId]);

  useEffect(() => {
    if (isEdit || existingInvoice) return;

    const profileTerms = selectedProfile?.default_terms_and_conditions || LEGACY_DEFAULT_TERMS;

    setForm((current) => {
      const shouldReplaceTerms =
        current.terms_and_conditions === "" ||
        current.terms_and_conditions === LEGACY_DEFAULT_TERMS ||
        current.terms_and_conditions === profiles.find((profile) => profile.id === current.business_profile_id)?.default_terms_and_conditions;

      return shouldReplaceTerms
        ? { ...current, terms_and_conditions: profileTerms }
        : current;
    });
  }, [selectedProfile, isEdit, existingInvoice, profiles]);

  useEffect(() => {
    if (isEdit) return;
    if (invoiceNumberTouched) return;
    if (!nextNumber) return;

    setForm((current) => (
      current.invoice_number !== nextNumber
        ? { ...current, invoice_number: nextNumber }
        : current
    ));
  }, [nextNumber, isEdit, invoiceNumberTouched]);

  useEffect(() => {
    const currentBusinessId = form.business_profile_id || null;

    if (!currentBusinessId) {
      setLastScopedBusinessId(null);
      return;
    }

    if (lastScopedBusinessId === null) {
      setLastScopedBusinessId(currentBusinessId);
      return;
    }

    if (lastScopedBusinessId === currentBusinessId) {
      return;
    }

    setForm((current) => ({
      ...current,
      customer_id: "",
      items: current.items.map((item) => ({
        ...item,
        product_id: undefined,
      })),
    }));
    setLastScopedBusinessId(currentBusinessId);
  }, [form.business_profile_id, lastScopedBusinessId]);

  useEffect(() => {
    if (!form.customer_id) return;
    if (customers.some((customer) => customer.id === form.customer_id)) return;

    setForm((current) => ({
      ...current,
      customer_id: "",
    }));
  }, [customers, form.customer_id]);

  useEffect(() => {
    const availableProductIds = new Set((products as Product[]).map((product) => product.id));

    setForm((current) => {
      let changed = false;
      const items = current.items.map((item) => {
        if (!item.product_id || availableProductIds.has(item.product_id)) {
          return item;
        }

        changed = true;
        return {
          ...item,
          product_id: undefined,
        };
      });

      return changed ? { ...current, items } : current;
    });
  }, [products]);

  const updateItem = (index: number, field: keyof InvoiceItemFormData, value: any) => {
    setForm((f) => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      if (field === "quantity" || field === "rate") {
        items[index].amount = (items[index].quantity || 0) * (items[index].rate || 0);
      }
      return { ...f, items };
    });
  };

  const handleProductSelect = (index: number, productId: string) => {
    if (productId === "custom") {
      updateItem(index, "product_id", undefined);
      return;
    }

    const product = (products as Product[]).find((entry) => entry.id === productId);
    if (!product) return;

    setForm((current) => {
      const items = [...current.items];
      const currentItem = items[index];
      const quantity = Number(product.quantity || currentItem.quantity || 1);
      const rate = Number(product.rate || 0);

      items[index] = {
        ...currentItem,
        product_id: product.id,
        description: product.description?.trim() || product.name,
        hsn_sac: product.hsn_sac || "",
        quantity,
        unit: product.unit || "Qty",
        rate,
        amount: quantity * rate,
      };

      return { ...current, items };
    });
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (i: number) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const subtotal = form.items.reduce((s, it) => s + it.amount, 0);
  const total = subtotal;
  const balanceDue = total - form.received_amount;

  const selectedCurrency = currencies.find((c) => c.id === form.currency_id);

  useEffect(() => {
    if (form.status !== "paid") return;

    setForm((current) => (
      current.status === "paid" && current.received_amount !== total
        ? { ...current, received_amount: total }
        : current
    ));
  }, [form.status, total]);

  const getStatusFromReceivedAmount = (receivedAmount: number, currentStatus: InvoiceStatus) => {
    if (receivedAmount <= 0) {
      return currentStatus === "partially_paid" || currentStatus === "paid" ? "draft" : currentStatus;
    }

    if (total > 0 && receivedAmount >= total) {
      return "paid";
    }

    return "partially_paid";
  };

  const handleStatusChange = (status: InvoiceStatus) => {
    setStatusTouched(true);
    setForm((current) => ({
      ...current,
      status,
      received_amount: status === "paid" ? total : current.received_amount,
    }));
  };

  const handleReceivedAmountChange = (value: string) => {
    const receivedAmount = parseFloat(value) || 0;

    setForm((current) => ({
      ...current,
      received_amount: receivedAmount,
      status: !statusTouched
        ? getStatusFromReceivedAmount(receivedAmount, current.status)
        : current.status,
    }));
  };

  const handleSave = async (status?: InvoiceStatus) => {
    if (saveMutation.isPending) return;
    const resolvedStatus = status || form.status;
    const data = {
      ...form,
      due_date: form.due_date || null,
      status: resolvedStatus,
      received_amount: resolvedStatus === "paid" ? total : form.received_amount,
      amount_in_words: numberToWords(total, selectedCurrency?.name || "Rupees"),
    } as any;
    data.total_amount = total;
    data.subtotal = subtotal;
    const result = await saveMutation.mutateAsync({ formData: data, invoiceId: isEdit ? id : undefined });
    navigate(`/invoices/${result}/preview`);
  };

  const missingDataConfig = missingDataDialog === "business"
    ? {
        title: "Add a business profile first",
        description: "You need at least one business profile before creating an invoice.",
        actionLabel: "Go to Business Profiles",
        href: "/business-profiles",
      }
    : {
        title: "Add a customer first",
        description: "You need at least one customer before creating an invoice.",
        actionLabel: "Go to Customers",
        href: "/customers",
      };

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <Dialog open={!!missingDataDialog} onOpenChange={(open) => !open && setMissingDataDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{missingDataConfig.title}</DialogTitle>
            <DialogDescription>{missingDataConfig.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMissingDataDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                setMissingDataDialog(null);
                navigate(missingDataConfig.href);
              }}
            >
              {missingDataConfig.actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Invoice" : "New Invoice"}</h1>
          <p className="text-muted-foreground text-sm">Fill in the invoice details below</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => handleSave("draft")} className="w-full sm:w-auto" disabled={saveMutation.isPending}><Save className="h-4 w-4 mr-2" />{saveMutation.isPending ? "Saving..." : "Save Draft"}</Button>
          <Button onClick={() => handleSave()} className="w-full sm:w-auto" disabled={saveMutation.isPending}><Eye className="h-4 w-4 mr-2" />{saveMutation.isPending ? "Saving..." : "Save & Preview"}</Button>
        </div>
      </div>

      {/* Invoice metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Invoice Number</Label>
              <Input
                placeholder="INV-0001"
                value={form.invoice_number}
                onChange={(e) => {
                  setInvoiceNumberTouched(true);
                  setForm({ ...form, invoice_number: e.target.value });
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Invoice Date</Label>
              <Input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Due Date (Optional)</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => {
                  const dueDate = e.target.value;
                  setForm((current) => ({
                    ...current,
                    due_date: dueDate,
                    status: getEffectiveInvoiceStatus(
                      current.status,
                      dueDate || null,
                      Number(current.received_amount || 0),
                      total
                    ),
                  }));
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => handleStatusChange(v as InvoiceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["draft", "sent", "paid", "partially_paid", "overdue", "cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Seller & Customer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Business Profile</Label>
              {profiles.length > 0 ? (
                <Select value={form.business_profile_id} onValueChange={(v) => setForm({ ...form, business_profile_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select business..." /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start py-3 text-left font-normal text-muted-foreground"
                  onClick={() => setMissingDataDialog("business")}
                >
                  No business profiles yet. Tap to create one.
                </Button>
              )}
            </div>
            <div>
              <Label className="text-xs">Customer</Label>
              {customers.length > 0 ? (
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start py-3 text-left font-normal text-muted-foreground"
                  onClick={() => setMissingDataDialog("customer")}
                >
                  No customers yet. Tap to create one.
                </Button>
              )}
            </div>
            <div>
              <Label className="text-xs">Place of Supply</Label>
              <Input value={form.place_of_supply} onChange={(e) => setForm({ ...form, place_of_supply: e.target.value })} placeholder="e.g. Gujarat" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Settings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Currency</Label>
              <Select value={form.currency_id} onValueChange={(v) => setForm({ ...form, currency_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} ({c.symbol})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Language</Label>
              <Select value={form.language_code} onValueChange={(v) => setForm({ ...form, language_code: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {languages.map((l) => <SelectItem key={l.language_code} value={l.language_code}>{l.language_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Template</Label>
              <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_export} onCheckedChange={(v) => setForm({ ...form, is_export: v })} />
              <Label className="text-xs">Export Invoice (Zero-rated / LUT)</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm">Line Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addItem} className="w-full sm:w-auto"><Plus className="h-3 w-3 mr-1" />Add Item</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-medium text-muted-foreground lg:grid">
              <div className="col-span-3">Product</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">HSN/SAC</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-1">Unit</div>
              <div className="col-span-1">Rate</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="rounded-lg border p-3 lg:rounded-none lg:border-0 lg:p-0">
                <div className="mb-3 flex items-center justify-between lg:hidden">
                  <div className="text-sm font-medium">Item {i + 1}</div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={form.items.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 lg:grid-cols-12 lg:items-center lg:gap-2">
                  <div className="space-y-1 lg:col-span-3">
                    <Label className="text-xs lg:hidden">Product</Label>
                    <Select value={item.product_id || "custom"} onValueChange={(value) => handleProductSelect(i, value)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom line item</SelectItem>
                        {(products as Product[]).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 lg:col-span-3">
                    <Label className="text-xs lg:hidden">Description</Label>
                    <Input className="text-sm" placeholder="Website redesign retainer" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-5 lg:grid-cols-5 lg:gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs lg:hidden">HSN/SAC</Label>
                      <Input className="text-sm" placeholder="998314" value={item.hsn_sac} onChange={(e) => updateItem(i, "hsn_sac", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs lg:hidden">Qty</Label>
                      <Input className="text-sm" type="number" placeholder="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs lg:hidden">Unit</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:hidden"
                        value={item.unit}
                        onChange={(e) => updateItem(i, "unit", e.target.value)}
                      >
                        {COMMON_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <div className="hidden sm:block">
                        <Select value={item.unit} onValueChange={(value) => updateItem(i, "unit", value)}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs lg:hidden">Rate</Label>
                      <Input className="text-sm" type="number" placeholder="0" value={item.rate} onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs lg:hidden">Amount</Label>
                      <div className="flex h-10 items-center justify-end rounded-md border bg-muted/40 px-3 text-sm font-medium">
                        {item.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" className="hidden lg:flex lg:col-span-1" onClick={() => removeItem(i)} disabled={form.items.length === 1}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full space-y-2 text-sm sm:w-72">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{selectedCurrency?.symbol || "₹"}{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{selectedCurrency?.symbol || "₹"}{total.toLocaleString()}</span></div>
              <div className="pt-2">
                <Label className="text-xs">Received Amount</Label>
                <Input type="number" placeholder="0" value={form.received_amount} onChange={(e) => handleReceivedAmountChange(e.target.value)} />
              </div>
              <div className="flex justify-between text-base font-bold text-accent"><span>Balance Due</span><span>{selectedCurrency?.symbol || "₹"}{balanceDue.toLocaleString()}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Bank transfer within 7 days. Thank you for your business." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Terms & Conditions</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={4} value={form.terms_and_conditions} onChange={(e) => setForm({ ...form, terms_and_conditions: e.target.value })} placeholder="1. Payment due within 15 days.&#10;2. Please mention the invoice number in the payment reference." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
