import { useState } from "react";
import { useBusinessProfiles } from "@/hooks/useInvoiceData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SIGNATURE_FONTS, getSignatureFontFamily } from "@/lib/signature-fonts";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

const emptyForm = () => ({
  name: "", address_line1: "", address_line2: "", city: "", state: "", country: "India", postal_code: "",
  phone: "", email: "", website: "", gstin: "", pan: "", lut_arn: "",
  bank_name: "", bank_account: "", bank_ifsc: "", bank_swift: "", is_default: false,
  invoice_number_pattern: "INV-0001",
  default_terms_and_conditions: "",
  signature_text: "", signature_font: "caveat",
});

export default function BusinessProfilesPage() {
  const { data: profiles = [], isLoading } = useBusinessProfiles();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const qc = useQueryClient();

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (editId) {
      await supabase.from("business_profiles").update(form).eq("id", editId);
    } else {
      if (!user) {
        toast({ title: "You must be signed in", variant: "destructive" });
        return;
      }

      const { data: business, error: businessError } = await supabase
        .from("business_profiles")
        .insert({ ...form, owner_user_id: user.id })
        .select("id")
        .single();

      if (businessError) {
        toast({ title: "Unable to create business", description: businessError.message, variant: "destructive" });
        return;
      }

      const { error: membershipError } = await supabase.from("business_members").insert({
        user_id: user.id,
        business_profile_id: business.id,
        role: "owner",
      });

      if (membershipError) {
        toast({ title: "Unable to create business membership", description: membershipError.message, variant: "destructive" });
        return;
      }
    }
    qc.invalidateQueries({ queryKey: ["business_profiles"] });
    qc.invalidateQueries({ queryKey: ["business_memberships"] });
    setOpen(false);
    setForm(emptyForm());
    setEditId(null);
    toast({ title: editId ? "Profile updated" : "Profile added" });
  };

  const handleEdit = (p: any) => {
    const f = emptyForm();
    Object.keys(f).forEach((k) => { (f as any)[k] = p[k] ?? (f as any)[k]; });
    setForm(f);
    setEditId(p.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this business profile?")) return;
    await supabase.from("business_profiles").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["business_profiles"] });
    toast({ title: "Profile deleted" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Profiles</h1>
          <p className="text-muted-foreground text-sm">Manage your company details</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm()); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Profile</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Business Profile</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Company Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Address Line 1</Label><Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Address Line 2</Label><Input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} /></div>
              <div><Label className="text-xs">City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label className="text-xs">State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div><Label className="text-xs">Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div><Label className="text-xs">Postal Code</Label><Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div><Label className="text-xs">GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
              <div><Label className="text-xs">PAN</Label><Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">LUT ARN</Label><Input value={form.lut_arn} onChange={(e) => setForm({ ...form, lut_arn: e.target.value })} /></div>
              <div className="col-span-2 font-medium text-sm mt-2">Bank Details</div>
              <div><Label className="text-xs">Bank Name</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
              <div><Label className="text-xs">Account No.</Label><Input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} /></div>
              <div><Label className="text-xs">IFSC</Label><Input value={form.bank_ifsc} onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })} /></div>
              <div><Label className="text-xs">SWIFT</Label><Input value={form.bank_swift} onChange={(e) => setForm({ ...form, bank_swift: e.target.value })} /></div>
              <div className="col-span-2 font-medium text-sm mt-2">Invoice Defaults</div>
              <div className="col-span-2">
                <Label className="text-xs">Invoice Number Pattern</Label>
                <Input
                  value={form.invoice_number_pattern}
                  onChange={(e) => setForm({ ...form, invoice_number_pattern: e.target.value })}
                  placeholder="e.g. INV-0001 or ACME/2026/001"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Default Terms & Conditions</Label>
                <Textarea
                  rows={4}
                  value={form.default_terms_and_conditions}
                  onChange={(e) => setForm({ ...form, default_terms_and_conditions: e.target.value })}
                  placeholder="These terms will be used by default for new invoices for this business profile."
                />
              </div>
              <div className="col-span-2 font-medium text-sm mt-2">Signature</div>
              <div className="col-span-2">
                <Label className="text-xs">Signature Text</Label>
                <Input
                  value={form.signature_text}
                  onChange={(e) => setForm({ ...form, signature_text: e.target.value })}
                  placeholder="e.g. Harsh Angrajpara"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-xs">Signature Style</Label>
                <div className="grid grid-cols-1 gap-2">
                  {SIGNATURE_FONTS.map((font) => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => setForm({ ...form, signature_font: font.value })}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        form.signature_font === font.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">{font.label}</p>
                      <p
                        className="signature-ink mt-2 text-3xl"
                        style={{ fontFamily: getSignatureFontFamily(font.value) }}
                      >
                        {form.signature_text || "Your Signature"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button className="w-full mt-3" onClick={handleSave}>{editId ? "Update" : "Add"} Profile</Button>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
        <div className="grid gap-3">
          {profiles.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary/40" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{p.name}</p>
                      {p.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{[p.city, p.state].filter(Boolean).join(", ")}</p>
                    {p.gstin && <p className="text-xs text-muted-foreground">GSTIN: {p.gstin}</p>}
                    {p.invoice_number_pattern && (
                      <p className="text-xs text-muted-foreground">Invoice Pattern: {p.invoice_number_pattern}</p>
                    )}
                    {p.signature_text && (
                      <p
                        className="signature-ink mt-2 text-2xl"
                        style={{ fontFamily: getSignatureFontFamily(p.signature_font) }}
                      >
                        {p.signature_text}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
