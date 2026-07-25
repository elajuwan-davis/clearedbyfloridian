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
      access_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          license_number: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          license_number?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          license_number?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
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
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          category: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      design_professionals: {
        Row: {
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          firm_name: string
          id: string
          license_number: string | null
          notes: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          firm_name: string
          id?: string
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          firm_name?: string
          id?: string
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      gc_coi_minimums: {
        Row: {
          created_at: string
          gc_name: string
          gl_aggregate_cents: number
          gl_per_occurrence_cents: number
          id: string
          owner_id: string | null
          umbrella_cents: number
          updated_at: string
          wc_required: boolean
        }
        Insert: {
          created_at?: string
          gc_name?: string
          gl_aggregate_cents?: number
          gl_per_occurrence_cents?: number
          id?: string
          owner_id?: string | null
          umbrella_cents?: number
          updated_at?: string
          wc_required?: boolean
        }
        Update: {
          created_at?: string
          gc_name?: string
          gl_aggregate_cents?: number
          gl_per_occurrence_cents?: number
          id?: string
          owner_id?: string | null
          umbrella_cents?: number
          updated_at?: string
          wc_required?: boolean
        }
        Relationships: []
      }
      gc_portal_logins: {
        Row: {
          city_name: string
          created_at: string
          id: string
          municipality_slug: string
          notes: string | null
          password_ciphertext: string
          updated_at: string
          user_id: string
          username_ciphertext: string
        }
        Insert: {
          city_name: string
          created_at?: string
          id?: string
          municipality_slug: string
          notes?: string | null
          password_ciphertext: string
          updated_at?: string
          user_id: string
          username_ciphertext: string
        }
        Update: {
          city_name?: string
          created_at?: string
          id?: string
          municipality_slug?: string
          notes?: string | null
          password_ciphertext?: string
          updated_at?: string
          user_id?: string
          username_ciphertext?: string
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          created_at: string
          email_action_required: boolean
          email_inspection_failed: boolean
          email_inspection_passed: boolean
          email_permit_issued: boolean
          email_submission_received: boolean
          phone_number: string | null
          sms_action_required: boolean
          sms_inspection_failed: boolean
          sms_inspection_passed: boolean
          sms_permit_issued: boolean
          sms_submission_received: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_action_required?: boolean
          email_inspection_failed?: boolean
          email_inspection_passed?: boolean
          email_permit_issued?: boolean
          email_submission_received?: boolean
          phone_number?: string | null
          sms_action_required?: boolean
          sms_inspection_failed?: boolean
          sms_inspection_passed?: boolean
          sms_permit_issued?: boolean
          sms_submission_received?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_action_required?: boolean
          email_inspection_failed?: boolean
          email_inspection_passed?: boolean
          email_permit_issued?: boolean
          email_submission_received?: boolean
          phone_number?: string | null
          sms_action_required?: boolean
          sms_inspection_failed?: boolean
          sms_inspection_passed?: boolean
          sms_permit_issued?: boolean
          sms_submission_received?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          permit_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          permit_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          permit_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      nto_filings: {
        Row: {
          contractor_address: string
          contractor_name: string
          created_at: string
          created_by: string | null
          first_work_date: string | null
          id: string
          owner_address: string | null
          owner_email: string | null
          owner_name: string | null
          pdf_path: string | null
          permit_id: string
          property_address: string | null
          sent_at: string | null
          sent_via: string | null
          status: string
          updated_at: string
          work_description: string | null
        }
        Insert: {
          contractor_address?: string
          contractor_name?: string
          created_at?: string
          created_by?: string | null
          first_work_date?: string | null
          id?: string
          owner_address?: string | null
          owner_email?: string | null
          owner_name?: string | null
          pdf_path?: string | null
          permit_id: string
          property_address?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          updated_at?: string
          work_description?: string | null
        }
        Update: {
          contractor_address?: string
          contractor_name?: string
          created_at?: string
          created_by?: string | null
          first_work_date?: string | null
          id?: string
          owner_address?: string | null
          owner_email?: string | null
          owner_name?: string | null
          pdf_path?: string | null
          permit_id?: string
          property_address?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          updated_at?: string
          work_description?: string | null
        }
        Relationships: []
      }
      permits: {
        Row: {
          additional_notes: string | null
          city: string | null
          cleared_fee_cents: number
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
          cleared_fee_cents?: number
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
          cleared_fee_cents?: number
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
      prior_permits: {
        Row: {
          created_at: string
          created_by: string | null
          date_pulled: string | null
          id: string
          notes: string | null
          permit_number: string | null
          project_label: string
          total_cents: number
          trades: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_pulled?: string | null
          id?: string
          notes?: string | null
          permit_number?: string | null
          project_label: string
          total_cents?: number
          trades?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_pulled?: string | null
          id?: string
          notes?: string | null
          permit_number?: string | null
          project_label?: string
          total_cents?: number
          trades?: Json
          updated_at?: string
        }
        Relationships: []
      }
      subcontractors: {
        Row: {
          coi_expiration: string | null
          coi_extracted: Json | null
          coi_file_name: string | null
          coi_file_path: string | null
          coi_flags: Json | null
          coi_status: string | null
          coi_verified_at: string | null
          company_address: string | null
          company_name: string
          completion_token: string
          contact_first_name: string | null
          contact_last_name: string | null
          created_at: string
          created_by: string | null
          dbpr_expiration: string | null
          dbpr_holder_name: string | null
          dbpr_license_type: string | null
          dbpr_status: string | null
          dbpr_verified_at: string | null
          email: string | null
          id: string
          insurance_carrier_email: string | null
          insurance_carrier_name: string | null
          license_expiration: string | null
          license_file_name: string | null
          license_file_path: string | null
          license_number: string | null
          license_status: string | null
          license_type: string | null
          phone: string | null
          qualifier_name: string | null
          status: string
          trade: string | null
          updated_at: string
          w9_extracted: Json | null
          w9_file_name: string | null
          w9_file_path: string | null
          w9_flags: Json | null
          w9_status: string | null
          w9_verified_at: string | null
        }
        Insert: {
          coi_expiration?: string | null
          coi_extracted?: Json | null
          coi_file_name?: string | null
          coi_file_path?: string | null
          coi_flags?: Json | null
          coi_status?: string | null
          coi_verified_at?: string | null
          company_address?: string | null
          company_name: string
          completion_token?: string
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          created_by?: string | null
          dbpr_expiration?: string | null
          dbpr_holder_name?: string | null
          dbpr_license_type?: string | null
          dbpr_status?: string | null
          dbpr_verified_at?: string | null
          email?: string | null
          id?: string
          insurance_carrier_email?: string | null
          insurance_carrier_name?: string | null
          license_expiration?: string | null
          license_file_name?: string | null
          license_file_path?: string | null
          license_number?: string | null
          license_status?: string | null
          license_type?: string | null
          phone?: string | null
          qualifier_name?: string | null
          status?: string
          trade?: string | null
          updated_at?: string
          w9_extracted?: Json | null
          w9_file_name?: string | null
          w9_file_path?: string | null
          w9_flags?: Json | null
          w9_status?: string | null
          w9_verified_at?: string | null
        }
        Update: {
          coi_expiration?: string | null
          coi_extracted?: Json | null
          coi_file_name?: string | null
          coi_file_path?: string | null
          coi_flags?: Json | null
          coi_status?: string | null
          coi_verified_at?: string | null
          company_address?: string | null
          company_name?: string
          completion_token?: string
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          created_by?: string | null
          dbpr_expiration?: string | null
          dbpr_holder_name?: string | null
          dbpr_license_type?: string | null
          dbpr_status?: string | null
          dbpr_verified_at?: string | null
          email?: string | null
          id?: string
          insurance_carrier_email?: string | null
          insurance_carrier_name?: string | null
          license_expiration?: string | null
          license_file_name?: string | null
          license_file_path?: string | null
          license_number?: string | null
          license_status?: string | null
          license_type?: string | null
          phone?: string | null
          qualifier_name?: string | null
          status?: string
          trade?: string | null
          updated_at?: string
          w9_extracted?: Json | null
          w9_file_name?: string | null
          w9_file_path?: string | null
          w9_flags?: Json | null
          w9_status?: string | null
          w9_verified_at?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          fee_cents: number
          id: string
          notes: string | null
          package_manifest: Json
          permit_id: string
          status: string
          submitted_by: string | null
          trades_included: Json
          trades_pending: Json
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_cents?: number
          id?: string
          notes?: string | null
          package_manifest?: Json
          permit_id: string
          status?: string
          submitted_by?: string | null
          trades_included?: Json
          trades_pending?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_cents?: number
          id?: string
          notes?: string | null
          package_manifest?: Json
          permit_id?: string
          status?: string
          submitted_by?: string | null
          trades_included?: Json
          trades_pending?: Json
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
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
