'use strict';
import scripts from '../../data/scripts.json' with { type: 'json' };
import crypto from 'crypto';

export default function handler(req, res) {
  const cookie = (req.headers.cookie || '').split(';').find(c => c.trim().startsWith('veil_session='));
  if (!cookie) return res.status(401).json({ error: 'unauthorized' });
  const [payload, sig] = cookie.split('=')[1].split('.');
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(payload).digest('base64url');
  if (sig !== expected) return res.status(401).json({ error: 'unauthorized' });

  const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
  const mine = scripts.filter((s) => s.authorId === user.id);
  res.json({ items: mine });
}