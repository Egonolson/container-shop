export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      construction_sites: {
        Row: {
          city: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string
          created_at: string
          customer_id: string
          erp_site_id: string | null
          geo_lat: number | null
          geo_lng: number | null
          house_number: string | null
          id: string
          is_archived: boolean
          name: string
          notes: string | null
          postal_code: string | null
          street: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          customer_id: string
          erp_site_id?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          house_number?: string | null
          id?: string
          is_archived?: boolean
          name: string
          notes?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          customer_id?: string
          erp_site_id?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          house_number?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          notes?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          address_verified: boolean
          city: string | null
          company_name: string | null
          country: string
          created_at: string
          customer_kind: Database["public"]["Enums"]["customer_kind"]
          erp_customer_id: string | null
          first_name: string | null
          house_number: string | null
          id: string
          last_name: string | null
          phone: string | null
          postal_code: string | null
          role: Database["public"]["Enums"]["account_role"]
          street: string | null
          updated_at: string
          vat_id: string | null
        }
        Insert: {
          address_verified?: boolean
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          customer_kind?: Database["public"]["Enums"]["customer_kind"]
          erp_customer_id?: string | null
          first_name?: string | null
          house_number?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: Database["public"]["Enums"]["account_role"]
          street?: string | null
          updated_at?: string
          vat_id?: string | null
        }
        Update: {
          address_verified?: boolean
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          customer_kind?: Database["public"]["Enums"]["customer_kind"]
          erp_customer_id?: string | null
          first_name?: string | null
          house_number?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: Database["public"]["Enums"]["account_role"]
          street?: string | null
          updated_at?: string
          vat_id?: string | null
        }
        Relationships: []
      }
      shop_requests: {
        Row: {
          construction_site_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          mode: string
          payload: Json
          reference: string
          request_form_version: string
          status: string
        }
        Insert: {
          construction_site_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          mode: string
          payload: Json
          reference: string
          request_form_version: string
          status?: string
        }
        Update: {
          construction_site_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          mode?: string
          payload?: Json
          reference?: string
          request_form_version?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_requests_construction_site_id_fkey"
            columns: ["construction_site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email_has_account: { Args: { check_email: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      owns_construction_site: { Args: { p_site_id: string }; Returns: boolean }
    }
    Enums: {
      account_role: "customer" | "staff" | "admin"
      customer_kind: "private" | "business"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_role: ["customer", "staff", "admin"],
      customer_kind: ["private", "business"],
    },
  },
} as const

