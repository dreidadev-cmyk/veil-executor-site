'use strict';
import { requireAdmin, db, TABLES } from '../_utils/auth.js';

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  const { data, error } = await db
    .from(TABLES.SCRIPTS)
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'db error', detail: error.message });

  res.setHeader('Cache-Control', 'no-store');
  res.json({ items: data || [] });
}
