'use strict';
import crypto from 'crypto';
import { db, TABLES } from './db.js';

const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function getSession(req) {
  const cookie = (req.headers.cookie || '')
    .split(';')
    .find((c) => c.trim().startsWith('veil_session='));
  if (!cookie) return null;

  const token = cookie.split('=')[1];
  const [payload, sig] = token.split('.');
  const expected = crypto
    .createHmac('sha256', process.env.SESSION_SECRET || '')
    .update(payload)
    .digest('base64url');
  if (sig !== expected) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch (_) {
    return null;
  }
}

export function isAdmin(user) {
  if (!user) return false;
  if (ADMIN_IDS.length === 0) return false;
  return ADMIN_IDS.includes(String(user.id));
}

export function requireAdmin(req, res) {
  const user = getSession(req);
  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  if (!isAdmin(user)) {
    res.status(403).json({ error: 'forbidden' });
    return null;
  }
  return user;
}

export { db, TABLES };
