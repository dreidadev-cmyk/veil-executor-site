'use strict';
import { api, toast, timeAgo } from './app.js';

const gate = document.getElementById('gate');
const panel = document.getElementById('panel');
const pendingList = document.getElementById('pending-list');
const releaseList = document.getElementById('release-list');

let releases = [];

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function boot() {
  try {
    const me = await api('/api/auth/me');
    if (!me?.user) {
      gate.innerHTML = 'Login required. <a href="login.html" style="color:var(--yellow)">Sign in</a>';
      return;
    }
    if (me.user.role !== 'admin') {
      gate.textContent = 'Access denied — you are not an admin.';
      return;
    }
    const navAuth = document.getElementById('nav-auth');
    navAuth.innerHTML = `<img class="nav-avatar" src="${me.user.avatar}" alt="" /><span style="margin-left:8px">${me.user.username}</span>`;
    navAuth.classList.add('nav-avatar-link');

    gate.classList.add('hidden');
    panel.classList.remove('hidden');
    await Promise.all([loadPending(), loadReleases(), loadStats()]);
  } catch (err) {
    gate.textContent = `Error: ${err.message}`;
  }
}

async function loadPending() {
  pendingList.innerHTML = `<div class="empty">Loading…</div>`;
  try {
    const data = await api('/api/admin/pending');
    const items = data.items || [];
    if (!items.length) {
      pendingList.innerHTML = `<div class="empty">No pending submissions.</div>`;
      return;
    }
    pendingList.innerHTML = items.map(renderPending).join('');
    bindActions();
  } catch (err) {
    pendingList.innerHTML = `<div class="empty">Failed: ${err.message}</div>`;
  }
}

function renderPending(s) {
  return `
    <div class="admin-item" data-id="${s.id}">
      <h4>${escapeHtml(s.title)}</h4>
      <div class="meta">
        <span>by ${escapeHtml(s.author)}</span>
        <span>${escapeHtml(s.category || 'other')}</span>
        <span>${timeAgo(s.createdAt || s.created_at)}</span>
      </div>
      ${s.description ? `<div class="desc">${escapeHtml(s.description)}</div>` : ''}
      ${s.code ? `<pre class="code-preview">${escapeHtml(s.code.slice(0, 1200))}${s.code.length > 1200 ? '\n…' : ''}</pre>` : ''}
      <div class="admin-actions">
        <button class="btn btn-primary btn-sm" data-action="approve" data-id="${s.id}">Approve</button>
        <button class="btn btn-danger btn-sm" data-action="reject" data-id="${s.id}">Reject</button>
      </div>
    </div>
  `;
}

function bindActions() {
  pendingList.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      btn.disabled = true;
      try {
        await api('/api/admin/approve', {
          method: 'POST',
          body: JSON.stringify({ id, action }),
        });
        toast(`Script ${action}d`, 'ok');
        await loadPending();
        await loadStats();
      } catch (err) {
        toast(err.message, 'err');
        btn.disabled = false;
      }
    });
  });
}

async function loadReleases() {
  releaseList.innerHTML = `<div class="empty">Loading…</div>`;
  try {
    const data = await api('/api/admin/releases');
    releases = data.releases || [];
    if (!releases.length) {
      releaseList.innerHTML = `<div class="empty">No releases yet.</div>`;
      return;
    }
    releaseList.innerHTML = releases.map((r) => `
      <div class="admin-item">
        <h4>v${escapeHtml(r.version)} <span class="role-pill">${escapeHtml(r.channel || 'stable')}</span></h4>
        <div class="meta">
          <span>${new Date(r.releasedAt || r.released_at).toLocaleString()}</span>
          <span>by ${escapeHtml(r.publishedBy || r.published_by || '—')}</span>
          <span>${(r.files || []).length} file(s)</span>
        </div>
        <div class="desc mono" style="font-size:11px">${escapeHtml(r.sha256 || 'no hash')}</div>
      </div>
    `).join('');
  } catch (err) {
    releaseList.innerHTML = `<div class="empty">Failed: ${err.message}</div>`;
  }
}

async function loadStats() {
  try {
    const [pend, rel] = await Promise.all([
      api('/api/admin/pending'),
      api('/api/admin/releases'),
    ]);
    document.getElementById('stat-pending').textContent = (pend.items || []).length;
    document.getElementById('stat-total').textContent = (rel.releases || []).length;
    document.getElementById('stat-latest').textContent = rel.releases?.[0]?.version || '—';
  } catch (_) {}
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
  });
});

document.getElementById('publish-btn').addEventListener('click', async () => {
  const version = document.getElementById('rel-version').value.trim();
  const channel = document.getElementById('rel-channel').value;
  const platforms = document.getElementById('rel-platforms').value
    .split(',').map((s) => s.trim()).filter(Boolean);
  const size = document.getElementById('rel-size').value.trim();
  const sha256 = document.getElementById('rel-sha').value.trim();
  const url = document.getElementById('rel-url').value.trim();
  const label = document.getElementById('rel-label').value.trim() || 'Download';
  const changelogRaw = document.getElementById('rel-changelog').value.trim();

  const status = document.getElementById('publish-status');

  if (!version || !url) {
    status.textContent = 'Version and download URL are required.';
    status.style.color = 'var(--red)';
    return;
  }

  const changelog = parseChangelog(changelogRaw);

  status.textContent = 'Publishing…';
  status.style.color = 'var(--muted)';

  try {
    await api('/api/admin/releases', {
      method: 'POST',
      body: JSON.stringify({
        version,
        channel,
        platforms: platforms.length ? platforms : ['Android'],
        files: [{ label, url }],
        sha256,
        size,
        changelog,
      }),
    });
    status.textContent = `Published v${version}.`;
    status.style.color = 'var(--green)';
    toast(`Release v${version} published`, 'ok');
    document.getElementById('rel-version').value = '';
    document.getElementById('rel-url').value = '';
    document.getElementById('rel-sha').value = '';
    document.getElementById('rel-size').value = '';
    document.getElementById('rel-changelog').value = '';
    await loadReleases();
    await loadStats();
  } catch (err) {
    status.textContent = `Failed: ${err.message}`;
    status.style.color = 'var(--red)';
  }
});

function parseChangelog(text) {
  if (!text) return null;
  const out = { new: [], improve: [], fix: [], break: [] };
  const keyMap = { new: 'new', improve: 'improve', fix: 'fix', break: 'break', breaking: 'break' };
  let current = 'new';
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const sec = t.match(/^section:(\w+)/i);
    if (sec) {
      current = keyMap[sec[1].toLowerCase()] || 'new';
      continue;
    }
    out[current].push(t.replace(/^[-*]\s*/, ''));
  }
  return Object.values(out).some((arr) => arr.length) ? out : null;
}

boot();
