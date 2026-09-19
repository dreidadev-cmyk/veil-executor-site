'use strict';
// NOTE: Vercel serverless is stateless. For real persistence, wire Vercel KV here.
// This stub validates and returns an ok — replace with KV writes in production.
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  
  const cookie = (req.headers.cookie || '').split(';').find(c => c.trim().startsWith('veil_session='));
  if (!cookie) return res.status(401).json({ error: 'unauthorized' });
  const [payload, sig] = cookie.split('=')[1].split('.');
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(payload).digest('base64url');
  if (sig !== expected) return res.status(401).json({ error: 'unauthorized' });
  
  const { title, description, code, category } = req.body || {};
  if (!title || !code) return res.status(400).json({ error: 'title and code required' });
  
  // TODO: write to Vercel KV, mark status 'pending'
  res.json({ ok: true, message: 'Submitted for review.' });
}