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
          approved_tenant_id: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          license_number: string | null
          name: string
          notes: string | null
          phone: string | null
          service_areas: string[]
          status: string
        }
        Insert: {
          approved_tenant_id?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          license_number?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          service_areas?: string[]
          status?: string
        }
        Update: {
          approved_tenant_id?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          license_number?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          service_areas?: string[]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_approved_tenant_id_fkey"
            columns: ["approved_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_events: {
        Row: {
          actor_id: string | null
          actor_label: string | null
          created_at: string
          details: Json
          event_type: string
          id: string
          permit_id: string | null
          summary: string | null
          tenant_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          permit_id?: string | null
          summary?: string | null
          tenant_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          permit_id?: string | null
          summary?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
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
      co_checklist_items: {
        Row: {
          complete: boolean
          completed_at: string | null
          completed_by: string | null
          completed_by_label: string | null
          created_at: string
          id: string
          item_key: string
          item_label: string
          ord: number
          permit_id: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          complete?: boolean
          completed_at?: string | null
          completed_by?: string | null
          completed_by_label?: string | null
          created_at?: string
          id?: string
          item_key: string
          item_label: string
          ord?: number
          permit_id: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          complete?: boolean
          completed_at?: string | null
          completed_by?: string | null
          completed_by_label?: string | null
          created_at?: string
          id?: string
          item_key?: string
          item_label?: string
          ord?: number
          permit_id?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_checklist_items_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      coi_records: {
        Row: {
          carrier_name: string | null
          coverage_type: string
          created_at: string | null
          document_url: string | null
          effective_date: string | null
          expiration_date: string
          id: string
          permit_id: string | null
          policy_number: string | null
          status: string
          subcontractor_id: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          carrier_name?: string | null
          coverage_type: string
          created_at?: string | null
          document_url?: string | null
          effective_date?: string | null
          expiration_date: string
          id?: string
          permit_id?: string | null
          policy_number?: string | null
          status?: string
          subcontractor_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          carrier_name?: string | null
          coverage_type?: string
          created_at?: string | null
          document_url?: string | null
          effective_date?: string | null
          expiration_date?: string
          id?: string
          permit_id?: string | null
          policy_number?: string | null
          status?: string
          subcontractor_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coi_records_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coi_records_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          company: string | null
          contact_type: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string | null
          trade: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          contact_type?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string | null
          trade?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          contact_type?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string | null
          trade?: string | null
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_professionals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_results: {
        Row: {
          assessed_value: number | null
          base_flood_elev: number | null
          fetched_at: string | null
          flood_zone: string | null
          id: string
          in_sfha: boolean | null
          latitude: number | null
          legal_description: string | null
          longitude: number | null
          owner_name: string | null
          parcel_id: string | null
          parcel_source: string | null
          permit_id: string | null
          raw_response: Json | null
          year_built: number | null
        }
        Insert: {
          assessed_value?: number | null
          base_flood_elev?: number | null
          fetched_at?: string | null
          flood_zone?: string | null
          id?: string
          in_sfha?: boolean | null
          latitude?: number | null
          legal_description?: string | null
          longitude?: number | null
          owner_name?: string | null
          parcel_id?: string | null
          parcel_source?: string | null
          permit_id?: string | null
          raw_response?: Json | null
          year_built?: number | null
        }
        Update: {
          assessed_value?: number | null
          base_flood_elev?: number | null
          fetched_at?: string | null
          flood_zone?: string | null
          id?: string
          in_sfha?: boolean | null
          latitude?: number | null
          legal_description?: string | null
          longitude?: number | null
          owner_name?: string | null
          parcel_id?: string | null
          parcel_source?: string | null
          permit_id?: string | null
          raw_response?: Json | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_results_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attachments: Json
          attempts: number
          body_html: string | null
          body_text: string
          cc_emails: string[]
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          kind: string
          last_attempt_at: string | null
          next_attempt_at: string
          provider_message_id: string | null
          related_submittal_id: string | null
          sent_at: string | null
          status: string
          subject: string
          tenant_id: string | null
          to_email: string
          to_name: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json
          attempts?: number
          body_html?: string | null
          body_text: string
          cc_emails?: string[]
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          kind: string
          last_attempt_at?: string | null
          next_attempt_at?: string
          provider_message_id?: string | null
          related_submittal_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          tenant_id?: string | null
          to_email: string
          to_name?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json
          attempts?: number
          body_html?: string | null
          body_text?: string
          cc_emails?: string[]
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          kind?: string
          last_attempt_at?: string | null
          next_attempt_at?: string
          provider_message_id?: string | null
          related_submittal_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          tenant_id?: string | null
          to_email?: string
          to_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_related_submittal_id_fkey"
            columns: ["related_submittal_id"]
            isOneToOne: false
            referencedRelation: "hoa_submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feature_request_notes: {
        Row: {
          created_at: string
          internal_note: string | null
          request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          internal_note?: string | null
          request_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          internal_note?: string | null
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_notes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_request_votes: {
        Row: {
          created_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          areas: Json
          created_at: string
          created_by: string
          description: string
          id: string
          pinned: boolean
          priority: string
          public_response: string | null
          request_type: string
          shipped_notified_at: string | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
          workflow_impact: string
        }
        Insert: {
          areas?: Json
          created_at?: string
          created_by: string
          description: string
          id?: string
          pinned?: boolean
          priority: string
          public_response?: string | null
          request_type: string
          shipped_notified_at?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
          workflow_impact: string
        }
        Update: {
          areas?: Json
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          pinned?: boolean
          priority?: string
          public_response?: string | null
          request_type?: string
          shipped_notified_at?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
          workflow_impact?: string
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          umbrella_cents?: number
          updated_at?: string
          wc_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "gc_coi_minimums_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gc_company_profiles: {
        Row: {
          bond: Json | null
          created_at: string
          dba: string
          entity_type: string
          general_liability: Json
          id: string
          legal_name: string
          primary_qualifier: Json
          secondary_qualifier: Json | null
          tenant_id: string
          updated_at: string
          workers_comp: Json
        }
        Insert: {
          bond?: Json | null
          created_at?: string
          dba?: string
          entity_type?: string
          general_liability?: Json
          id?: string
          legal_name?: string
          primary_qualifier?: Json
          secondary_qualifier?: Json | null
          tenant_id: string
          updated_at?: string
          workers_comp?: Json
        }
        Update: {
          bond?: Json | null
          created_at?: string
          dba?: string
          entity_type?: string
          general_liability?: Json
          id?: string
          legal_name?: string
          primary_qualifier?: Json
          secondary_qualifier?: Json | null
          tenant_id?: string
          updated_at?: string
          workers_comp?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gc_company_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gc_email_addresses: {
        Row: {
          alias: string
          created_at: string | null
          full_email: string | null
          id: string
          tenant_id: string | null
        }
        Insert: {
          alias: string
          created_at?: string | null
          full_email?: string | null
          id?: string
          tenant_id?: string | null
        }
        Update: {
          alias?: string
          created_at?: string | null
          full_email?: string | null
          id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gc_email_addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gc_portal_logins: {
        Row: {
          city_name: string
          created_at: string
          derm: boolean
          e_plan: boolean
          id: string
          municipality_slug: string
          notes: string | null
          password_ciphertext: string
          portal_url: string | null
          registration: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
          username_ciphertext: string
        }
        Insert: {
          city_name: string
          created_at?: string
          derm?: boolean
          e_plan?: boolean
          id?: string
          municipality_slug: string
          notes?: string | null
          password_ciphertext: string
          portal_url?: string | null
          registration?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
          username_ciphertext: string
        }
        Update: {
          city_name?: string
          created_at?: string
          derm?: boolean
          e_plan?: boolean
          id?: string
          municipality_slug?: string
          notes?: string | null
          password_ciphertext?: string
          portal_url?: string | null
          registration?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
          username_ciphertext?: string
        }
        Relationships: [
          {
            foreignKeyName: "gc_portal_logins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hoa_submittal_events: {
        Row: {
          actor_id: string | null
          actor_label: string | null
          created_at: string
          details: Json
          id: string
          kind: string
          submittal_id: string
          summary: string
          tenant_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind: string
          submittal_id: string
          summary: string
          tenant_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          submittal_id?: string
          summary?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hoa_submittal_events_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "hoa_submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      hoa_submittal_replies: {
        Row: {
          body_html: string | null
          body_text: string | null
          created_at: string
          direction: string
          from_email: string | null
          from_name: string | null
          id: string
          logged_by: string | null
          provider_message_id: string | null
          received_at: string
          subject: string | null
          submittal_id: string
          tenant_id: string | null
          to_email: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          direction?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          logged_by?: string | null
          provider_message_id?: string | null
          received_at?: string
          subject?: string | null
          submittal_id: string
          tenant_id?: string | null
          to_email?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          direction?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          logged_by?: string | null
          provider_message_id?: string | null
          received_at?: string
          subject?: string | null
          submittal_id?: string
          tenant_id?: string | null
          to_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hoa_submittal_replies_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "hoa_submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      hoa_submittals: {
        Row: {
          applicant_email: string | null
          applicant_name: string | null
          applicant_phone: string | null
          block: string | null
          checklist: Json
          coi_attached: boolean
          community_name: string | null
          contractor_license: string | null
          contractor_name: string | null
          created_at: string
          created_by: string | null
          deposit_amount_cents: number
          deposit_confirmation: string | null
          deposit_paid_date: string | null
          deposit_status: string
          documents: Json
          estimated_start_date: string | null
          extracted_fields: Json
          generated_pdf_path: string | null
          hoa_name: string | null
          homeowner_email: string | null
          homeowner_name: string | null
          homeowner_notified_at: string | null
          id: string
          lot: string | null
          missing_fields: Json
          model_type: string | null
          notes: string | null
          permit_id: string | null
          plans_attached: boolean
          plat_name: string | null
          project_description: string | null
          project_type: string | null
          property_address: string | null
          removal_agreement_path: string | null
          removal_agreement_signed: boolean
          scope_of_work: string | null
          sent_to_hoa_at: string | null
          source: string
          status: string
          submitted_at: string | null
          template_id: string | null
          tenant_id: string | null
          updated_at: string
          uploaded_form_path: string | null
          village_name: string | null
        }
        Insert: {
          applicant_email?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          block?: string | null
          checklist?: Json
          coi_attached?: boolean
          community_name?: string | null
          contractor_license?: string | null
          contractor_name?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount_cents?: number
          deposit_confirmation?: string | null
          deposit_paid_date?: string | null
          deposit_status?: string
          documents?: Json
          estimated_start_date?: string | null
          extracted_fields?: Json
          generated_pdf_path?: string | null
          hoa_name?: string | null
          homeowner_email?: string | null
          homeowner_name?: string | null
          homeowner_notified_at?: string | null
          id?: string
          lot?: string | null
          missing_fields?: Json
          model_type?: string | null
          notes?: string | null
          permit_id?: string | null
          plans_attached?: boolean
          plat_name?: string | null
          project_description?: string | null
          project_type?: string | null
          property_address?: string | null
          removal_agreement_path?: string | null
          removal_agreement_signed?: boolean
          scope_of_work?: string | null
          sent_to_hoa_at?: string | null
          source?: string
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_form_path?: string | null
          village_name?: string | null
        }
        Update: {
          applicant_email?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          block?: string | null
          checklist?: Json
          coi_attached?: boolean
          community_name?: string | null
          contractor_license?: string | null
          contractor_name?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount_cents?: number
          deposit_confirmation?: string | null
          deposit_paid_date?: string | null
          deposit_status?: string
          documents?: Json
          estimated_start_date?: string | null
          extracted_fields?: Json
          generated_pdf_path?: string | null
          hoa_name?: string | null
          homeowner_email?: string | null
          homeowner_name?: string | null
          homeowner_notified_at?: string | null
          id?: string
          lot?: string | null
          missing_fields?: Json
          model_type?: string | null
          notes?: string | null
          permit_id?: string | null
          plans_attached?: boolean
          plat_name?: string | null
          project_description?: string | null
          project_type?: string | null
          property_address?: string | null
          removal_agreement_path?: string | null
          removal_agreement_signed?: boolean
          scope_of_work?: string | null
          sent_to_hoa_at?: string | null
          source?: string
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_form_path?: string | null
          village_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hoa_submittals_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_submittals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "hoa_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_submittals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "hoa_templates_shared"
            referencedColumns: ["id"]
          },
        ]
      }
      hoa_template_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          created_at: string
          id: string
          snapshot: Json
          template_id: string
          version: number
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot: Json
          template_id: string
          version: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          snapshot?: Json
          template_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "hoa_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "hoa_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hoa_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "hoa_templates_shared"
            referencedColumns: ["id"]
          },
        ]
      }
      hoa_templates: {
        Row: {
          arc_meeting_notes: string | null
          city: string
          community_name: string
          created_at: string
          created_by: string | null
          created_by_tenant_id: string | null
          current_version: number
          current_version_at: string
          deposit_amount_cents: number
          deposit_type: string | null
          form_template: Json
          hoa_contact_email: string | null
          hoa_contact_name: string | null
          hoa_contact_phone: string | null
          id: string
          last_used_at: string | null
          required_documents: Json
          submission_method: string | null
          submission_portal_url: string | null
          updated_at: string
          uploaded_form_path: string | null
          usage_count: number
        }
        Insert: {
          arc_meeting_notes?: string | null
          city: string
          community_name: string
          created_at?: string
          created_by?: string | null
          created_by_tenant_id?: string | null
          current_version?: number
          current_version_at?: string
          deposit_amount_cents?: number
          deposit_type?: string | null
          form_template?: Json
          hoa_contact_email?: string | null
          hoa_contact_name?: string | null
          hoa_contact_phone?: string | null
          id?: string
          last_used_at?: string | null
          required_documents?: Json
          submission_method?: string | null
          submission_portal_url?: string | null
          updated_at?: string
          uploaded_form_path?: string | null
          usage_count?: number
        }
        Update: {
          arc_meeting_notes?: string | null
          city?: string
          community_name?: string
          created_at?: string
          created_by?: string | null
          created_by_tenant_id?: string | null
          current_version?: number
          current_version_at?: string
          deposit_amount_cents?: number
          deposit_type?: string | null
          form_template?: Json
          hoa_contact_email?: string | null
          hoa_contact_name?: string | null
          hoa_contact_phone?: string | null
          id?: string
          last_used_at?: string | null
          required_documents?: Json
          submission_method?: string | null
          submission_portal_url?: string | null
          updated_at?: string
          uploaded_form_path?: string | null
          usage_count?: number
        }
        Relationships: []
      }
      inbound_email_errors: {
        Row: {
          alias: string | null
          created_at: string | null
          from_email: string | null
          id: string
          reason: string | null
          subject: string | null
          to_email: string | null
        }
        Insert: {
          alias?: string | null
          created_at?: string | null
          from_email?: string | null
          id?: string
          reason?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Update: {
          alias?: string | null
          created_at?: string | null
          from_email?: string | null
          id?: string
          reason?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Relationships: []
      }
      insurance_requests: {
        Row: {
          additional_insured: boolean
          attached_file_name: string | null
          attached_file_path: string | null
          created_at: string
          created_by: string | null
          details: string | null
          holder_address: string | null
          holder_name: string | null
          id: string
          permit_id: string | null
          project_address: string | null
          project_name: string | null
          request_type: string
          status: string
          subcontractor_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          additional_insured?: boolean
          attached_file_name?: string | null
          attached_file_path?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          holder_address?: string | null
          holder_name?: string | null
          id?: string
          permit_id?: string | null
          project_address?: string | null
          project_name?: string | null
          request_type: string
          status?: string
          subcontractor_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          additional_insured?: boolean
          attached_file_name?: string | null
          attached_file_path?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          holder_address?: string | null
          holder_name?: string | null
          id?: string
          permit_id?: string | null
          project_address?: string | null
          project_name?: string | null
          request_type?: string
          status?: string
          subcontractor_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_requests_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_requests_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_document_versions: {
        Row: {
          change_notes: string | null
          created_at: string
          created_by: string | null
          file_name: string | null
          file_path: string
          id: string
          legal_document_id: string
          version_label: string
        }
        Insert: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          legal_document_id: string
          version_label: string
        }
        Update: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          legal_document_id?: string
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_document_versions_legal_document_id_fkey"
            columns: ["legal_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          created_at: string
          current_version: string
          gc_name: string | null
          id: string
          name: string
          notes: string | null
          signed_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_version?: string
          gc_name?: string | null
          id?: string
          name: string
          notes?: string | null
          signed_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_version?: string
          gc_name?: string | null
          id?: string
          name?: string
          notes?: string | null
          signed_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lien_notices: {
        Row: {
          contractor_name: string | null
          created_at: string | null
          created_by: string | null
          deadline_date: string | null
          document_url: string | null
          filed_date: string | null
          id: string
          notes: string | null
          notice_type: string
          permit_id: string | null
          project_address: string | null
          property_owner: string | null
          scope_of_work: string | null
          status: string
        }
        Insert: {
          contractor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          document_url?: string | null
          filed_date?: string | null
          id?: string
          notes?: string | null
          notice_type: string
          permit_id?: string | null
          project_address?: string | null
          property_owner?: string | null
          scope_of_work?: string | null
          status?: string
        }
        Update: {
          contractor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          document_url?: string | null
          filed_date?: string | null
          id?: string
          notes?: string | null
          notice_type?: string
          permit_id?: string | null
          project_address?: string | null
          property_owner?: string | null
          scope_of_work?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lien_notices_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      lien_releases: {
        Row: {
          created_at: string
          created_by: string | null
          filed_at: string | null
          id: string
          last_reminder_at: string | null
          notarized_at: string | null
          notes: string | null
          permit_id: string
          requested_at: string | null
          signed_at: string | null
          signwell_id: string | null
          status: string
          sub_company: string
          sub_email: string | null
          sub_key: string
          tenant_id: string | null
          trade: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filed_at?: string | null
          id?: string
          last_reminder_at?: string | null
          notarized_at?: string | null
          notes?: string | null
          permit_id: string
          requested_at?: string | null
          signed_at?: string | null
          signwell_id?: string | null
          status?: string
          sub_company: string
          sub_email?: string | null
          sub_key: string
          tenant_id?: string | null
          trade?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filed_at?: string | null
          id?: string
          last_reminder_at?: string | null
          notarized_at?: string | null
          notes?: string | null
          permit_id?: string
          requested_at?: string | null
          signed_at?: string | null
          signwell_id?: string | null
          status?: string
          sub_company?: string
          sub_email?: string | null
          sub_key?: string
          tenant_id?: string | null
          trade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lien_releases_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      message_posts: {
        Row: {
          author_email: string | null
          author_id: string | null
          author_label: string | null
          body: string
          created_at: string
          from_admin: boolean
          id: string
          tenant_id: string | null
          thread_id: string
        }
        Insert: {
          author_email?: string | null
          author_id?: string | null
          author_label?: string | null
          body: string
          created_at?: string
          from_admin?: boolean
          id?: string
          tenant_id?: string | null
          thread_id: string
        }
        Update: {
          author_email?: string | null
          author_id?: string | null
          author_label?: string | null
          body?: string
          created_at?: string
          from_admin?: boolean
          id?: string
          tenant_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          admin_unread: number
          client_unread: number
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          last_message_at: string
          last_message_from: string
          permit_id: string | null
          status: string
          subject: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          admin_unread?: number
          client_unread?: number
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          last_message_at?: string
          last_message_from?: string
          permit_id?: string | null
          status?: string
          subject: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_unread?: number
          client_unread?: number
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          last_message_at?: string
          last_message_from?: string
          permit_id?: string | null
          status?: string
          subject?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      notary_requests: {
        Row: {
          completed_at: string | null
          confirmation_number: string | null
          created_at: string
          created_by: string | null
          doc_id: string | null
          document_name: string
          failure_reason: string | null
          id: string
          notarized_filename: string | null
          notes: string | null
          permit_id: string
          provider: string | null
          session_at: string | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          confirmation_number?: string | null
          created_at?: string
          created_by?: string | null
          doc_id?: string | null
          document_name: string
          failure_reason?: string | null
          id?: string
          notarized_filename?: string | null
          notes?: string | null
          permit_id: string
          provider?: string | null
          session_at?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          confirmation_number?: string | null
          created_at?: string
          created_by?: string | null
          doc_id?: string | null
          document_name?: string
          failure_reason?: string | null
          id?: string
          notarized_filename?: string | null
          notes?: string | null
          permit_id?: string
          provider?: string | null
          session_at?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notary_requests_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notary_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          updated_at?: string
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nto_filings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_inspections: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inspection_type: string
          inspector_name: string | null
          notes: string | null
          permit_id: string
          preferred_time: string | null
          requested_date: string | null
          result: string | null
          scheduled_date: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inspection_type: string
          inspector_name?: string | null
          notes?: string | null
          permit_id: string
          preferred_time?: string | null
          requested_date?: string | null
          result?: string | null
          scheduled_date?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inspection_type?: string
          inspector_name?: string | null
          notes?: string | null
          permit_id?: string
          preferred_time?: string | null
          requested_date?: string | null
          result?: string | null
          scheduled_date?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_inspections_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_resubmittals: {
        Row: {
          correction_notes: string | null
          created_at: string
          created_by: string | null
          document_paths: Json
          id: string
          permit_id: string
          resubmitted_at: string
          tenant_id: string | null
          version: number
        }
        Insert: {
          correction_notes?: string | null
          created_at?: string
          created_by?: string | null
          document_paths?: Json
          id?: string
          permit_id: string
          resubmitted_at?: string
          tenant_id?: string | null
          version?: number
        }
        Update: {
          correction_notes?: string | null
          created_at?: string
          created_by?: string | null
          document_paths?: Json
          id?: string
          permit_id?: string
          resubmitted_at?: string
          tenant_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "permit_resubmittals_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_updates: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          created_by: string | null
          created_by_label: string | null
          id: string
          message: string
          permit_id: string
          tenant_id: string | null
          visible_to_client: boolean
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_label?: string | null
          id?: string
          message: string
          permit_id: string
          tenant_id?: string | null
          visible_to_client?: boolean
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_label?: string | null
          id?: string
          message?: string
          permit_id?: string
          tenant_id?: string | null
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "permit_updates_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permits: {
        Row: {
          actual_fee_cents: number | null
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
          estimated_fee_cents: number | null
          expiration_date: string | null
          extension_requested_at: string | null
          extra_docs: Json
          fee_paid_date: string | null
          fee_payment_method: string | null
          homeowner_share_token: string | null
          id: string
          intake_payload: Json | null
          issued_date: string | null
          job_address: string
          last_followup_at: string | null
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
          submission_source: string | null
          submitted_date: string | null
          subs: Json
          tenant_id: string | null
          total_project_value_cents: number | null
          updated_at: string
        }
        Insert: {
          actual_fee_cents?: number | null
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
          estimated_fee_cents?: number | null
          expiration_date?: string | null
          extension_requested_at?: string | null
          extra_docs?: Json
          fee_paid_date?: string | null
          fee_payment_method?: string | null
          homeowner_share_token?: string | null
          id?: string
          intake_payload?: Json | null
          issued_date?: string | null
          job_address: string
          last_followup_at?: string | null
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
          submission_source?: string | null
          submitted_date?: string | null
          subs?: Json
          tenant_id?: string | null
          total_project_value_cents?: number | null
          updated_at?: string
        }
        Update: {
          actual_fee_cents?: number | null
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
          estimated_fee_cents?: number | null
          expiration_date?: string | null
          extension_requested_at?: string | null
          extra_docs?: Json
          fee_paid_date?: string | null
          fee_payment_method?: string | null
          homeowner_share_token?: string | null
          id?: string
          intake_payload?: Json | null
          issued_date?: string | null
          job_address?: string
          last_followup_at?: string | null
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
          submission_source?: string | null
          submitted_date?: string | null
          subs?: Json
          tenant_id?: string | null
          total_project_value_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_login_documents: {
        Row: {
          created_at: string
          doc_label: string
          expiration_date: string | null
          file_name: string | null
          file_path: string
          id: string
          municipality: string
          municipality_slug: string
          tenant_id: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_label: string
          expiration_date?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          municipality: string
          municipality_slug: string
          tenant_id?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_label?: string
          expiration_date?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          municipality?: string
          municipality_slug?: string
          tenant_id?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_login_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          total_cents?: number
          trades?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prior_permits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          id_document_type: string | null
          id_document_url: string | null
          job_title: string | null
          language: string
          notification_emails: string[]
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          id_document_type?: string | null
          id_document_url?: string | null
          job_title?: string | null
          language?: string
          notification_emails?: string[]
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          job_title?: string | null
          language?: string
          notification_emails?: string[]
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      service_fee_invoices: {
        Row: {
          created_at: string | null
          environment: string
          fee_cents: number
          id: string
          paid_at: string | null
          permit_id: string
          processing_fee_cents: number
          project_value_cents: number
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          environment?: string
          fee_cents: number
          id?: string
          paid_at?: string | null
          permit_id: string
          processing_fee_cents?: number
          project_value_cents: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          environment?: string
          fee_cents?: number
          id?: string
          paid_at?: string | null
          permit_id?: string
          processing_fee_cents?: number
          project_value_cents?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_fee_invoices_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_fee_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_accounts: {
        Row: {
          created_at: string
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          user_id?: string
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
          id_document_type: string | null
          id_document_url: string | null
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
          tenant_id: string | null
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
          id_document_type?: string | null
          id_document_url?: string | null
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
          tenant_id?: string | null
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
          id_document_type?: string | null
          id_document_url?: string | null
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
          tenant_id?: string | null
          trade?: string | null
          updated_at?: string
          w9_extracted?: Json | null
          w9_file_name?: string | null
          w9_file_path?: string | null
          w9_flags?: Json | null
          w9_status?: string | null
          w9_verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_corrections: {
        Row: {
          code_section: string | null
          correction_text: string
          created_at: string
          document_type_flagged: string | null
          first_seen_at: string
          id: string
          intelligence_id: string | null
          last_seen_at: string
          logged_by: string | null
          municipality_name: string | null
          municipality_slug: string | null
          occurrences: number
          reason_category: string | null
          resolution_notes: string | null
          source: string
          tenant_id: string | null
          trade: string | null
          updated_at: string
        }
        Insert: {
          code_section?: string | null
          correction_text: string
          created_at?: string
          document_type_flagged?: string | null
          first_seen_at?: string
          id?: string
          intelligence_id?: string | null
          last_seen_at?: string
          logged_by?: string | null
          municipality_name?: string | null
          municipality_slug?: string | null
          occurrences?: number
          reason_category?: string | null
          resolution_notes?: string | null
          source?: string
          tenant_id?: string | null
          trade?: string | null
          updated_at?: string
        }
        Update: {
          code_section?: string | null
          correction_text?: string
          created_at?: string
          document_type_flagged?: string | null
          first_seen_at?: string
          id?: string
          intelligence_id?: string | null
          last_seen_at?: string
          logged_by?: string | null
          municipality_name?: string | null
          municipality_slug?: string | null
          occurrences?: number
          reason_category?: string | null
          resolution_notes?: string | null
          source?: string
          tenant_id?: string | null
          trade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittal_corrections_intelligence_id_fkey"
            columns: ["intelligence_id"]
            isOneToOne: false
            referencedRelation: "submittal_intelligence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_corrections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_intelligence: {
        Row: {
          created_at: string
          created_by: string | null
          days_to_first_response: number | null
          days_to_resolution: number | null
          final_outcome: string | null
          first_response_at: string | null
          hoa_community: string | null
          hoa_submittal_id: string | null
          homeowner_name: string | null
          id: string
          jurisdiction: string | null
          municipality_name: string | null
          municipality_slug: string | null
          notes: string | null
          permit_fee_cents: number | null
          permit_id: string | null
          resolved_at: string | null
          scope_of_work: string | null
          source: string
          submitted_at: string | null
          tenant_id: string | null
          trades: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          days_to_first_response?: number | null
          days_to_resolution?: number | null
          final_outcome?: string | null
          first_response_at?: string | null
          hoa_community?: string | null
          hoa_submittal_id?: string | null
          homeowner_name?: string | null
          id?: string
          jurisdiction?: string | null
          municipality_name?: string | null
          municipality_slug?: string | null
          notes?: string | null
          permit_fee_cents?: number | null
          permit_id?: string | null
          resolved_at?: string | null
          scope_of_work?: string | null
          source: string
          submitted_at?: string | null
          tenant_id?: string | null
          trades?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          days_to_first_response?: number | null
          days_to_resolution?: number | null
          final_outcome?: string | null
          first_response_at?: string | null
          hoa_community?: string | null
          hoa_submittal_id?: string | null
          homeowner_name?: string | null
          id?: string
          jurisdiction?: string | null
          municipality_name?: string | null
          municipality_slug?: string | null
          notes?: string | null
          permit_fee_cents?: number | null
          permit_id?: string | null
          resolved_at?: string | null
          scope_of_work?: string | null
          source?: string
          submitted_at?: string | null
          tenant_id?: string | null
          trades?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittal_intelligence_hoa_submittal_id_fkey"
            columns: ["hoa_submittal_id"]
            isOneToOne: false
            referencedRelation: "hoa_submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_intelligence_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_intelligence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tenant_invites: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          revoked_at: string | null
          tenant_id: string
          token: string
          uses: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          revoked_at?: string | null
          tenant_id: string
          token?: string
          uses?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          revoked_at?: string | null
          tenant_id?: string
          token?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          allowed_domain: string | null
          created_at: string
          id: string
          license_number: string | null
          name: string
          primary_coi_path: string | null
          primary_license_path: string | null
          service_areas: string[]
          status: string
          updated_at: string
        }
        Insert: {
          allowed_domain?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          name: string
          primary_coi_path?: string | null
          primary_license_path?: string | null
          service_areas?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          allowed_domain?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          name?: string
          primary_coi_path?: string | null
          primary_license_path?: string | null
          service_areas?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          created_at: string
          id: string
          label: string
          path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          path?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      utility_locates: {
        Row: {
          created_at: string | null
          created_by: string | null
          dig_area_description: string | null
          excavation_date: string
          excavation_type: string | null
          expiration_date: string | null
          id: string
          notes: string | null
          permit_id: string | null
          request_date: string
          site_contact_name: string | null
          site_contact_phone: string | null
          status: string
          ticket_number: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dig_area_description?: string | null
          excavation_date: string
          excavation_type?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          permit_id?: string | null
          request_date?: string
          site_contact_name?: string | null
          site_contact_phone?: string | null
          status?: string
          ticket_number?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dig_area_description?: string | null
          excavation_date?: string
          excavation_type?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          permit_id?: string | null
          request_date?: string
          site_contact_name?: string | null
          site_contact_phone?: string | null
          status?: string
          ticket_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utility_locates_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      victoria_alerts: {
        Row: {
          acknowledged_at: string | null
          action_url: string | null
          body: string | null
          created_at: string
          dedupe_key: string | null
          id: string
          kind: string
          permit_id: string | null
          severity: string
          tenant_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          action_url?: string | null
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind: string
          permit_id?: string | null
          severity?: string
          tenant_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          action_url?: string | null
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind?: string
          permit_id?: string | null
          severity?: string
          tenant_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "victoria_alerts_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      hoa_templates_shared: {
        Row: {
          arc_meeting_notes: string | null
          city: string | null
          community_name: string | null
          created_at: string | null
          created_by_tenant_id: string | null
          current_version: number | null
          current_version_at: string | null
          deposit_amount_cents: number | null
          deposit_type: string | null
          form_template: Json | null
          has_contact_email: boolean | null
          id: string | null
          last_used_at: string | null
          required_documents: Json | null
          submission_method: string | null
          submission_portal_url: string | null
          updated_at: string | null
          uploaded_form_path: string | null
          usage_count: number | null
        }
        Insert: {
          arc_meeting_notes?: string | null
          city?: string | null
          community_name?: string | null
          created_at?: string | null
          created_by_tenant_id?: string | null
          current_version?: number | null
          current_version_at?: string | null
          deposit_amount_cents?: number | null
          deposit_type?: string | null
          form_template?: Json | null
          has_contact_email?: never
          id?: string | null
          last_used_at?: string | null
          required_documents?: Json | null
          submission_method?: string | null
          submission_portal_url?: string | null
          updated_at?: string | null
          uploaded_form_path?: string | null
          usage_count?: number | null
        }
        Update: {
          arc_meeting_notes?: string | null
          city?: string | null
          community_name?: string | null
          created_at?: string | null
          created_by_tenant_id?: string | null
          current_version?: number | null
          current_version_at?: string | null
          deposit_amount_cents?: number | null
          deposit_type?: string | null
          form_template?: Json | null
          has_contact_email?: never
          id?: string | null
          last_used_at?: string | null
          required_documents?: Json | null
          submission_method?: string | null
          submission_portal_url?: string | null
          updated_at?: string | null
          uploaded_form_path?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_lien_deadlines: { Args: never; Returns: undefined }
      consume_invite_token: { Args: { _token: string }; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      current_user_email: { Args: never; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      expire_utility_locates: { Args: never; Returns: undefined }
      get_homeowner_permit: {
        Args: { _token: string }
        Returns: {
          city: string
          expiration_date: string
          id: string
          issued_date: string
          job_address: string
          municipality: string
          permit_type: string
          project_name: string
          status: string
          submitted_date: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      intel_common_corrections: {
        Args: { _limit?: number; _slug: string; _trade?: string }
        Returns: {
          code_section: string
          correction_text: string
          document_type_flagged: string
          id: string
          last_seen_at: string
          occurrences: number
          trade: string
        }[]
      }
      intel_municipality_stats: {
        Args: { _slug: string }
        Returns: {
          approval_rate: number
          avg_days_to_resolution: number
          avg_days_to_response: number
          avg_permit_fee_cents: number
          sample_size: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      permit_in_current_tenant: {
        Args: { _permit_id: string }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      sub_can_see_permit: { Args: { _permit_id: string }; Returns: boolean }
      update_coi_status: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "gc_owner" | "gc_member" | "subcontractor"
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
      app_role: ["admin", "gc_owner", "gc_member", "subcontractor"],
    },
  },
} as const
