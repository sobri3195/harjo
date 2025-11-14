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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      alert_broadcasts: {
        Row: {
          broadcast_type: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          message: string
          priority: string
          target_audience: string
          title: string
        }
        Insert: {
          broadcast_type: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          message: string
          priority: string
          target_audience: string
          title: string
        }
        Update: {
          broadcast_type?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string
          target_audience?: string
          title?: string
        }
        Relationships: []
      }
      ambulance_drivers: {
        Row: {
          created_at: string
          id: string
          lokasi_terakhir: string | null
          nama: string
          no_telepon: string
          nrp: string
          shift: string
          status: string
          terakhir_update: string | null
          unit_ambulans: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lokasi_terakhir?: string | null
          nama: string
          no_telepon: string
          nrp: string
          shift: string
          status?: string
          terakhir_update?: string | null
          unit_ambulans: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lokasi_terakhir?: string | null
          nama?: string
          no_telepon?: string
          nrp?: string
          shift?: string
          status?: string
          terakhir_update?: string | null
          unit_ambulans?: string
          updated_at?: string
        }
        Relationships: []
      }
      ambulance_status: {
        Row: {
          ambulance_id: string
          created_at: string
          crew_count: number
          fuel_level: number
          id: string
          last_updated_by: string | null
          position: string
          position_lat: number | null
          position_lng: number | null
          shift_end: string
          shift_start: string
          status: string
          updated_at: string
        }
        Insert: {
          ambulance_id: string
          created_at?: string
          crew_count?: number
          fuel_level?: number
          id?: string
          last_updated_by?: string | null
          position?: string
          position_lat?: number | null
          position_lng?: number | null
          shift_end?: string
          shift_start?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ambulance_id?: string
          created_at?: string
          crew_count?: number
          fuel_level?: number
          id?: string
          last_updated_by?: string | null
          position?: string
          position_lat?: number | null
          position_lng?: number | null
          shift_end?: string
          shift_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ambulance_tracking: {
        Row: {
          accuracy: number | null
          ambulance_id: string
          created_at: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          speed: number | null
          timestamp: string
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          ambulance_id: string
          created_at?: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          speed?: number | null
          timestamp?: string
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          ambulance_id?: string
          created_at?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          timestamp?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_reports: {
        Row: {
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          file_url: string | null
          filters: Json | null
          generated_by: string | null
          id: string
          report_data: Json | null
          report_name: string
          report_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          file_url?: string | null
          filters?: Json | null
          generated_by?: string | null
          id?: string
          report_data?: Json | null
          report_name: string
          report_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          file_url?: string | null
          filters?: Json | null
          generated_by?: string | null
          id?: string
          report_data?: Json | null
          report_name?: string
          report_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_dispatches: {
        Row: {
          actual_arrival: string | null
          ambulance_id: string
          created_at: string
          dispatch_time: string
          distance_km: number | null
          emergency_report_id: string | null
          estimated_arrival: string | null
          eta_minutes: number | null
          id: string
          route_data: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_arrival?: string | null
          ambulance_id: string
          created_at?: string
          dispatch_time?: string
          distance_km?: number | null
          emergency_report_id?: string | null
          estimated_arrival?: string | null
          eta_minutes?: number | null
          id?: string
          route_data?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_arrival?: string | null
          ambulance_id?: string
          created_at?: string
          dispatch_time?: string
          distance_km?: number | null
          emergency_report_id?: string | null
          estimated_arrival?: string | null
          eta_minutes?: number | null
          id?: string
          route_data?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_reports: {
        Row: {
          created_at: string | null
          description: string
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          patient_name: string
          patient_rank: string | null
          reporter_name: string
          reporter_phone: string
          reporter_rank: string
          severity: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          patient_name: string
          patient_rank?: string | null
          reporter_name: string
          reporter_phone: string
          reporter_rank: string
          severity: string
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          patient_name?: string
          patient_rank?: string | null
          reporter_name?: string
          reporter_phone?: string
          reporter_rank?: string
          severity?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_tracking: {
        Row: {
          ambulance_id: string
          created_at: string
          current_level: number | null
          equipment_name: string
          equipment_type: string
          id: string
          last_checked_at: string
          last_checked_by: string
          max_capacity: number | null
          notes: string | null
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          ambulance_id: string
          created_at?: string
          current_level?: number | null
          equipment_name: string
          equipment_type: string
          id?: string
          last_checked_at?: string
          last_checked_by: string
          max_capacity?: number | null
          notes?: string | null
          status?: string
          unit: string
          updated_at?: string
        }
        Update: {
          ambulance_id?: string
          created_at?: string
          current_level?: number | null
          equipment_name?: string
          equipment_type?: string
          id?: string
          last_checked_at?: string
          last_checked_by?: string
          max_capacity?: number | null
          notes?: string | null
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      fcm_tokens: {
        Row: {
          created_at: string
          device_type: string
          id: string
          token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string
          id?: string
          token: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string
          id?: string
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hospital_capacity: {
        Row: {
          cardiac_capacity: boolean
          created_at: string
          emergency_beds_available: number
          emergency_beds_total: number
          hospital_address: string
          hospital_name: string
          icu_beds_available: number
          icu_beds_total: number
          id: string
          last_updated: string
          latitude: number
          longitude: number
          pediatric_capacity: boolean
          stroke_capacity: boolean
          trauma_capacity: boolean
          updated_at: string
        }
        Insert: {
          cardiac_capacity?: boolean
          created_at?: string
          emergency_beds_available?: number
          emergency_beds_total?: number
          hospital_address: string
          hospital_name: string
          icu_beds_available?: number
          icu_beds_total?: number
          id?: string
          last_updated?: string
          latitude: number
          longitude: number
          pediatric_capacity?: boolean
          stroke_capacity?: boolean
          trauma_capacity?: boolean
          updated_at?: string
        }
        Update: {
          cardiac_capacity?: boolean
          created_at?: string
          emergency_beds_available?: number
          emergency_beds_total?: number
          hospital_address?: string
          hospital_name?: string
          icu_beds_available?: number
          icu_beds_total?: number
          id?: string
          last_updated?: string
          latitude?: number
          longitude?: number
          pediatric_capacity?: boolean
          stroke_capacity?: boolean
          trauma_capacity?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          id: string
          last_seen: string
          lat: number
          lng: number
          name: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen?: string
          lat: number
          lng: number
          name: string
          role: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_seen?: string
          lat?: number
          lng?: number
          name?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      maintenance_schedules: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          item_identifier: string
          item_name: string
          item_type: string
          maintenance_type: string
          notes: string | null
          scheduled_date: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          item_identifier: string
          item_name: string
          item_type: string
          maintenance_type: string
          notes?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          item_identifier?: string
          item_name?: string
          item_type?: string
          maintenance_type?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      maps_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          tile_data: string
          tile_url: string
          x_coordinate: number
          y_coordinate: number
          zoom_level: number
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          tile_data: string
          tile_url: string
          x_coordinate: number
          y_coordinate: number
          zoom_level: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          tile_data?: string
          tile_url?: string
          x_coordinate?: number
          y_coordinate?: number
          zoom_level?: number
        }
        Relationships: []
      }
      medical_team: {
        Row: {
          alamat: string
          created_at: string
          id: string
          jadwal_piket: string
          nama: string
          no_lisensi: string
          no_telepon: string
          spesialisasi: string
          status: string
          updated_at: string
        }
        Insert: {
          alamat: string
          created_at?: string
          id?: string
          jadwal_piket: string
          nama: string
          no_lisensi: string
          no_telepon: string
          spesialisasi: string
          status?: string
          updated_at?: string
        }
        Update: {
          alamat?: string
          created_at?: string
          id?: string
          jadwal_piket?: string
          nama?: string
          no_lisensi?: string
          no_telepon?: string
          spesialisasi?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      navigation_routes: {
        Row: {
          ambulance_id: string
          created_at: string
          emergency_report_id: string | null
          end_location: Json
          estimated_distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          route_data: Json | null
          start_location: Json
          status: string
          traffic_conditions: string | null
          updated_at: string
        }
        Insert: {
          ambulance_id: string
          created_at?: string
          emergency_report_id?: string | null
          end_location: Json
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          route_data?: Json | null
          start_location: Json
          status?: string
          traffic_conditions?: string | null
          updated_at?: string
        }
        Update: {
          ambulance_id?: string
          created_at?: string
          emergency_report_id?: string | null
          end_location?: Json
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          route_data?: Json | null
          start_location?: Json
          status?: string
          traffic_conditions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_routes_emergency_report_id_fkey"
            columns: ["emergency_report_id"]
            isOneToOne: false
            referencedRelation: "emergency_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          priority: string
          sent_at: string | null
          status: string
          target_role: string | null
          target_user_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          priority?: string
          sent_at?: string | null
          status?: string
          target_role?: string | null
          target_user_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          priority?: string
          sent_at?: string | null
          status?: string
          target_role?: string | null
          target_user_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_monitoring: {
        Row: {
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          id: string
          notes: string | null
          oxygen_saturation: number | null
          pulse_rate: number | null
          recorded_at: string
          recorded_by: string
          report_id: string | null
          respiratory_rate: number | null
          temperature: number | null
        }
        Insert: {
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          pulse_rate?: number | null
          recorded_at?: string
          recorded_by: string
          report_id?: string | null
          respiratory_rate?: number | null
          temperature?: number | null
        }
        Update: {
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          pulse_rate?: number | null
          recorded_at?: string
          recorded_by?: string
          report_id?: string | null
          respiratory_rate?: number | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_monitoring_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "emergency_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          ambulance_utilization_percentage: number | null
          average_arrival_time_minutes: number | null
          average_dispatch_time_minutes: number | null
          average_response_time_minutes: number | null
          created_at: string
          critical_calls: number | null
          gps_accuracy_percentage: number | null
          hospital_capacity_utilization: number | null
          id: string
          metric_date: string
          metric_type: string
          offline_incidents: number | null
          on_site_treatments: number | null
          successful_transports: number | null
          system_uptime_percentage: number | null
          total_calls: number | null
          updated_at: string
          user_satisfaction_score: number | null
        }
        Insert: {
          ambulance_utilization_percentage?: number | null
          average_arrival_time_minutes?: number | null
          average_dispatch_time_minutes?: number | null
          average_response_time_minutes?: number | null
          created_at?: string
          critical_calls?: number | null
          gps_accuracy_percentage?: number | null
          hospital_capacity_utilization?: number | null
          id?: string
          metric_date: string
          metric_type: string
          offline_incidents?: number | null
          on_site_treatments?: number | null
          successful_transports?: number | null
          system_uptime_percentage?: number | null
          total_calls?: number | null
          updated_at?: string
          user_satisfaction_score?: number | null
        }
        Update: {
          ambulance_utilization_percentage?: number | null
          average_arrival_time_minutes?: number | null
          average_dispatch_time_minutes?: number | null
          average_response_time_minutes?: number | null
          created_at?: string
          critical_calls?: number | null
          gps_accuracy_percentage?: number | null
          hospital_capacity_utilization?: number | null
          id?: string
          metric_date?: string
          metric_type?: string
          offline_incidents?: number | null
          on_site_treatments?: number | null
          successful_transports?: number | null
          system_uptime_percentage?: number | null
          total_calls?: number | null
          updated_at?: string
          user_satisfaction_score?: number | null
        }
        Relationships: []
      }
      personnel: {
        Row: {
          alamat: string
          created_at: string
          id: string
          jabatan: string
          nama: string
          no_telepon: string
          nrp: string
          pangkat: string
          satuan: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alamat: string
          created_at?: string
          id?: string
          jabatan: string
          nama: string
          no_telepon: string
          nrp: string
          pangkat: string
          satuan: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alamat?: string
          created_at?: string
          id?: string
          jabatan?: string
          nama?: string
          no_telepon?: string
          nrp?: string
          pangkat?: string
          satuan?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      resource_inventory: {
        Row: {
          category: string
          cost_per_unit: number | null
          created_at: string
          current_stock: number
          expiry_date: string | null
          id: string
          item_name: string
          last_updated_by: string
          location: string | null
          minimum_stock: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          item_name: string
          last_updated_by: string
          location?: string | null
          minimum_stock?: number
          supplier?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          item_name?: string
          last_updated_by?: string
          location?: string | null
          minimum_stock?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      response_analytics: {
        Row: {
          ambulance_arrived_at: string | null
          ambulance_dispatched_at: string | null
          ambulance_id: string | null
          arrival_time_minutes: number | null
          call_received_at: string
          case_closed_at: string | null
          created_at: string
          crew_size: number | null
          dispatch_time_minutes: number | null
          distance_km: number | null
          emergency_report_id: string | null
          first_response_at: string | null
          hospital_destination: string | null
          id: string
          outcome: string | null
          patient_transported_at: string | null
          priority_level: string | null
          response_time_minutes: number | null
          total_duration_minutes: number | null
          updated_at: string
        }
        Insert: {
          ambulance_arrived_at?: string | null
          ambulance_dispatched_at?: string | null
          ambulance_id?: string | null
          arrival_time_minutes?: number | null
          call_received_at: string
          case_closed_at?: string | null
          created_at?: string
          crew_size?: number | null
          dispatch_time_minutes?: number | null
          distance_km?: number | null
          emergency_report_id?: string | null
          first_response_at?: string | null
          hospital_destination?: string | null
          id?: string
          outcome?: string | null
          patient_transported_at?: string | null
          priority_level?: string | null
          response_time_minutes?: number | null
          total_duration_minutes?: number | null
          updated_at?: string
        }
        Update: {
          ambulance_arrived_at?: string | null
          ambulance_dispatched_at?: string | null
          ambulance_id?: string | null
          arrival_time_minutes?: number | null
          call_received_at?: string
          case_closed_at?: string | null
          created_at?: string
          crew_size?: number | null
          dispatch_time_minutes?: number | null
          distance_km?: number | null
          emergency_report_id?: string | null
          first_response_at?: string | null
          hospital_destination?: string | null
          id?: string
          outcome?: string | null
          patient_transported_at?: string | null
          priority_level?: string | null
          response_time_minutes?: number | null
          total_duration_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_analytics_emergency_report_id_fkey"
            columns: ["emergency_report_id"]
            isOneToOne: false
            referencedRelation: "emergency_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          action_type: string
          created_at: string
          error_message: string | null
          id: string
          max_retries: number | null
          payload: Json
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          scheduled_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          payload: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          payload?: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_events: {
        Row: {
          battery_level: number | null
          created_at: string
          device_info: Json | null
          event_data: Json | null
          event_type: string
          gps_accuracy: number | null
          id: string
          network_type: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          battery_level?: number | null
          created_at?: string
          device_info?: Json | null
          event_data?: Json | null
          event_type: string
          gps_accuracy?: number | null
          id?: string
          network_type?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          battery_level?: number | null
          created_at?: string
          device_info?: Json | null
          event_data?: Json | null
          event_type?: string
          gps_accuracy?: number | null
          id?: string
          network_type?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_chat: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          is_urgent: boolean
          message: string
          message_type: string
          report_id: string | null
          sender_name: string
          sender_role: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_urgent?: boolean
          message: string
          message_type?: string
          report_id?: string | null
          sender_name: string
          sender_role: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_urgent?: boolean
          message?: string
          message_type?: string
          report_id?: string | null
          sender_name?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "emergency_reports"
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
