'use strict';
import { db, TABLES, DB_READY } from '../_utils/db.js';
import fallback from '../../data/changelog.json' with { type: 'json' };

export default async function handler(req, res) {
  if (!DB_READY) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json({ entries: fallback || [] });
  }

  const { data, error } = await db
    .from(TABLES.CHANGELOGS)
    .select('*')
    .order('released_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'db error', detail: error.message });

  const normalized = (data || []).map((c) => ({
    version: c.version,
    releasedAt: c.released_at,
    channel: c.channel,
    new: c.new || [],
    improve: c.improve || [],
    fix: c.fix || [],
    break: c.break || [],
  }));

  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({ entries: normalized });
}
