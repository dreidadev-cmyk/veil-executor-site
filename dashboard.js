'use strict';
import { api, toast, fmtDate } from './app.js';

const loading = document.getElementById('loading');
const content = document.getElementById('content');

async function load() {
  try {
    const me = await api('/api/auth/me');
    if (!me?.user) {
      location.href = 'login.html';
      return;
    }
    const u = me.user;
    document.getElementById('pfp').src = u.avatar;
    document.getElementById('pname').textContent = u.username;
    document.getElementById('pid').textContent = u.id;
    document.getElementById('prole').textContent = u.role || 'member';
    document.getElementById('stat-scripts').textContent = u.stats?.submitted ?? 0;
    document.getElementById('stat-runs').textContent = u.stats?.runs ?? 0;
    document.getElementById('stat-favs').textContent = u.stats?.favorites ?? 0;
    
    const navAuth = document.getElementById('nav-auth');
    navAuth.innerHTML = `<img class="nav-avatar" src="${u.avatar}" alt="" /><span style="margin-left:8px">${u.username}</span>`;
    
    const subs = await api('/api/scripts/mine');
    const listEl = document.getElementById('my-scripts');
    if (!subs.items?.length) {
      listEl.innerHTML = `<div class="muted">No submissions yet.</div>`;
    } else {
      listEl.innerHTML = subs.items.map((s) => `
        <div class="my-item">
          <div>
            <div class="title">${s.title}</div>
            <div class="date">${fmtDate(s.createdAt)}</div>
          </div>
          <span class="status-pill status-${s.status}">${s.status}</span>
        </div>
      `).join('');
    }
    
    loading.classList.add('hidden');
    content.classList.remove('hidden');
  } catch (err) {
    if (err.status === 401) {
      location.href = 'login.html';
      return;
    }
    loading.textContent = `Error: ${err.message}`;
  }
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', { method: 'POST' });
    toast('Logged out');
    setTimeout(() => location.href = 'index.html', 400);
  } catch (err) {
    toast(err.message, 'err');
  }
});

load();