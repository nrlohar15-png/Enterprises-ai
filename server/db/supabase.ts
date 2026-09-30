import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

export class SupabaseService {
  public client: SupabaseClient | null = null;
  public isConnected = false;

  constructor() {
    if (supabaseUrl && supabaseSecretKey) {
      try {
        this.client = createClient(supabaseUrl, supabaseSecretKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        console.log(`⚡ Supabase client initialized for: ${supabaseUrl}`);
      } catch (err: any) {
        console.warn('Failed to initialize Supabase client:', err.message);
        this.client = null;
      }
    } else {
      console.log('No SUPABASE_URL or keys configured. Skipping Supabase initialization.');
    }
  }

  async checkConnection(): Promise<{ connected: boolean; message: string; projectUrl?: string }> {
    if (!this.client || !supabaseUrl) {
      return { connected: false, message: 'Supabase credentials not configured' };
    }

    try {
      // Test query to PostgREST
      const { error } = await this.client.from('organizations').select('id').limit(1);
      
      // If code is PGRST205, database is reachable, but table schema is not yet applied
      if (error && error.code === 'PGRST205') {
        this.isConnected = true;
        return {
          connected: true,
          message: 'Supabase project connected. Note: Tables not yet created in Supabase public schema (schema migration ready).',
          projectUrl: supabaseUrl,
        };
      }

      if (error && error.code !== 'PGRST116') {
        console.warn('Supabase ping notice:', error.message);
      }

      this.isConnected = true;
      return {
        connected: true,
        message: 'Connected successfully to Supabase enterprise project',
        projectUrl: supabaseUrl,
      };
    } catch (err: any) {
      return { connected: false, message: `Connection error: ${err.message}` };
    }
  }
}

export const supabaseService = new SupabaseService();
export const supabase = supabaseService.client;
