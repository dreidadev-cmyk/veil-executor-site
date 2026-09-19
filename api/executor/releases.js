'use strict';
import { db, TABLES, DB_READY } from '../_utils/db.js';
import fallback from '../../data/releases.json' with { type: 'json' };

export default async function handler(req, res) {
  if (!DB_READY) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json({ releases: fallback || [] });
  }

  const { data, error } = await db
    .from(TABLES.RELEASES)
    .select('*')
    .order('released_at', { ascending: false });

  if (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: 'db error', detail: error.message });
  }

  // i-map ang snake_case DB fields sa camelCase na inaasahan ng frontend
  const normalized = (data || []).map((r) => ({
    version: r.version,
    channel: r.channel,
    platforms: r.platforms || [],
    files: r.files || [],
    sha256: r.sha256,
    size: r.size,
    releasedAt: r.released_at,
    publishedBy: r.published_by,
    changelog: r.changelog,
  }));

  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({ releases: normalized });
}
