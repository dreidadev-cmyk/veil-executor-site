'use strict';
import { db, TABLES, DB_READY } from '../_utils/db.js';
import fallback from '../../data/releases.json' with { type: 'json' };

export default async function handler(req, res) {
  if (!DB_READY) {
    const first = (fallback || [])[0];
    if (!first) return res.status(404).json({ error: 'no releases' });
    return res.json(first);
  }

  const { data, error } = await db
    .from(TABLES.RELEASES)
    .select('*')
    .order('released_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'db error', detail: error.message });
  if (!data) return res.status(404).json({ error: 'no releases' });

  res.setHeader('Cache-Control', 'public, max-age=30');
  res.json({
    version: data.version,
    channel: data.channel,
    platforms: data.platforms || [],
    files: data.files || [],
    sha256: data.sha256,
    size: data.size,
    releasedAt: data.released_at,
  });
}
