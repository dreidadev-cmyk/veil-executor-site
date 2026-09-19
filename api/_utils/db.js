'use strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const DB_READY = !!(url && key);

if (!DB_READY) {
  console.warn('[veil/db] Supabase not configured — falling back to JSON files');
}

export const db = DB_READY
  ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export const TABLES = {
  SCRIPTS: 'scripts',
  RELEASES: 'releases',
  CHANGELOGS: 'changelogs',
};
