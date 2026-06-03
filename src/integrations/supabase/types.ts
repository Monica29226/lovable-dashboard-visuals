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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      budget_2026: {
        Row: {
          april: number | null
          august: number | null
          category: string
          company_id: string
          created_at: string | null
          december: number | null
          display_order: number | null
          february: number | null
          id: string
          january: number | null
          july: number | null
          june: number | null
          level: number | null
          march: number | null
          may: number | null
          november: number | null
          october: number | null
          parent_category: string | null
          september: number | null
          subcategory: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          april?: number | null
          august?: number | null
          category: string
          company_id: string
          created_at?: string | null
          december?: number | null
          display_order?: number | null
          february?: number | null
          id?: string
          january?: number | null
          july?: number | null
          june?: number | null
          level?: number | null
          march?: number | null
          may?: number | null
          november?: number | null
          october?: number | null
          parent_category?: string | null
          september?: number | null
          subcategory?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          april?: number | null
          august?: number | null
          category?: string
          company_id?: string
          created_at?: string | null
          december?: number | null
          display_order?: number | null
          february?: number | null
          id?: string
          january?: number | null
          july?: number | null
          june?: number | null
          level?: number | null
          march?: number | null
          may?: number | null
          november?: number | null
          october?: number | null
          parent_category?: string | null
          september?: number | null
          subcategory?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_2026_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_2026_audit: {
        Row: {
          budget_row_id: string | null
          category: string
          changed_at: string
          company_id: string
          created_at: string
          field_changed: string
          id: string
          new_value: number | null
          old_value: number | null
          user_id: string
        }
        Insert: {
          budget_row_id?: string | null
          category: string
          changed_at?: string
          company_id: string
          created_at?: string
          field_changed: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          user_id: string
        }
        Update: {
          budget_row_id?: string | null
          category?: string
          changed_at?: string
          company_id?: string
          created_at?: string
          field_changed?: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_2026_audit_budget_row_id_fkey"
            columns: ["budget_row_id"]
            isOneToOne: false
            referencedRelation: "budget_2026"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_2026_audit_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          created_at: string
          display_name: string | null
          domain_name: string
          id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          domain_name: string
          id?: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string | null
          domain_name?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      financial_data: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          period: string
          realm_id: string
          report_type: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          period: string
          realm_id: string
          report_type: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          period?: string
          realm_id?: string
          report_type?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          realm_id: string
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          realm_id: string
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          realm_id?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          biometric_enabled: boolean | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          selected_domain_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          biometric_enabled?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          selected_domain_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          biometric_enabled?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          selected_domain_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_domain_id_fkey"
            columns: ["selected_domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_balance_sheet: {
        Row: {
          company_id: string
          id: string
          raw_data: Json | null
          report_date: string
          synced_at: string | null
          total_assets: number | null
          total_equity: number | null
          total_liabilities: number | null
        }
        Insert: {
          company_id: string
          id?: string
          raw_data?: Json | null
          report_date: string
          synced_at?: string | null
          total_assets?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
        }
        Update: {
          company_id?: string
          id?: string
          raw_data?: Json | null
          report_date?: string
          synced_at?: string | null
          total_assets?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_balance_sheet_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_budgets: {
        Row: {
          active: boolean | null
          company_id: string
          end_date: string | null
          id: string
          name: string | null
          qb_budget_id: string
          raw_data: Json | null
          start_date: string | null
          synced_at: string | null
        }
        Insert: {
          active?: boolean | null
          company_id: string
          end_date?: string | null
          id?: string
          name?: string | null
          qb_budget_id: string
          raw_data?: Json | null
          start_date?: string | null
          synced_at?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string
          end_date?: string | null
          id?: string
          name?: string | null
          qb_budget_id?: string
          raw_data?: Json | null
          start_date?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_companies: {
        Row: {
          client_id: string
          client_secret: string
          company_name: string
          created_at: string
          id: string
          is_connected: boolean | null
          realm_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          client_secret: string
          company_name: string
          created_at?: string
          id?: string
          is_connected?: boolean | null
          realm_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          company_name?: string
          created_at?: string
          id?: string
          is_connected?: boolean | null
          realm_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quickbooks_customers: {
        Row: {
          active: boolean | null
          balance: number | null
          company_id: string
          company_name: string | null
          display_name: string | null
          id: string
          primary_email: string | null
          primary_phone: string | null
          qb_customer_id: string
          raw_data: Json | null
          synced_at: string | null
        }
        Insert: {
          active?: boolean | null
          balance?: number | null
          company_id: string
          company_name?: string | null
          display_name?: string | null
          id?: string
          primary_email?: string | null
          primary_phone?: string | null
          qb_customer_id: string
          raw_data?: Json | null
          synced_at?: string | null
        }
        Update: {
          active?: boolean | null
          balance?: number | null
          company_id?: string
          company_name?: string | null
          display_name?: string | null
          id?: string
          primary_email?: string | null
          primary_phone?: string | null
          qb_customer_id?: string
          raw_data?: Json | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_expenses: {
        Row: {
          account_ref: string | null
          company_id: string
          doc_number: string | null
          id: string
          payee_name: string | null
          payment_type: string | null
          qb_expense_id: string
          raw_data: Json | null
          synced_at: string | null
          total_amount: number | null
          txn_date: string | null
        }
        Insert: {
          account_ref?: string | null
          company_id: string
          doc_number?: string | null
          id?: string
          payee_name?: string | null
          payment_type?: string | null
          qb_expense_id: string
          raw_data?: Json | null
          synced_at?: string | null
          total_amount?: number | null
          txn_date?: string | null
        }
        Update: {
          account_ref?: string | null
          company_id?: string
          doc_number?: string | null
          id?: string
          payee_name?: string | null
          payment_type?: string | null
          qb_expense_id?: string
          raw_data?: Json | null
          synced_at?: string | null
          total_amount?: number | null
          txn_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_invoices: {
        Row: {
          balance: number | null
          company_id: string
          customer_name: string | null
          doc_number: string | null
          due_date: string | null
          id: string
          qb_invoice_id: string
          raw_data: Json | null
          status: string | null
          synced_at: string | null
          total_amount: number | null
          txn_date: string | null
        }
        Insert: {
          balance?: number | null
          company_id: string
          customer_name?: string | null
          doc_number?: string | null
          due_date?: string | null
          id?: string
          qb_invoice_id: string
          raw_data?: Json | null
          status?: string | null
          synced_at?: string | null
          total_amount?: number | null
          txn_date?: string | null
        }
        Update: {
          balance?: number | null
          company_id?: string
          customer_name?: string | null
          doc_number?: string | null
          due_date?: string | null
          id?: string
          qb_invoice_id?: string
          raw_data?: Json | null
          status?: string | null
          synced_at?: string | null
          total_amount?: number | null
          txn_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_profit_loss: {
        Row: {
          company_id: string
          end_date: string
          id: string
          net_income: number | null
          raw_data: Json | null
          report_date: string
          start_date: string
          synced_at: string | null
          total_expenses: number | null
          total_income: number | null
        }
        Insert: {
          company_id: string
          end_date: string
          id?: string
          net_income?: number | null
          raw_data?: Json | null
          report_date: string
          start_date: string
          synced_at?: string | null
          total_expenses?: number | null
          total_income?: number | null
        }
        Update: {
          company_id?: string
          end_date?: string
          id?: string
          net_income?: number | null
          raw_data?: Json | null
          report_date?: string
          start_date?: string
          synced_at?: string | null
          total_expenses?: number | null
          total_income?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_profit_loss_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_tokens: {
        Row: {
          access_token: string
          company_id: string
          created_at: string | null
          id: string
          realm_id: string
          refresh_token: string
          token_expiry: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          company_id: string
          created_at?: string | null
          id?: string
          realm_id: string
          refresh_token: string
          token_expiry: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          company_id?: string
          created_at?: string | null
          id?: string
          realm_id?: string
          refresh_token?: string
          token_expiry?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "quickbooks_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          realm_id: string
          records_synced: number | null
          status: string
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          realm_id: string
          records_synced?: number | null
          status: string
          sync_type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          realm_id?: string
          records_synced?: number | null
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_company_access: {
        Args: { target_company_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "viewer"
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
      app_role: ["admin", "user", "viewer"],
    },
  },
} as const
