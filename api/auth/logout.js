'use strict';
export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'veil_session=; Path=/; Max-Age=0');
  res.json({ ok: true });
}