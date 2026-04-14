import { useMemo, useState } from "react";
import { useBusinessProfiles, useProducts } from "@/hooks/useInvoiceData";
import type { ProductWithInventory } from "@/lib/types";
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
import { Plus, Edit, Trash2, Search, Package, Boxes, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/contexts/BusinessContext";
import { DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

const emptyForm = (defaultProfileId = "") => ({
  business_profile_id: defaultProfileId,
  name: "",
  sku: "",
  item_type: "goods",
  category: "",
  brand: "",
  barcode: "",
  description: "",
  hsn_sac: "",
  rate: 0,
  cost_price: 0,
  unit: "Qty",
  quantity: 1,
  track_inventory: true,
  opening_stock: 0,
  reorder_level: 0,
  storage_location: "",
  is_active: true,
});

const emptyAdjustmentForm = () => ({
  movement_type: "adjustment_add",
  quantity: 0,
  notes: "",
});

export default function ProductsPage() {
  const { data: profiles = [] } = useBusinessProfiles();
  const { data: products = [], isLoading } = useProducts({ activeOnly: false });
  const { activeBusinessId } = useBusiness();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [missingBusinessDialogOpen, setMissingBusinessDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustmentForm());
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const qc = useQueryClient();

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return (products as ProductWithInventory[]).filter((product) =>
      [
        product.name,
        product.sku ?? "",
        product.category ?? "",
        product.brand ?? "",
        product.barcode ?? "",
        product.description ?? "",
        product.hsn_sac ?? "",
        product.unit ?? "",
        product.business_profiles?.name ?? "",
      ]
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [products, search]);

  const hasSingleBusiness = profiles.length === 1;
  const selectedBusinessProfile = profiles.find((profile) => profile.id === form.business_profile_id);

  const resetForm = () => {
    setForm(emptyForm(activeBusinessId ?? profiles.find((profile) => profile.is_default)?.id ?? profiles[0]?.id ?? ""));
    setEditId(null);
  };

  const handleSave = async () => {
    if (isSaving) return;
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
      sku: form.sku.trim() || null,
      category: form.category.trim() || null,
      brand: form.brand.trim() || null,
      barcode: form.barcode.trim() || null,
      description: form.description.trim() || null,
      hsn_sac: form.hsn_sac.trim() || null,
      track_inventory: form.item_type === "goods" ? form.track_inventory : false,
      opening_stock: form.item_type === "goods" && form.track_inventory ? form.opening_stock : 0,
      reorder_level: form.item_type === "goods" && form.track_inventory ? form.reorder_level : 0,
      storage_location: form.item_type === "goods" && form.track_inventory ? (form.storage_location.trim() || null) : null,
    };

    setIsSaving(true);
    try {
      const { error } = editId
        ? await supabase.from("products").update(payload).eq("id", editId)
        : await supabase.from("products").insert(payload);

      if (error) {
        toast({ title: "Unable to save product", description: error.message, variant: "destructive" });
        return;
      }

      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inventory_movements"] });
      setOpen(false);
      resetForm();
      toast({ title: editId ? "Product updated" : "Product added" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: ProductWithInventory) => {
    setForm({
      business_profile_id: product.business_profile_id,
      name: product.name,
      sku: product.sku ?? "",
      item_type: product.item_type ?? "service",
      category: product.category ?? "",
      brand: product.brand ?? "",
      barcode: product.barcode ?? "",
      description: product.description ?? "",
      hsn_sac: product.hsn_sac ?? "",
      rate: Number(product.rate ?? 0),
      cost_price: Number(product.cost_price ?? 0),
      unit: product.unit ?? "Qty",
      quantity: Number(product.quantity ?? 1),
      track_inventory: product.track_inventory ?? false,
      opening_stock: Number(product.opening_stock ?? 0),
      reorder_level: Number(product.reorder_level ?? 0),
      storage_location: product.storage_location ?? "",
      is_active: product.is_active ?? true,
    });
    setEditId(product.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        toast({ title: "Unable to delete product", description: error.message, variant: "destructive" });
        return;
      }

      qc.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenAdjustment = (product: ProductWithInventory) => {
    setSelectedProduct(product);
    setAdjustmentForm(emptyAdjustmentForm());
    setAdjustmentOpen(true);
  };

  const handleAdjustStock = async () => {
    if (isAdjustingStock) return;
    if (!selectedProduct) return;
    if (!selectedProduct.track_inventory || selectedProduct.item_type !== "goods") {
      toast({ title: "Inventory tracking is not enabled for this product", variant: "destructive" });
      return;
    }

    if (!adjustmentForm.quantity || adjustmentForm.quantity <= 0) {
      toast({ title: "Enter a valid stock quantity", variant: "destructive" });
      return;
    }

    const quantityChange = adjustmentForm.movement_type === "adjustment_add"
      ? adjustmentForm.quantity
      : adjustmentForm.quantity * -1;

    setIsAdjustingStock(true);
    try {
      const { error } = await supabase.from("inventory_movements").insert({
        business_profile_id: selectedProduct.business_profile_id,
        product_id: selectedProduct.id,
        movement_type: adjustmentForm.movement_type,
        quantity_change: quantityChange,
        unit_cost: selectedProduct.cost_price ?? 0,
        reference_type: "manual_adjustment",
        notes: adjustmentForm.notes.trim() || null,
      });

      if (error) {
        toast({ title: "Unable to adjust stock", description: error.message, variant: "destructive" });
        return;
      }

      qc.invalidateQueries({ queryKey: ["products"] });
      setAdjustmentOpen(false);
      setSelectedProduct(null);
      setAdjustmentForm(emptyAdjustmentForm());
      toast({ title: "Stock adjusted" });
    } finally {
      setIsAdjustingStock(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">Manage products, services, and stock in one place</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                if (profiles.length === 0) {
                  setMissingBusinessDialogOpen(true);
                  return;
                }
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit" : "Add"} Product</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="text-xs">Business Profile *</Label>
                {profiles.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start py-3 text-left font-normal text-muted-foreground"
                    onClick={() => {
                      setOpen(false);
                      setMissingBusinessDialogOpen(true);
                    }}
                  >
                    No business profiles yet. Tap to create one.
                  </Button>
                ) : hasSingleBusiness ? (
                  <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {selectedBusinessProfile?.name || profiles[0]?.name}
                  </div>
                ) : (
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
                )}
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Name *</Label>
                <Input placeholder="Website Maintenance Retainer" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <Label className="text-xs">SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Optional internal SKU" />
              </div>

              <div>
                <Label className="text-xs">Item Type</Label>
                <Select value={form.item_type} onValueChange={(value) => setForm({
                  ...form,
                  item_type: value,
                  track_inventory: value === "goods" ? true : false,
                })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="goods">Goods</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Category</Label>
                <Input placeholder="Consulting" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>

              <div>
                <Label className="text-xs">Brand</Label>
                <Input placeholder="Internal or supplier brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>

              <div>
                <Label className="text-xs">Barcode</Label>
                <Input placeholder="8901234567890" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={3}
                  placeholder="Short description used on invoices and product listings"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs">HSN / SAC</Label>
                <Input placeholder="998314" value={form.hsn_sac} onChange={(e) => setForm({ ...form, hsn_sac: e.target.value })} />
              </div>

              <div>
                <Label className="text-xs">Sales Rate</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: Number(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label className="text-xs">Cost Price</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label className="text-xs">Unit</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:hidden"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {COMMON_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <div className="hidden sm:block">
                  <Select value={form.unit} onValueChange={(value) => setForm({ ...form, unit: value })}>
                    <SelectTrigger>
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

              <div>
                <Label className="text-xs">Default Quantity</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) || 0 })}
                />
              </div>

              {form.item_type === "goods" && (
                <>
                  <div className="md:col-span-2 flex items-center gap-3 rounded-md border p-3">
                    <Switch
                      checked={form.track_inventory}
                      onCheckedChange={(value) => setForm({ ...form, track_inventory: value })}
                    />
                    <div>
                      <Label className="text-xs">Track inventory</Label>
                      <p className="text-xs text-muted-foreground">Enable stock adjustments and invoice-based stock deduction.</p>
                    </div>
                  </div>

                  {form.track_inventory && (
                    <>
                      <div>
                        <Label className="text-xs">Opening Stock</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={form.opening_stock}
                          onChange={(e) => setForm({ ...form, opening_stock: Number(e.target.value) || 0 })}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Reorder Level</Label>
                        <Input
                          type="number"
                          placeholder="10"
                          value={form.reorder_level}
                          onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-xs">Storage Location</Label>
                        <Input
                          value={form.storage_location}
                          onChange={(e) => setForm({ ...form, storage_location: e.target.value })}
                          placeholder="Warehouse rack, shelf, bin..."
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="flex items-end gap-3 pb-2">
                <Switch checked={form.is_active} onCheckedChange={(value) => setForm({ ...form, is_active: value })} />
                <Label className="text-xs">Active product</Label>
              </div>
            </div>

            <Button className="w-full mt-3" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (editId ? "Updating..." : "Adding...") : (editId ? "Update" : "Add")} Product
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

      <Dialog open={missingBusinessDialogOpen} onOpenChange={setMissingBusinessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a business profile first</DialogTitle>
            <DialogDescription>
              Every product must be mapped to a business profile before it can be created.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="w-full"
            onClick={() => {
              setMissingBusinessDialogOpen(false);
              navigate("/business-profiles");
            }}
          >
            Go to Business Profiles
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {selectedProduct ? `Update stock for ${selectedProduct.name}` : "Adjust stock for this product"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">{selectedProduct?.name}</p>
              <p className="text-muted-foreground">
                Current stock: {Number(selectedProduct?.current_stock || 0).toLocaleString()} {selectedProduct?.unit || "Qty"}
              </p>
            </div>

            <div>
              <Label className="text-xs">Adjustment Type</Label>
              <Select
                value={adjustmentForm.movement_type}
                onValueChange={(value) => setAdjustmentForm({ ...adjustmentForm, movement_type: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment_add">Add Stock</SelectItem>
                  <SelectItem value="adjustment_remove">Remove Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                placeholder="5"
                value={adjustmentForm.quantity}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: Number(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={3}
                value={adjustmentForm.notes}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                placeholder="Reason for stock adjustment"
              />
            </div>

            <Button className="w-full" onClick={handleAdjustStock} disabled={isAdjustingStock}>{isAdjustingStock ? "Saving..." : "Save Adjustment"}</Button>
          </div>
        </DialogContent>
      </Dialog>

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
              <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Package className="h-8 w-8 shrink-0 text-primary/40" />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{product.name}</p>
                      <Badge variant="outline">{product.item_type === "goods" ? "Goods" : "Service"}</Badge>
                      <Badge variant="secondary">{product.unit || "Qty"}</Badge>
                      {!(product.is_active ?? true) && <Badge variant="outline">Inactive</Badge>}
                      {product.track_inventory && product.low_stock && <Badge variant="destructive">Low Stock</Badge>}
                    </div>
                    <p className="break-words text-sm text-muted-foreground">
                      {product.business_profiles?.name || "No business profile"} • Sales {Number(product.rate || 0).toLocaleString()} • Cost {Number(product.cost_price || 0).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {product.sku && <span className="break-all">SKU: {product.sku}</span>}
                      {product.category && <span>Category: {product.category}</span>}
                      {product.brand && <span>Brand: {product.brand}</span>}
                      {product.barcode && <span className="break-all">Barcode: {product.barcode}</span>}
                    </div>
                    {product.description && <p className="break-words text-sm text-muted-foreground">{product.description}</p>}
                    {product.hsn_sac && <p className="break-all text-xs text-muted-foreground">HSN/SAC: {product.hsn_sac}</p>}
                    {product.item_type === "goods" && product.track_inventory && (
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Boxes className="h-3.5 w-3.5" />Stock: {Number(product.current_stock || 0).toLocaleString()} {product.unit || "Qty"}</span>
                        <span>Opening: {Number(product.opening_stock || 0).toLocaleString()}</span>
                        <span>Reorder at: {Number(product.reorder_level || 0).toLocaleString()}</span>
                        {product.storage_location && <span>Location: {product.storage_location}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-1">
                  {product.item_type === "goods" && product.track_inventory && (
                    <Button variant="ghost" size="icon" onClick={() => handleOpenAdjustment(product)} title="Adjust stock">
                      {product.current_stock > 0 ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} disabled={deletingId === product.id}>
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
