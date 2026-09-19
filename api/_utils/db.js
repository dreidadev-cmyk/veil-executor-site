'use strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('[veil/db] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
}

export const db = createClient(url || '', key || '', {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const TABLES = {
  SCRIPTS: 'scripts',
  RELEASES: 'releases',
  CHANGELOGS: 'changelogs',
};
