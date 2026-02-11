import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      produces: {
        Row: {
          id: string;
          farmer_id: string;
          name: string;
          variety: string | null;
          quantity: number;
          unit: 'kg' | 'quintal' | 'ton';
          base_price: number;
          current_price: number;
          images: string[];
          description: string | null;
          location: string;
          harvest_date: string | null;
          status: 'active' | 'bidding' | 'sold' | 'expired';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          name: string;
          variety?: string | null;
          quantity: number;
          unit: 'kg' | 'quintal' | 'ton';
          base_price: number;
          current_price: number;
          images?: string[];
          description?: string | null;
          location: string;
          harvest_date?: string | null;
          status?: 'active' | 'bidding' | 'sold' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          name?: string;
          variety?: string | null;
          quantity?: number;
          unit?: 'kg' | 'quintal' | 'ton';
          base_price?: number;
          current_price?: number;
          images?: string[];
          description?: string | null;
          location?: string;
          harvest_date?: string | null;
          status?: 'active' | 'bidding' | 'sold' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
      };
      bids: {
        Row: {
          id: string;
          produce_id: string;
          trader_id: string;
          trader_name: string;
          amount: number;
          quantity: number;
          message: string | null;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          produce_id: string;
          trader_id: string;
          trader_name: string;
          amount: number;
          quantity: number;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          produce_id?: string;
          trader_id?: string;
          trader_name?: string;
          amount?: number;
          quantity?: number;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
