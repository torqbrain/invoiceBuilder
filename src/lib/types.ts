import type { Database } from "@/integrations/supabase/types";

export type BusinessProfile = Database["public"]["Tables"]["business_profiles"]["Row"];
export type BusinessMember = Database["public"]["Tables"]["business_members"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type TaxConfig = Database["public"]["Tables"]["tax_configs"]["Row"];
export type Currency = Database["public"]["Tables"]["currencies"]["Row"];
export type InvoiceTemplate = Database["public"]["Tables"]["invoice_templates"]["Row"];
export type Translation = Database["public"]["Tables"]["translations"]["Row"];
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];

export interface InvoiceWithRelations extends Invoice {
  business_profiles?: BusinessProfile | null;
  customers?: Customer | null;
  currencies?: Currency | null;
  invoice_templates?: InvoiceTemplate | null;
  invoice_items?: InvoiceItem[];
}

export interface BusinessMemberWithBusiness extends BusinessMember {
  business_profiles?: BusinessProfile | null;
}

export interface TranslationMap {
  [key: string]: string;
}

export interface InvoiceFormData {
  invoice_number: string;
  business_profile_id: string;
  customer_id: string;
  template_id: string;
  currency_id: string;
  language_code: string;
  invoice_date: string;
  due_date: string;
  place_of_supply: string;
  notes: string;
  terms_and_conditions: string;
  is_export: boolean;
  status: InvoiceStatus;
  received_amount: number;
  items: InvoiceItemFormData[];
  tax_ids: string[];
}

export interface InvoiceItemFormData {
  id?: string;
  product_id?: string;
  description: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}
