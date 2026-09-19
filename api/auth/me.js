'use strict';
import crypto from 'crypto';

const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export default function handler(req, res) {
  const cookie = (req.headers.cookie || '')
    .split(';')
    .find((c) => c.trim().startsWith('veil_session='));

  if (!cookie) {
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ user: null });
  }

  const token = cookie.split('=')[1];
  const [payload, sig] = token.split('.');
  const expected = crypto
    .createHmac('sha256', process.env.SESSION_SECRET || '')
    .update(payload)
    .digest('base64url');

  if (sig !== expected) {
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ user: null });
  }

  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const isAdmin = ADMIN_IDS.includes(String(user.id));
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      user: {
        ...user,
        role: isAdmin ? 'admin' : (user.role || 'member'),
      },
    });
  } catch (_) {
    res.json({ user: null });
  }
}
