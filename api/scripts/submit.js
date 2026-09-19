'use strict';
import { getSession, db, TABLES } from '../_utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const user = getSession(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const { title, description, code, category } = req.body || {};
  if (!title || !code) return res.status(400).json({ error: 'title and code required' });

  const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    title: String(title).slice(0, 120),
    description: String(description || '').slice(0, 500),
    code: String(code).slice(0, 50000),
    category: category || 'other',
    author: user.username,
    author_id: String(user.id),
    status: 'pending',
  };

  const { error } = await db.from(TABLES.SCRIPTS).insert(record);
  if (error) return res.status(500).json({ error: 'db error', detail: error.message });

  res.json({ ok: true, message: 'Submitted for review.', id });
}
