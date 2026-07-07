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
      app_smtp_settings: {
        Row: {
          from_email: string | null
          from_name: string
          host: string | null
          id: number
          password_cipher: string | null
          port: number
          secure: boolean
          updated_at: string
          updated_by: string | null
          username: string | null
        }
        Insert: {
          from_email?: string | null
          from_name?: string
          host?: string | null
          id?: number
          password_cipher?: string | null
          port?: number
          secure?: boolean
          updated_at?: string
          updated_by?: string | null
          username?: string | null
        }
        Update: {
          from_email?: string | null
          from_name?: string
          host?: string | null
          id?: number
          password_cipher?: string | null
          port?: number
          secure?: boolean
          updated_at?: string
          updated_by?: string | null
          username?: string | null
        }
        Relationships: []
      }
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
      customer_erp_links: {
        Row: {
          candidates: Json | null
          created_at: string
          customer_id: string
          decided_at: string | null
          decided_by: string | null
          erp_customer_id: string | null
          id: string
          matched_fields: Json | null
          score: number | null
          status: string
        }
        Insert: {
          candidates?: Json | null
          created_at?: string
          customer_id: string
          decided_at?: string | null
          decided_by?: string | null
          erp_customer_id?: string | null
          id?: string
          matched_fields?: Json | null
          score?: number | null
          status?: string
        }
        Update: {
          candidates?: Json | null
          created_at?: string
          customer_id?: string
          decided_at?: string | null
          decided_by?: string | null
          erp_customer_id?: string | null
          id?: string
          matched_fields?: Json | null
          score?: number | null
          status?: string
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
      erp_articles: {
        Row: {
          avv_schluessel: string | null
          bezeichnung: string | null
          category: string | null
          content_hash: string
          external_id: string
          gefahrstoff: boolean | null
          gueltig_ab: string | null
          is_deleted: boolean
          preis_netto: number | null
          preiseinheit: string | null
          raw: Json
          synced_at: string
          type: string | null
          ust_satz: number | null
        }
        Insert: {
          avv_schluessel?: string | null
          bezeichnung?: string | null
          category?: string | null
          content_hash: string
          external_id: string
          gefahrstoff?: boolean | null
          gueltig_ab?: string | null
          is_deleted?: boolean
          preis_netto?: number | null
          preiseinheit?: string | null
          raw: Json
          synced_at?: string
          type?: string | null
          ust_satz?: number | null
        }
        Update: {
          avv_schluessel?: string | null
          bezeichnung?: string | null
          category?: string | null
          content_hash?: string
          external_id?: string
          gefahrstoff?: boolean | null
          gueltig_ab?: string | null
          is_deleted?: boolean
          preis_netto?: number | null
          preiseinheit?: string | null
          raw?: Json
          synced_at?: string
          type?: string | null
          ust_satz?: number | null
        }
        Relationships: []
      }
      erp_connection: {
        Row: {
          api_key_cipher: string | null
          base_url: string | null
          enabled: boolean
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          api_key_cipher?: string | null
          base_url?: string | null
          enabled?: boolean
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          api_key_cipher?: string | null
          base_url?: string | null
          enabled?: boolean
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      erp_construction_sites: {
        Row: {
          city: string | null
          content_hash: string
          erp_customer_id: string | null
          external_id: string
          house_number: string | null
          is_deleted: boolean
          name: string | null
          postal_code: string | null
          raw: Json
          status: string | null
          street: string | null
          synced_at: string
        }
        Insert: {
          city?: string | null
          content_hash: string
          erp_customer_id?: string | null
          external_id: string
          house_number?: string | null
          is_deleted?: boolean
          name?: string | null
          postal_code?: string | null
          raw: Json
          status?: string | null
          street?: string | null
          synced_at?: string
        }
        Update: {
          city?: string | null
          content_hash?: string
          erp_customer_id?: string | null
          external_id?: string
          house_number?: string | null
          is_deleted?: boolean
          name?: string | null
          postal_code?: string | null
          raw?: Json
          status?: string | null
          street?: string | null
          synced_at?: string
        }
        Relationships: []
      }
      erp_container_types: {
        Row: {
          art: string | null
          bezeichnung: string | null
          content_hash: string
          external_id: string
          is_deleted: boolean
          preisklasse: string | null
          raw: Json
          synced_at: string
          volumen_m3: number | null
        }
        Insert: {
          art?: string | null
          bezeichnung?: string | null
          content_hash: string
          external_id: string
          is_deleted?: boolean
          preisklasse?: string | null
          raw: Json
          synced_at?: string
          volumen_m3?: number | null
        }
        Update: {
          art?: string | null
          bezeichnung?: string | null
          content_hash?: string
          external_id?: string
          is_deleted?: boolean
          preisklasse?: string | null
          raw?: Json
          synced_at?: string
          volumen_m3?: number | null
        }
        Relationships: []
      }
      erp_customers: {
        Row: {
          city: string | null
          company_name: string | null
          content_hash: string
          customer_kind: string | null
          emails: string[] | null
          external_id: string
          first_name: string | null
          is_deleted: boolean
          last_name: string | null
          postal_code: string | null
          raw: Json
          status: string | null
          synced_at: string
          vat_id: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          content_hash: string
          customer_kind?: string | null
          emails?: string[] | null
          external_id: string
          first_name?: string | null
          is_deleted?: boolean
          last_name?: string | null
          postal_code?: string | null
          raw: Json
          status?: string | null
          synced_at?: string
          vat_id?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          content_hash?: string
          customer_kind?: string | null
          emails?: string[] | null
          external_id?: string
          first_name?: string | null
          is_deleted?: boolean
          last_name?: string | null
          postal_code?: string | null
          raw?: Json
          status?: string | null
          synced_at?: string
          vat_id?: string | null
        }
        Relationships: []
      }
      erp_invoices: {
        Row: {
          content_hash: string
          erp_customer_id: string | null
          external_id: string
          invoice_date: string | null
          invoice_number: string | null
          is_deleted: boolean
          raw: Json
          status: string | null
          synced_at: string
          total_gross: number | null
        }
        Insert: {
          content_hash: string
          erp_customer_id?: string | null
          external_id: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_deleted?: boolean
          raw: Json
          status?: string | null
          synced_at?: string
          total_gross?: number | null
        }
        Update: {
          content_hash?: string
          erp_customer_id?: string | null
          external_id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_deleted?: boolean
          raw?: Json
          status?: string | null
          synced_at?: string
          total_gross?: number | null
        }
        Relationships: []
      }
      erp_transport_zones: {
        Row: {
          content_hash: string
          external_id: string
          is_deleted: boolean
          raw: Json
          synced_at: string
          ust_satz: number | null
          zone: number | null
        }
        Insert: {
          content_hash: string
          external_id: string
          is_deleted?: boolean
          raw: Json
          synced_at?: string
          ust_satz?: number | null
          zone?: number | null
        }
        Update: {
          content_hash?: string
          external_id?: string
          is_deleted?: boolean
          raw?: Json
          synced_at?: string
          ust_satz?: number | null
          zone?: number | null
        }
        Relationships: []
      }
      erp_zone_locations: {
        Row: {
          content_hash: string
          external_id: string
          is_deleted: boolean
          ort: string | null
          plz: string | null
          raw: Json
          synced_at: string
          zone: number | null
        }
        Insert: {
          content_hash: string
          external_id: string
          is_deleted?: boolean
          ort?: string | null
          plz?: string | null
          raw: Json
          synced_at?: string
          zone?: number | null
        }
        Update: {
          content_hash?: string
          external_id?: string
          is_deleted?: boolean
          ort?: string | null
          plz?: string | null
          raw?: Json
          synced_at?: string
          zone?: number | null
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
      sync_errors: {
        Row: {
          created_at: string
          entity: string
          external_id: string | null
          id: string
          message: string
          payload: Json | null
          run_id: string | null
        }
        Insert: {
          created_at?: string
          entity: string
          external_id?: string | null
          id?: string
          message: string
          payload?: Json | null
          run_id?: string | null
        }
        Update: {
          created_at?: string
          entity?: string
          external_id?: string | null
          id?: string
          message?: string
          payload?: Json | null
          run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_errors_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          deleted: number
          entity: string
          errors: number
          finished_at: string | null
          id: string
          inserted: number
          source: string
          started_at: string
          status: string
          updated: number
        }
        Insert: {
          deleted?: number
          entity: string
          errors?: number
          finished_at?: string | null
          id?: string
          inserted?: number
          source?: string
          started_at?: string
          status?: string
          updated?: number
        }
        Update: {
          deleted?: number
          entity?: string
          errors?: number
          finished_at?: string | null
          id?: string
          inserted?: number
          source?: string
          started_at?: string
          status?: string
          updated?: number
        }
        Relationships: []
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

