import { useState } from "react";
import { useCustomers } from "@/hooks/useInvoiceData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/contexts/BusinessContext";

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const { activeBusinessId } = useBusiness();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address_line1: "", city: "", state: "", country: "", postal_code: "", gstin: "", pan: "", contact_person: "" });
  const qc = useQueryClient();

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase()));

  const resetForm = () => { setForm({ name: "", email: "", phone: "", address_line1: "", city: "", state: "", country: "", postal_code: "", gstin: "", pan: "", contact_person: "" }); setEditId(null); };

  const handleSave = async () => {
    if (!activeBusinessId) { toast({ title: "Select a business first", variant: "destructive" }); return; }
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    if (editId) {
      await supabase.from("customers").update(form).eq("id", editId);
    } else {
      await supabase.from("customers").insert({ ...form, business_profile_id: activeBusinessId });
    }
    qc.invalidateQueries({ queryKey: ["customers"] });
    setOpen(false);
    resetForm();
    toast({ title: editId ? "Customer updated" : "Customer added" });
  };

  const handleEdit = (c: any) => {
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "", address_line1: c.address_line1 || "", city: c.city || "", state: c.state || "", country: c.country || "", postal_code: c.postal_code || "", gstin: c.gstin || "", pan: c.pan || "", contact_person: c.contact_person || "" });
    setEditId(c.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    await supabase.from("customers").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["customers"] });
    toast({ title: "Customer deleted" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm">{customers.length} customers</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Customer</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="col-span-2"><Label className="text-xs">Name *</Label><Input placeholder="Red Thread Innovations Inc" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="text-xs">Email</Label><Input placeholder="accounts@client.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className="text-xs">Phone</Label><Input placeholder="+1 416 555 0123" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Address</Label><Input placeholder="123 King Street West" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} /></div>
              <div><Label className="text-xs">City</Label><Input placeholder="Toronto" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label className="text-xs">State</Label><Input placeholder="Ontario" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div><Label className="text-xs">Country</Label><Input placeholder="Canada" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div><Label className="text-xs">Postal Code</Label><Input placeholder="M5V 1L7" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
              <div><Label className="text-xs">GSTIN</Label><Input placeholder="24BRGPA5729L1Z8" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
              <div><Label className="text-xs">PAN</Label><Input placeholder="BRGPA5729L" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Contact Person</Label><Input placeholder="Seema Patel" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            </div>
            <Button className="w-full mt-3" onClick={handleSave}>{editId ? "Update" : "Add"} Customer</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="break-words text-sm text-muted-foreground">{[c.city, c.state, c.country].filter(Boolean).join(", ") || "No address"}</p>
                  {c.email && <p className="break-all text-xs text-muted-foreground">{c.email}</p>}
                </div>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
