import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InvoiceFormData, InvoiceStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { getNextInvoiceNumber as computeNextInvoiceNumber, normalizeInvoicePattern } from "@/lib/invoice-number";
import { useBusiness } from "@/contexts/BusinessContext";
import type { BusinessMemberWithBusiness, ProductWithInventory } from "@/lib/types";

const INVENTORY_TRACKING_STATUSES: InvoiceStatus[] = ["sent", "paid", "partially_paid", "overdue"];

function shouldTrackInventoryForInvoice(status: InvoiceStatus) {
  return INVENTORY_TRACKING_STATUSES.includes(status);
}

function getCurrentStockForProduct(product: {
  id: string;
  opening_stock?: number | null;
}, movementTotals: Map<string, number>) {
  const openingStock = Number(product.opening_stock || 0);
  const movementTotal = Number(movementTotals.get(product.id) || 0);
  return openingStock + movementTotal;
}

export function useBusinessProfiles() {
  return useQuery({
    queryKey: ["business_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_members")
        .select("*, business_profiles(*)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as BusinessMemberWithBusiness[])
        .map((membership) => membership.business_profiles)
        .filter((business) => Boolean(business));
    },
  });
}

export function useCustomers(options?: { businessProfileId?: string }) {
  const { activeBusinessId } = useBusiness();
  const scopedBusinessProfileId = options?.businessProfileId ?? activeBusinessId;
  return useQuery({
    queryKey: ["customers", scopedBusinessProfileId],
    enabled: !!scopedBusinessProfileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_profile_id", scopedBusinessProfileId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("currencies").select("*").eq("is_active", true).order("code");
      if (error) throw error;
      return data;
    },
  });
}

export function useTaxConfigs() {
  return useQuery({
    queryKey: ["tax_configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tax_configs").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useProducts(options?: { businessProfileId?: string; activeOnly?: boolean }) {
  const { activeBusinessId } = useBusiness();
  const scopedBusinessProfileId = options?.businessProfileId ?? activeBusinessId;

  return useQuery({
    queryKey: ["products", scopedBusinessProfileId ?? "all", options?.activeOnly ?? false],
    enabled: !!scopedBusinessProfileId,
    queryFn: async () => {
      let productsQuery = supabase
        .from("products")
        .select("*, business_profiles(name)")
        .order("name");

      if (options?.activeOnly) {
        productsQuery = productsQuery.eq("is_active", true);
      }

      if (scopedBusinessProfileId) {
        productsQuery = productsQuery.eq("business_profile_id", scopedBusinessProfileId);
      }

      const { data: products, error } = await productsQuery;
      if (error) throw error;

      const productRows = products ?? [];
      if (!scopedBusinessProfileId || productRows.length === 0) {
        return productRows.map((product) => ({
          ...product,
          current_stock: Number(product.opening_stock || 0),
          available_stock: Number(product.opening_stock || 0),
          low_stock: Boolean(product.track_inventory) && Number(product.opening_stock || 0) <= Number(product.reorder_level || 0),
        })) as ProductWithInventory[];
      }

      const { data: movements, error: movementsError } = await supabase
        .from("inventory_movements")
        .select("product_id, quantity_change")
        .eq("business_profile_id", scopedBusinessProfileId);

      if (movementsError) throw movementsError;

      const movementTotals = (movements ?? []).reduce((map, movement) => {
        map.set(
          movement.product_id,
          Number(map.get(movement.product_id) || 0) + Number(movement.quantity_change || 0)
        );
        return map;
      }, new Map<string, number>());

      return productRows.map((product) => {
        const currentStock = getCurrentStockForProduct(product, movementTotals);
        return {
          ...product,
          current_stock: currentStock,
          available_stock: currentStock,
          low_stock: Boolean(product.track_inventory) && currentStock <= Number(product.reorder_level || 0),
        };
      }) as ProductWithInventory[];
    },
  });
}

export function useInvoiceTemplates() {
  return useQuery({
    queryKey: ["invoice_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoice_templates").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useInvoices(statusFilter?: InvoiceStatus | null) {
  const { activeBusinessId } = useBusiness();
  return useQuery({
    queryKey: ["invoices", activeBusinessId, statusFilter],
    enabled: !!activeBusinessId,
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*, business_profiles(*), customers(*), currencies(*), invoice_templates(*)")
        .eq("business_profile_id", activeBusinessId!)
        .order("created_at", { ascending: false });
      if (statusFilter) query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useInvoice(id: string | undefined) {
  const { activeBusinessId } = useBusiness();
  return useQuery({
    queryKey: ["invoice", activeBusinessId, id],
    enabled: !!id && !!activeBusinessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, business_profiles(*), customers(*), currencies(*), invoice_templates(*), invoice_items(*)")
        .eq("business_profile_id", activeBusinessId!)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ formData, invoiceId }: { formData: InvoiceFormData; invoiceId?: string }) => {
      const { items, tax_ids, ...invoiceData } = formData;
      const shouldTrackInventory = shouldTrackInventoryForInvoice(invoiceData.status);
      const invoiceItemsPayload = items.map((item, i) => ({
        invoice_id: invoiceId,
        product_id: item.product_id || null,
        description: item.description,
        hsn_sac: item.hsn_sac || null,
        quantity: item.quantity,
        unit: item.unit || null,
        rate: item.rate,
        amount: item.amount,
        sort_order: i,
      }));
      
      // Calculate taxes
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      
      const invoicePayload = {
        ...invoiceData,
        subtotal,
        tax_amount: 0,
        total_amount: subtotal,
        tax_details: [],
      };

      const trackedProductIds = Array.from(
        new Set(items.map((item) => item.product_id).filter(Boolean))
      ) as string[];

      let trackedProducts = new Map<string, {
        id: string;
        business_profile_id: string;
        name: string;
        item_type: string;
        track_inventory: boolean;
        cost_price: number;
      }>();

      if (shouldTrackInventory && trackedProductIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("id, business_profile_id, name, item_type, track_inventory, cost_price")
          .in("id", trackedProductIds);

        if (productsError) throw productsError;

        trackedProducts = new Map((products ?? []).map((product) => [product.id, {
          ...product,
          cost_price: Number(product.cost_price || 0),
          track_inventory: Boolean(product.track_inventory),
        }]));
      }

      const buildInventoryMovements = (resolvedInvoiceId: string) => {
        if (!shouldTrackInventory) return [];

        const aggregatedQuantities = items.reduce((map, item) => {
          if (!item.product_id) return map;

          const product = trackedProducts.get(item.product_id);
          if (!product || product.item_type !== "goods" || !product.track_inventory) {
            return map;
          }

          map.set(item.product_id, Number(map.get(item.product_id) || 0) + Number(item.quantity || 0));
          return map;
        }, new Map<string, number>());

        return Array.from(aggregatedQuantities.entries()).map(([productId, quantity]) => {
          const product = trackedProducts.get(productId)!;

          return {
            business_profile_id: product.business_profile_id,
            product_id: productId,
            movement_type: "invoice_sale",
            quantity_change: quantity * -1,
            unit_cost: product.cost_price,
            reference_type: "invoice",
            reference_id: resolvedInvoiceId,
            notes: `Stock reduced for invoice ${invoiceData.invoice_number}`,
          };
        });
      };

      if (invoiceId) {
        const { error } = await supabase.from("invoices").update(invoicePayload).eq("id", invoiceId);
        if (error) throw error;
        // Delete old items and re-insert
        await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
        const { error: deleteMovementError } = await supabase
          .from("inventory_movements")
          .delete()
          .eq("reference_type", "invoice")
          .eq("reference_id", invoiceId);
        if (deleteMovementError) throw deleteMovementError;
        if (items.length > 0) {
          const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItemsPayload);
          if (itemsError) throw itemsError;
        }
        const inventoryMovements = buildInventoryMovements(invoiceId);
        if (inventoryMovements.length > 0) {
          const { error: inventoryError } = await supabase.from("inventory_movements").insert(inventoryMovements);
          if (inventoryError) throw inventoryError;
        }
        return invoiceId;
      } else {
        const { data, error } = await supabase.from("invoices").insert(invoicePayload).select("id").single();
        if (error) throw error;
        if (items.length > 0) {
          const newInvoiceItemsPayload = invoiceItemsPayload.map((item) => ({
            ...item,
            invoice_id: data.id,
          }));
          const { error: itemsError } = await supabase.from("invoice_items").insert(
            newInvoiceItemsPayload
          );
          if (itemsError) throw itemsError;
        }
        const inventoryMovements = buildInventoryMovements(data.id);
        if (inventoryMovements.length > 0) {
          const { error: inventoryError } = await supabase.from("inventory_movements").insert(inventoryMovements);
          if (inventoryError) throw inventoryError;
        }
        return data.id;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Invoice saved successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving invoice", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error: movementError } = await supabase
        .from("inventory_movements")
        .delete()
        .eq("reference_type", "invoice")
        .eq("reference_id", id);
      if (movementError) throw movementError;

      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Invoice deleted" });
    },
  });
}

export function useNextInvoiceNumber(businessProfileId?: string, pattern?: string | null) {
  return useQuery({
    queryKey: ["next_invoice_number", businessProfileId ?? "default", normalizeInvoicePattern(pattern)],
    enabled: !!businessProfileId,
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("invoice_number")
        .eq("business_profile_id", businessProfileId!)
        .order("created_at", { ascending: false })
        .limit(1);

      return computeNextInvoiceNumber({
        pattern,
        lastInvoiceNumber: data?.[0]?.invoice_number,
      });
    },
  });
}
