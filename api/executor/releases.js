'use strict';
// Reads releases from a JSON file. In production, move to Vercel KV.
import releases from '../../data/releases.json' with { type: 'json' };

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({ releases });
}