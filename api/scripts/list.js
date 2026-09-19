'use strict';
import scripts from '../../data/scripts.json' with { type: 'json' };

export default function handler(req, res) {
  const q = (req.query.q || '').toString().toLowerCase();
  const category = (req.query.category || '').toString();
  const sort = (req.query.sort || 'recent').toString();

  let items = scripts.filter((s) => s.status === 'approved');

  if (q) {
    items = items.filter((s) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.author || '').toLowerCase().includes(q)
    );
  }
  if (category) items = items.filter((s) => s.category === category);

  if (sort === 'popular') items.sort((a, b) => (b.runs || 0) - (a.runs || 0));
  else if (sort === 'featured') items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  else items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({ items });
}