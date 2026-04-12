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
import {
  useBusinessProfiles, useCustomers, useCurrencies, useInvoiceTemplates, useProducts,
  useSaveInvoice, useInvoice, useNextInvoiceNumber,
} from "@/hooks/useInvoiceData";
import { useAllTranslations } from "@/hooks/useTranslations";
import type { InvoiceFormData, InvoiceItemFormData, InvoiceStatus, Product } from "@/lib/types";
import { numberToWords } from "@/lib/number-to-words";
import { COMMON_UNITS } from "@/lib/units";
import { normalizeInvoicePattern } from "@/lib/invoice-number";

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

  const { data: profiles = [] } = useBusinessProfiles();
  const { data: customers = [] } = useCustomers();
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
    } else if (!isEdit) {
      setForm((f) => ({
        ...f,
        business_profile_id: profiles.find((p) => p.is_default)?.id || profiles[0]?.id || "",
        template_id: templates.find((t) => t.is_default)?.id || templates[0]?.id || "",
        currency_id: currencies.find((c) => c.code === "INR")?.id || currencies[0]?.id || "",
        terms_and_conditions:
          profiles.find((p) => p.is_default)?.default_terms_and_conditions ||
          profiles[0]?.default_terms_and_conditions ||
          LEGACY_DEFAULT_TERMS,
      }));
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

  const handleStatusChange = (status: InvoiceStatus) => {
    setForm((current) => ({
      ...current,
      status,
      received_amount: status === "paid" ? total : current.received_amount,
    }));
  };

  const handleSave = async (status?: InvoiceStatus) => {
    const resolvedStatus = status || form.status;
    const data = {
      ...form,
      status: resolvedStatus,
      received_amount: resolvedStatus === "paid" ? total : form.received_amount,
      amount_in_words: numberToWords(total, selectedCurrency?.name || "Rupees"),
    } as any;
    data.total_amount = total;
    data.subtotal = subtotal;
    const result = await saveMutation.mutateAsync({ formData: data, invoiceId: isEdit ? id : undefined });
    navigate(`/invoices/${result}/preview`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Invoice" : "New Invoice"}</h1>
          <p className="text-muted-foreground text-sm">Fill in the invoice details below</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave("draft")}><Save className="h-4 w-4 mr-2" />Save Draft</Button>
          <Button onClick={() => handleSave()}><Eye className="h-4 w-4 mr-2" />Save & Preview</Button>
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
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
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
              <Select value={form.business_profile_id} onValueChange={(v) => setForm({ ...form, business_profile_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select business..." /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Customer</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Line Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
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
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Select value={item.product_id || "custom"} onValueChange={(value) => handleProductSelect(i, value)}>
                  <SelectTrigger className="col-span-3 text-sm">
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
                <Input className="col-span-3 text-sm" placeholder="Service/item description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                <Input className="col-span-1 text-sm" placeholder="HSN" value={item.hsn_sac} onChange={(e) => updateItem(i, "hsn_sac", e.target.value)} />
                <Input className="col-span-1 text-sm" type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                <Input
                  className="col-span-1 text-sm"
                  list="invoice-unit-suggestions"
                  value={item.unit}
                  onChange={(e) => updateItem(i, "unit", e.target.value)}
                  placeholder="Unit"
                />
                <Input className="col-span-1 text-sm" type="number" value={item.rate} onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)} />
                <div className="col-span-1 text-right text-sm font-medium">{item.amount.toLocaleString()}</div>
                <Button variant="ghost" size="icon" className="col-span-1" onClick={() => removeItem(i)} disabled={form.items.length === 1}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <datalist id="invoice-unit-suggestions">
              {COMMON_UNITS.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{selectedCurrency?.symbol || "₹"}{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{selectedCurrency?.symbol || "₹"}{total.toLocaleString()}</span></div>
              <div className="pt-2">
                <Label className="text-xs">Received Amount</Label>
                <Input type="number" value={form.received_amount} onChange={(e) => setForm({ ...form, received_amount: parseFloat(e.target.value) || 0 })} />
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
            <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Terms & Conditions</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={4} value={form.terms_and_conditions} onChange={(e) => setForm({ ...form, terms_and_conditions: e.target.value })} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
