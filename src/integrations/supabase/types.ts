export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          bank_account: string | null
          bank_ifsc: string | null
          bank_name: string | null
          bank_swift: string | null
          city: string | null
          country: string | null
          created_at: string | null
          default_terms_and_conditions: string | null
          email: string | null
          gstin: string | null
          id: string
          invoice_number_pattern: string | null
          is_default: boolean | null
          logo_url: string | null
          lut_arn: string | null
          name: string
          pan: string | null
          phone: string | null
          postal_code: string | null
          seal_url: string | null
          signature_font: string | null
          signature_text: string | null
          signature_url: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          bank_account?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          default_terms_and_conditions?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          invoice_number_pattern?: string | null
          is_default?: boolean | null
          logo_url?: string | null
          lut_arn?: string | null
          name: string
          pan?: string | null
          phone?: string | null
          postal_code?: string | null
          seal_url?: string | null
          signature_font?: string | null
          signature_text?: string | null
          signature_url?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          bank_account?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          default_terms_and_conditions?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          invoice_number_pattern?: string | null
          is_default?: boolean | null
          logo_url?: string | null
          lut_arn?: string | null
          name?: string
          pan?: string | null
          phone?: string | null
          postal_code?: string | null
          seal_url?: string | null
          signature_font?: string | null
          signature_text?: string | null
          signature_url?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          decimal_places: number | null
          id: string
          is_active: boolean | null
          name: string
          symbol: string
        }
        Insert: {
          code: string
          decimal_places?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          symbol: string
        }
        Update: {
          code?: string
          decimal_places?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          notes: string | null
          pan: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          notes?: string | null
          pan?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          notes?: string | null
          pan?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string
          hsn_sac: string | null
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number | null
          rate: number | null
          sort_order: number | null
          unit: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description: string
          hsn_sac?: string | null
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity?: number | null
          rate?: number | null
          sort_order?: number | null
          unit?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string
          hsn_sac?: string | null
          id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number | null
          rate?: number | null
          sort_order?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          theme_config: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          theme_config?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          theme_config?: Json | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_in_words: string | null
          business_profile_id: string | null
          created_at: string | null
          currency_id: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          is_export: boolean | null
          language_code: string | null
          notes: string | null
          place_of_supply: string | null
          received_amount: number | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number | null
          tax_amount: number | null
          tax_details: Json | null
          template_id: string | null
          terms_and_conditions: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount_in_words?: string | null
          business_profile_id?: string | null
          created_at?: string | null
          currency_id?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          is_export?: boolean | null
          language_code?: string | null
          notes?: string | null
          place_of_supply?: string | null
          received_amount?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_details?: Json | null
          template_id?: string | null
          terms_and_conditions?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_in_words?: string | null
          business_profile_id?: string | null
          created_at?: string | null
          currency_id?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          is_export?: boolean | null
          language_code?: string | null
          notes?: string | null
          place_of_supply?: string | null
          received_amount?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_details?: Json | null
          template_id?: string | null
          terms_and_conditions?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_profile_id: string
          created_at: string | null
          description: string | null
          hsn_sac: string | null
          id: string
          is_active: boolean | null
          name: string
          quantity: number | null
          rate: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          business_profile_id: string
          created_at?: string | null
          description?: string | null
          hsn_sac?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          quantity?: number | null
          rate?: number
          unit?: string
          updated_at?: string | null
        }
        Update: {
          business_profile_id?: string
          created_at?: string | null
          description?: string | null
          hsn_sac?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          quantity?: number | null
          rate?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_configs: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          name: string
          rate: number
          tax_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          name: string
          rate?: number
          tax_type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          name?: string
          rate?: number
          tax_type?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string | null
          id: string
          is_rtl: boolean | null
          language_code: string
          language_name: string
          translations: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_rtl?: boolean | null
          language_code: string
          language_name: string
          translations?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_rtl?: boolean | null
          language_code?: string
          language_name?: string
          translations?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
      ],
    },
  },
} as const
