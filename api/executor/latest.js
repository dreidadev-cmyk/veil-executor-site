'use strict';
import { db, TABLES } from '../_utils/db.js';

export default async function handler(req, res) {
  const { data, error } = await db
    .from(TABLES.RELEASES)
    .select('*')
    .order('released_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'db error', detail: error.message });
  if (!data) return res.status(404).json({ error: 'no releases' });

  res.setHeader('Cache-Control', 'public, max-age=30');
  res.json(data);
}
