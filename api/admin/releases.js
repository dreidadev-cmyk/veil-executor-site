'use strict';
import { requireAdmin, db, TABLES } from '../_utils/auth.js';

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const { data, error } = await db
      .from(TABLES.RELEASES)
      .select('*')
      .order('released_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'db error', detail: error.message });
    return res.json({ releases: data || [] });
  }

  if (req.method === 'POST') {
    const { version, channel, platforms, files, sha256, size, changelog } = req.body || {};
    if (!version || !files?.length) {
      return res.status(400).json({ error: 'version and files[] required' });
    }

    const record = {
      version: String(version),
      channel: channel || 'stable',
      platforms: platforms || ['Android'],
      files,
      sha256: sha256 || '',
      size: Number(size) || 0,
      released_at: new Date().toISOString(),
      published_by: admin.username,
      changelog: changelog || null,
    };

    const { error: insertErr } = await db.from(TABLES.RELEASES).insert(record);
    if (insertErr) return res.status(500).json({ error: 'db error', detail: insertErr.message });

    if (changelog) {
      const cl = {
        version: record.version,
        released_at: record.released_at,
        channel: record.channel,
        new: changelog.new || [],
        improve: changelog.improve || [],
        fix: changelog.fix || [],
        break: changelog.break || [],
      };
      await db.from(TABLES.CHANGELOGS).insert(cl);
    }

    return res.json({ ok: true, release: record });
  }

  res.status(405).json({ error: 'method not allowed' });
}
