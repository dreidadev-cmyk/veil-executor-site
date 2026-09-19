'use strict';
import changelog from '../../data/changelog.json' with { type: 'json' };

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({ entries: changelog });
}