'use strict';
import { db, TABLES } from '../_utils/db.js';

export default async function handler(req, res) {
  const { data, error } = await db
    .from(TABLES.CHANGELOGS)
    .select('*')
    .order('released_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'db error', detail: error.message });

  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({ entries: data || [] });
}
