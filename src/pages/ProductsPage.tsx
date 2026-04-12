import { useMemo, useState } from "react";
import { useBusinessProfiles, useProducts } from "@/hooks/useInvoiceData";
import type { Product } from "@/lib/types";
import { COMMON_UNITS } from "@/lib/units";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/contexts/BusinessContext";

type ProductWithProfile = Product & {
  business_profiles?: {
    name: string;
  } | null;
};

const emptyForm = (defaultProfileId = "") => ({
  business_profile_id: defaultProfileId,
  name: "",
  description: "",
  hsn_sac: "",
  rate: 0,
  unit: "Qty",
  is_active: true,
});

export default function ProductsPage() {
  const { data: profiles = [] } = useBusinessProfiles();
  const { data: products = [], isLoading } = useProducts({ activeOnly: false });
  const { activeBusinessId } = useBusiness();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const qc = useQueryClient();

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return (products as ProductWithProfile[]).filter((product) =>
      [product.name, product.description ?? "", product.hsn_sac ?? "", product.unit ?? "", product.business_profiles?.name ?? ""]
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [products, search]);

  const resetForm = () => {
    setForm(emptyForm(activeBusinessId ?? profiles.find((profile) => profile.is_default)?.id ?? profiles[0]?.id ?? ""));
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.business_profile_id) {
      toast({ title: "Business profile is required", variant: "destructive" });
      return;
    }

    if (!form.name.trim()) {
      toast({ title: "Product name is required", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      unit: form.unit.trim() || "Qty",
    };

    const { error } = editId
      ? await supabase.from("products").update(payload).eq("id", editId)
      : await supabase.from("products").insert(payload);

    if (error) {
      toast({ title: "Unable to save product", description: error.message, variant: "destructive" });
      return;
    }

    qc.invalidateQueries({ queryKey: ["products"] });
    setOpen(false);
    resetForm();
    toast({ title: editId ? "Product updated" : "Product added" });
  };

  const handleEdit = (product: ProductWithProfile) => {
    setForm({
      business_profile_id: product.business_profile_id,
      name: product.name,
      description: product.description ?? "",
      hsn_sac: product.hsn_sac ?? "",
      rate: Number(product.rate ?? 0),
      unit: product.unit ?? "Qty",
      is_active: product.is_active ?? true,
    });
    setEditId(product.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Unable to delete product", description: error.message, variant: "destructive" });
      return;
    }

    qc.invalidateQueries({ queryKey: ["products"] });
    toast({ title: "Product deleted" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">Save reusable products and services for faster invoicing</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit" : "Add"} Product</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Business Profile *</Label>
                <Select
                  value={form.business_profile_id}
                  onValueChange={(value) => setForm({ ...form, business_profile_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label className="text-xs">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs">HSN / SAC</Label>
                <Input value={form.hsn_sac} onChange={(e) => setForm({ ...form, hsn_sac: e.target.value })} />
              </div>

              <div>
                <Label className="text-xs">Rate</Label>
                <Input
                  type="number"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: Number(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label className="text-xs">Unit</Label>
                <Input
                  list="product-unit-suggestions"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="Qty, Hours, Man-Days..."
                />
                <datalist id="product-unit-suggestions">
                  {COMMON_UNITS.map((unit) => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-end gap-3 pb-2">
                <Switch checked={form.is_active} onCheckedChange={(value) => setForm({ ...form, is_active: value })} />
                <Label className="text-xs">Active product</Label>
              </div>
            </div>

            <Button className="w-full mt-3" onClick={handleSave}>
              {editId ? "Update" : "Add"} Product
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products, services, units..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No products yet. Add your first reusable product or service.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <Package className="h-8 w-8 text-primary/40 shrink-0" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{product.name}</p>
                      <Badge variant="secondary">{product.unit || "Qty"}</Badge>
                      {!(product.is_active ?? true) && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.business_profiles?.name || "No business profile"} • Rate {Number(product.rate || 0).toLocaleString()}
                    </p>
                    {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
                    {product.hsn_sac && <p className="text-xs text-muted-foreground">HSN/SAC: {product.hsn_sac}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
