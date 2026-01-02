import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Test connection
supabase
  .from('models')
  .select('count')
  .limit(1)
  .then(({ error }) => {
    if (error) {
      logger.error('Failed to connect to Supabase:', error);
    } else {
      logger.info('✅ Supabase connection established');
    }
  });

export default supabase;
