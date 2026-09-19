'use strict';
import { db, TABLES, DB_READY } from '../_utils/db.js';
import fallback from '../../data/scripts.json' with { type: 'json' };

export default async function handler(req, res) {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const category = (req.query.category || '').toString();
  const sort = (req.query.sort || 'recent').toString();

  let items = [];

  if (!DB_READY) {
    items = (fallback || []).filter((s) => s.status === 'approved');
  } else {
    let query = db.from(TABLES.SCRIPTS).select('*').eq('status', 'approved');
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,author.ilike.%${q}%`);
    }
    if (category) query = query.eq('category', category);

    if (sort === 'popular') query = query.order('runs', { ascending: false });
    else if (sort === 'featured') query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'db error', detail: error.message });
    items = data || [];
  }

  // client-side filter para sa fallback path
  if (!DB_READY) {
    if (q) {
      items = items.filter((s) =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.author || '').toLowerCase().includes(q));
    }
    if (category) items = items.filter((s) => s.category === category);
    if (sort === 'popular') items.sort((a, b) => (b.runs || 0) - (a.runs || 0));
  }

  // i-map ang snake_case sa camelCase
  items = items.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    author: s.author,
    authorId: s.author_id || s.authorId,
    runs: s.runs || 0,
    featured: !!s.featured,
    status: s.status,
    createdAt: s.created_at || s.createdAt,
  }));

  res.setHeader('Cache-Control', 'no-store');
  res.json({ items });
}
