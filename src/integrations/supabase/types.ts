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
      quickbooks_balance_sheet: {
        Row: {
          id: string
          raw_data: Json | null
          report_date: string
          synced_at: string | null
          total_assets: number | null
          total_equity: number | null
          total_liabilities: number | null
        }
        Insert: {
          id?: string
          raw_data?: Json | null
          report_date: string
          synced_at?: string | null
          total_assets?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
        }
        Update: {
          id?: string
          raw_data?: Json | null
          report_date?: string
          synced_at?: string | null
          total_assets?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
        }
        Relationships: []
      }
      quickbooks_budgets: {
        Row: {
          active: boolean | null
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
          end_date?: string | null
          id?: string
          name?: string | null
          qb_budget_id?: string
          raw_data?: Json | null
          start_date?: string | null
          synced_at?: string | null
        }
        Relationships: []
      }
      quickbooks_customers: {
        Row: {
          active: boolean | null
          balance: number | null
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
          company_name?: string | null
          display_name?: string | null
          id?: string
          primary_email?: string | null
          primary_phone?: string | null
          qb_customer_id?: string
          raw_data?: Json | null
          synced_at?: string | null
        }
        Relationships: []
      }
      quickbooks_expenses: {
        Row: {
          account_ref: string | null
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
        Relationships: []
      }
      quickbooks_invoices: {
        Row: {
          balance: number | null
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
        Relationships: []
      }
      quickbooks_profit_loss: {
        Row: {
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
        Relationships: []
      }
      quickbooks_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          realm_id: string
          refresh_token: string
          token_expiry: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          realm_id: string
          refresh_token: string
          token_expiry: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          realm_id?: string
          refresh_token?: string
          token_expiry?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
