'use strict';
import { getSession, db, TABLES } from '../_utils/auth.js';

export default async function handler(req, res) {
  const user = getSession(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const { data, error } = await db
    .from(TABLES.SCRIPTS)
    .select('*')
    .eq('author_id', String(user.id))
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'db error', detail: error.message });

  res.json({ items: data || [] });
}
