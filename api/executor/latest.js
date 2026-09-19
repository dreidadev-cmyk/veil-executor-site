'use strict';
import releases from '../../data/releases.json' with { type: 'json' };

export default function handler(req, res) {
  if (!releases.length) return res.status(404).json({ error: 'no releases' });
  res.setHeader('Cache-Control', 'public, max-age=30');
  res.json(releases[0]);
}