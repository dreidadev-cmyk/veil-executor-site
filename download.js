'use strict';
import { api, fmtBytes, fmtDate, toast } from './app.js';

const latestEl = document.getElementById('latest-release');
const listEl = document.getElementById('release-list');
const verifyVersion = document.getElementById('verify-version');
const verifyInput = document.getElementById('verify-hash');
const verifyBtn = document.getElementById('verify-btn');
const verifyRes = document.getElementById('verify-result');

let releases = [];

function renderLatest(rel) {
  latestEl.innerHTML = `
    <div class="row-between">
      <div>
        <h2>Veil Executor <span class="accent">v${rel.version}</span></h2>
        <div class="muted">Released ${fmtDate(rel.releasedAt)}</div>
      </div>
      ${rel.channel ? `<span class="badge">${rel.channel}</span>` : ''}
    </div>
    <div class="release-meta">
      <span>📦 <strong>${fmtBytes(rel.size)}</strong></span>
      <span>🤖 <strong>${rel.platforms?.join(', ') || 'Android'}</strong></span>
      <span>🆓 <strong>Free</strong></span>
    </div>
    <div class="release-actions">
      ${(rel.files || []).map((f) => `
        <a class="btn btn-primary btn-lg" href="${f.url}" download>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 3v13m0 0l-5-5m5 5l5-5M4 21h16"/></svg>
          ${f.label}
        </a>
      `).join('')}
    </div>
    <div class="release-hash">
      <strong>SHA-256</strong> · ${rel.sha256 || '—'}
    </div>
  `;
}

function renderList(items) {
  if (!items.length) {
    listEl.innerHTML = `<div class="muted">No previous releases.</div>`;
    return;
  }
  listEl.innerHTML = items.map((r) => `
    <div class="release-item">
      <div>
        <div class="ver">v${r.version} <small>${fmtDate(r.releasedAt)}</small></div>
      </div>
      <div class="row">
        <a href="changelog.html#v${r.version}" class="changelog-link">changelog</a>
        ${(r.files || []).map((f) => `
          <a class="btn btn-ghost btn-sm" href="${f.url}" download>${f.label}</a>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function fillVerifySelect(items) {
  verifyVersion.innerHTML = items.map((r) => `<option value="${r.version}">v${r.version}</option>`).join('');
}

async function load() {
  try {
    const data = await api('/api/executor/releases');
    releases = data.releases || [];
    if (!releases.length) {
      latestEl.innerHTML = `<div class="muted">No releases published yet.</div>`;
      return;
    }
    const latest = releases[0];
    renderLatest(latest);
    renderList(releases.slice(1));
    fillVerifySelect(releases);
  } catch (err) {
    latestEl.innerHTML = `<div class="muted">Failed to load releases: ${err.message}</div>`;
  }
}

verifyBtn.addEventListener('click', () => {
  const hash = (verifyInput.value || '').trim().toLowerCase();
  const ver = verifyVersion.value;
  const rel = releases.find((r) => String(r.version) === String(ver));
  verifyRes.innerHTML = '';
  if (!rel) {
    verifyRes.innerHTML = `<div class="verify-fail">Unknown version.</div>`;
    return;
  }
  if (!hash) {
    verifyRes.innerHTML = `<div class="verify-fail">Paste a hash first.</div>`;
    return;
  }
  if (hash === (rel.sha256 || '').toLowerCase()) {
    verifyRes.innerHTML = `<div class="verify-ok">✓ Match — this is the official v${rel.version} release.</div>`;
  } else {
    verifyRes.innerHTML = `<div class="verify-fail">✗ Mismatch — expected <code>${rel.sha256}</code>. Do not install.</div>`;
  }
});

load();