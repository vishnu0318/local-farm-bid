export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          branch_name: string
          confirm_account_number: string
          created_at: string
          id: string
          ifsc_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_name: string
          branch_name: string
          confirm_account_number: string
          created_at?: string
          id?: string
          ifsc_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          branch_name?: string
          confirm_account_number?: string
          created_at?: string
          id?: string
          ifsc_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount: number
          bidder_id: string
          bidder_name: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          amount: number
          bidder_id: string
          bidder_name: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          amount?: number
          bidder_id?: string
          bidder_name?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          bid_amount: number | null
          bidder_id: string | null
          bidder_name: string | null
          created_at: string | null
          farmer_id: string | null
          id: string
          message: string
          product_id: string | null
          read: boolean | null
          type: string
        }
        Insert: {
          bid_amount?: number | null
          bidder_id?: string | null
          bidder_name?: string | null
          created_at?: string | null
          farmer_id?: string | null
          id?: string
          message: string
          product_id?: string | null
          read?: boolean | null
          type: string
        }
        Update: {
          bid_amount?: number | null
          bidder_id?: string | null
          bidder_name?: string | null
          created_at?: string | null
          farmer_id?: string | null
          id?: string
          message?: string
          product_id?: string | null
          read?: boolean | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          delivery_address: Json | null
          id: string
          payment_date: string | null
          payment_method: string
          payment_status: string
          product_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          delivery_address?: Json | null
          id?: string
          payment_date?: string | null
          payment_method: string
          payment_status: string
          product_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          delivery_address?: Json | null
          id?: string
          payment_date?: string | null
          payment_method?: string
          payment_status?: string
          product_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean | null
          bid_end: string | null
          bid_start: string | null
          category: string
          created_at: string
          description: string | null
          farmer_id: string
          id: string
          image_url: string | null
          name: string
          paid: boolean | null
          price: number
          quantity: number
          subCategory: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          available?: boolean | null
          bid_end?: string | null
          bid_start?: string | null
          category: string
          created_at?: string
          description?: string | null
          farmer_id: string
          id?: string
          image_url?: string | null
          name: string
          paid?: boolean | null
          price: number
          quantity: number
          subCategory?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          available?: boolean | null
          bid_end?: string | null
          bid_start?: string | null
          category?: string
          created_at?: string
          description?: string | null
          farmer_id?: string
          id?: string
          image_url?: string | null
          name?: string
          paid?: boolean | null
          price?: number
          quantity?: number
          subCategory?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          email: string
          id: string
          land_size: string | null
          name: string
          phone: string | null
          preferred_categories: string[] | null
          role: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          id: string
          land_size?: string | null
          name: string
          phone?: string | null
          preferred_categories?: string[] | null
          role: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          land_size?: string | null
          name?: string
          phone?: string | null
          preferred_categories?: string[] | null
          role?: string
          updated_at?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
