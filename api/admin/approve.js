'use strict';
import { requireAdmin, db, TABLES } from '../_utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { id, action, reason } = req.body || {};
  if (!id || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  const status = action === 'approve' ? 'approved' : 'rejected';

  const { data, error } = await db
    .from(TABLES.SCRIPTS)
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.username,
      review_reason: reason || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'db error', detail: error.message });

  res.json({ ok: true, script: data });
}
