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
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      permits: {
        Row: {
          additional_notes: string | null
          city: string | null
          company_address: string | null
          construction_value_cents: number | null
          contractor_company: string | null
          contractor_qualifier: string | null
          county: string | null
          created_at: string
          created_by: string | null
          description: string | null
          documents: Json
          extra_docs: Json
          id: string
          intake_payload: Json | null
          job_address: string
          license_number: string | null
          municipality: string | null
          owner_entity: string | null
          owner_name: string | null
          pcn: string | null
          permit_number: string | null
          permit_type: string | null
          poc: string | null
          poc_email: string | null
          poc_phone: string | null
          project_name: string
          signer_email: string | null
          signer_phone: string | null
          status: string
          submitted_date: string | null
          subs: Json
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          city?: string | null
          company_address?: string | null
          construction_value_cents?: number | null
          contractor_company?: string | null
          contractor_qualifier?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: Json
          extra_docs?: Json
          id?: string
          intake_payload?: Json | null
          job_address: string
          license_number?: string | null
          municipality?: string | null
          owner_entity?: string | null
          owner_name?: string | null
          pcn?: string | null
          permit_number?: string | null
          permit_type?: string | null
          poc?: string | null
          poc_email?: string | null
          poc_phone?: string | null
          project_name: string
          signer_email?: string | null
          signer_phone?: string | null
          status?: string
          submitted_date?: string | null
          subs?: Json
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          city?: string | null
          company_address?: string | null
          construction_value_cents?: number | null
          contractor_company?: string | null
          contractor_qualifier?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documents?: Json
          extra_docs?: Json
          id?: string
          intake_payload?: Json | null
          job_address?: string
          license_number?: string | null
          municipality?: string | null
          owner_entity?: string | null
          owner_name?: string | null
          pcn?: string | null
          permit_number?: string | null
          permit_type?: string | null
          poc?: string | null
          poc_email?: string | null
          poc_phone?: string | null
          project_name?: string
          signer_email?: string | null
          signer_phone?: string | null
          status?: string
          submitted_date?: string | null
          subs?: Json
          updated_at?: string
        }
        Relationships: []
      }
      subcontractors: {
        Row: {
          coi_expiration: string | null
          coi_file_name: string | null
          coi_file_path: string | null
          company_address: string | null
          company_name: string
          completion_token: string
          contact_first_name: string | null
          contact_last_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          insurance_carrier_email: string | null
          insurance_carrier_name: string | null
          license_expiration: string | null
          license_file_name: string | null
          license_file_path: string | null
          license_number: string | null
          license_type: string | null
          phone: string | null
          qualifier_name: string | null
          status: string
          trade: string | null
          updated_at: string
          w9_file_name: string | null
          w9_file_path: string | null
        }
        Insert: {
          coi_expiration?: string | null
          coi_file_name?: string | null
          coi_file_path?: string | null
          company_address?: string | null
          company_name: string
          completion_token?: string
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          insurance_carrier_email?: string | null
          insurance_carrier_name?: string | null
          license_expiration?: string | null
          license_file_name?: string | null
          license_file_path?: string | null
          license_number?: string | null
          license_type?: string | null
          phone?: string | null
          qualifier_name?: string | null
          status?: string
          trade?: string | null
          updated_at?: string
          w9_file_name?: string | null
          w9_file_path?: string | null
        }
        Update: {
          coi_expiration?: string | null
          coi_file_name?: string | null
          coi_file_path?: string | null
          company_address?: string | null
          company_name?: string
          completion_token?: string
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          insurance_carrier_email?: string | null
          insurance_carrier_name?: string | null
          license_expiration?: string | null
          license_file_name?: string | null
          license_file_path?: string | null
          license_number?: string | null
          license_type?: string | null
          phone?: string | null
          qualifier_name?: string | null
          status?: string
          trade?: string | null
          updated_at?: string
          w9_file_name?: string | null
          w9_file_path?: string | null
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
