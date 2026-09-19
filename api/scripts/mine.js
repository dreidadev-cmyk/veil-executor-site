'use strict';
import { getSession, db, TABLES, DB_READY } from '../_utils/auth.js';

export default async function handler(req, res) {
  const user = getSession(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  if (!DB_READY) return res.json({ items: [] });

  const { data, error } = await db
    .from(TABLES.SCRIPTS)
    .select('*')
    .eq('author_id', String(user.id))
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'db error', detail: error.message });

  const items = (data || []).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    author: s.author,
    authorId: s.author_id,
    runs: s.runs || 0,
    featured: !!s.featured,
    status: s.status,
    createdAt: s.created_at,
  }));

  res.json({ items });
}
