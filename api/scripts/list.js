'use strict';
import { db, TABLES } from '../_utils/db.js';

export default async function handler(req, res) {
  const q = (req.query.q || '').toString().trim();
  const category = (req.query.category || '').toString();
  const sort = (req.query.sort || 'recent').toString();

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

  res.setHeader('Cache-Control', 'no-store');
  res.json({ items: data || [] });
}
