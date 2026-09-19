'use strict';
import crypto from 'crypto';

export default function handler(req, res) {
  const cookie = (req.headers.cookie || '').split(';').find(c => c.trim().startsWith('veil_session='));
  if (!cookie) return res.json({ user: null });
  
  const token = cookie.split('=')[1];
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(payload).digest('base64url');
  if (sig !== expected) return res.json({ user: null });
  
  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
    res.setHeader('Cache-Control', 'no-store');
    res.json({ user });
  } catch (_) {
    res.json({ user: null });
  }
}