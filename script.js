'use strict';
import { api, toast } from './app.js';

const grid = document.getElementById('grid');
const search = document.getElementById('search');
const catSel = document.getElementById('category');
const sortSel = document.getElementById('sort');
const submitBtn = document.getElementById('submit-btn');

async function isLoggedIn() {
  try {
    const me = await api('/api/auth/me');
    return !!(me && me.user);
  } catch (_) { return false; }
}

async function load() {
  const params = new URLSearchParams({
    q: search.value || '',
    category: catSel.value || '',
    sort: sortSel.value || 'recent',
  });
  grid.innerHTML = `<div class="muted">Loading…</div>`;
  try {
    const data = await api(`/api/scripts/list?${params}`);
    const items = data.items || [];
    if (!items.length) {
      grid.innerHTML = `<div class="muted">No scripts matched.</div>`;
      return;
    }
    grid.innerHTML = items.map(renderCard).join('');
  } catch (err) {
    grid.innerHTML = `<div class="muted">Failed: ${err.message}</div>`;
  }
}

function renderCard(s) {
  return `
    <div class="script-card" data-id="${s.id}">
      <div class="sc-head">
        <div class="sc-title">${escapeHtml(s.title)}</div>
        <div class="sc-cat">${s.category || 'other'}</div>
      </div>
      <div class="sc-desc">${escapeHtml(s.description || '').slice(0, 180)}</div>
      <div class="sc-meta">
        <span>by ${escapeHtml(s.author || 'anon')}</span>
        <span>⬇ ${s.runs || 0}</span>
        ${s.featured ? `<span class="sc-featured">★ featured</span>` : ''}
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

search.addEventListener('input', debounce(load, 300));
catSel.addEventListener('change', load);
sortSel.addEventListener('change', load);

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

submitBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const ok = await isLoggedIn();
  if (!ok) {
    toast('Login required to submit scripts', 'err');
    setTimeout(() => location.href = 'login.html?next=scripts.html', 500);
    return;
  }
  location.href = 'dashboard.html#submit';
});

load();