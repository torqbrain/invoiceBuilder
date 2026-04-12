import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InvoiceFormData, InvoiceStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { getNextInvoiceNumber as computeNextInvoiceNumber, normalizeInvoicePattern } from "@/lib/invoice-number";

export function useBusinessProfiles() {
  return useQuery({
    queryKey: ["business_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_profiles").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
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
  return useQuery({
    queryKey: ["products", options?.businessProfileId ?? "all", options?.activeOnly ?? false],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, business_profiles(name)")
        .order("name");

      if (options?.activeOnly) {
        query = query.eq("is_active", true);
      }

      if (options?.businessProfileId) {
        query = query.eq("business_profile_id", options.businessProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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
  return useQuery({
    queryKey: ["invoices", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*, business_profiles(*), customers(*), currencies(*), invoice_templates(*)")
        .order("created_at", { ascending: false });
      if (statusFilter) query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoice", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, business_profiles(*), customers(*), currencies(*), invoice_templates(*), invoice_items(*)")
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

      if (invoiceId) {
        const { error } = await supabase.from("invoices").update(invoicePayload).eq("id", invoiceId);
        if (error) throw error;
        // Delete old items and re-insert
        await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
        if (items.length > 0) {
          const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItemsPayload);
          if (itemsError) throw itemsError;
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
        return data.id;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
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
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
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
