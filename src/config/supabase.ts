import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

const emAmbienteTeste = process.env.NODE_ENV === 'test';

const supabaseUrl = emAmbienteTeste
  ? process.env.SUPABASE_TEST_URL || process.env.SUPABASE_URL
  : process.env.SUPABASE_URL;

const supabaseKey = emAmbienteTeste
  ? process.env.SUPABASE_TEST_KEY || process.env.SUPABASE_KEY
  : process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são obrigatórias (ou SUPABASE_TEST_URL e SUPABASE_TEST_KEY em ambiente de testes).'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: WebSocket as any,
  },
});