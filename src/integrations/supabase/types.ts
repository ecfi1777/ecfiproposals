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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      catalog_items: {
        Row: {
          category: string
          created_at: string
          default_unit: string
          description: string
          id: string
          is_active: boolean | null
          section: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_unit?: string
          description: string
          id?: string
          is_active?: boolean | null
          section?: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          default_unit?: string
          description?: string
          id?: string
          is_active?: boolean | null
          section?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      item_catalog: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      line_items: {
        Row: {
          created_at: string
          cy_override: number | null
          description: string | null
          id: string
          proposal_id: string
          qty: number | null
          section: string
          sort_order: number
          unit: string
          unit_price_opt: number | null
          unit_price_std: number | null
        }
        Insert: {
          created_at?: string
          cy_override?: number | null
          description?: string | null
          id?: string
          proposal_id: string
          qty?: number | null
          section: string
          sort_order?: number
          unit?: string
          unit_price_opt?: number | null
          unit_price_std?: number | null
        }
        Update: {
          created_at?: string
          cy_override?: number | null
          description?: string | null
          id?: string
          proposal_id?: string
          qty?: number | null
          section?: string
          sort_order?: number
          unit?: string
          unit_price_opt?: number | null
          unit_price_std?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "line_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          builder: string | null
          catalog_item_id: string | null
          county: string | null
          description: string
          id: string
          job_location: string | null
          pricing_type: string
          proposal_id: string | null
          qty: number | null
          recorded_at: string
          unit: string
          unit_price: number
          user_id: string
        }
        Insert: {
          builder?: string | null
          catalog_item_id?: string | null
          county?: string | null
          description: string
          id?: string
          job_location?: string | null
          pricing_type: string
          proposal_id?: string | null
          qty?: number | null
          recorded_at?: string
          unit: string
          unit_price: number
          user_id: string
        }
        Update: {
          builder?: string | null
          catalog_item_id?: string | null
          county?: string | null
          description?: string
          id?: string
          job_location?: string | null
          pricing_type?: string
          proposal_id?: string | null
          qty?: number | null
          recorded_at?: string
          unit?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proposal_line_items: {
        Row: {
          auto_cy: number | null
          catalog_item_id: string | null
          created_at: string
          cy_override: number | null
          description: string
          ftg_cy: number | null
          id: string
          optional_total: number | null
          optional_unit_price: number | null
          proposal_id: string
          qty: number | null
          section: string | null
          sort_order: number | null
          standard_total: number | null
          standard_unit_price: number | null
          unit: string | null
          wall_cy: number | null
        }
        Insert: {
          auto_cy?: number | null
          catalog_item_id?: string | null
          created_at?: string
          cy_override?: number | null
          description?: string
          ftg_cy?: number | null
          id?: string
          optional_total?: number | null
          optional_unit_price?: number | null
          proposal_id: string
          qty?: number | null
          section?: string | null
          sort_order?: number | null
          standard_total?: number | null
          standard_unit_price?: number | null
          unit?: string | null
          wall_cy?: number | null
        }
        Update: {
          auto_cy?: number | null
          catalog_item_id?: string | null
          created_at?: string
          cy_override?: number | null
          description?: string
          ftg_cy?: number | null
          id?: string
          optional_total?: number | null
          optional_unit_price?: number | null
          proposal_id?: string
          qty?: number | null
          section?: string | null
          sort_order?: number | null
          standard_total?: number | null
          standard_unit_price?: number | null
          unit?: string | null
          wall_cy?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_line_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_line_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_versions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          proposal_id: string
          snapshot_data: Json
          total_cy: number | null
          total_optional: number | null
          total_standard: number | null
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          proposal_id: string
          snapshot_data?: Json
          total_cy?: number | null
          total_optional?: number | null
          total_standard?: number | null
          user_id: string
          version_number?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          proposal_id?: string
          snapshot_data?: Json
          total_cy?: number | null
          total_optional?: number | null
          total_standard?: number | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          builder: string | null
          concrete_per_yard: number | null
          county: string | null
          created_at: string
          date: string | null
          foundation_size: string | null
          foundation_type: string | null
          id: string
          job_location: string | null
          labor_per_yard: number | null
          other_costs: number | null
          updated_at: string
        }
        Insert: {
          builder?: string | null
          concrete_per_yard?: number | null
          county?: string | null
          created_at?: string
          date?: string | null
          foundation_size?: string | null
          foundation_type?: string | null
          id?: string
          job_location?: string | null
          labor_per_yard?: number | null
          other_costs?: number | null
          updated_at?: string
        }
        Update: {
          builder?: string | null
          concrete_per_yard?: number | null
          county?: string | null
          created_at?: string
          date?: string | null
          foundation_size?: string | null
          foundation_type?: string | null
          id?: string
          job_location?: string | null
          labor_per_yard?: number | null
          other_costs?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      proposals_v2: {
        Row: {
          builder: string | null
          concrete_per_yard: number | null
          concrete_yards_override: number | null
          county: string | null
          created_at: string
          foundation_size: string | null
          foundation_type: string | null
          grand_total: number | null
          id: string
          job_location: string | null
          labor_per_yard: number | null
          notes: string | null
          optional_total: number | null
          other_costs: number | null
          other_costs_note: string | null
          proposal_date: string | null
          standard_total: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          builder?: string | null
          concrete_per_yard?: number | null
          concrete_yards_override?: number | null
          county?: string | null
          created_at?: string
          foundation_size?: string | null
          foundation_type?: string | null
          grand_total?: number | null
          id?: string
          job_location?: string | null
          labor_per_yard?: number | null
          notes?: string | null
          optional_total?: number | null
          other_costs?: number | null
          other_costs_note?: string | null
          proposal_date?: string | null
          standard_total?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          builder?: string | null
          concrete_per_yard?: number | null
          concrete_yards_override?: number | null
          county?: string | null
          created_at?: string
          foundation_size?: string | null
          foundation_type?: string | null
          grand_total?: number | null
          id?: string
          job_location?: string | null
          labor_per_yard?: number | null
          notes?: string | null
          optional_total?: number | null
          other_costs?: number | null
          other_costs_note?: string | null
          proposal_date?: string | null
          standard_total?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_catalog_for_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
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
