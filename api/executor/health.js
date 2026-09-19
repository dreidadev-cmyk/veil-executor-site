'use strict';

const SERVICES = [
  { id: 'api',     name: 'Veil API',        url: 'https://veil-executor.vercel.app/api/executor/latest' },
  { id: 'auth',    name: 'Auth Service',    url: 'https://discord.com/api/v10/gateway' },
  { id: 'cdn',     name: 'Download CDN',    url: 'https://veil-executor.vercel.app/downloads/' },
];

const TIMEOUT_MS = 4500;
const DEGRADED_MS = 1500;

async function pingOne(svc) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(svc.url, { method: 'HEAD', signal: controller.signal });
    const latency = Date.now() - start;
    const ok = res.status < 500;
    const status = !ok ? 'down' : (latency > DEGRADED_MS ? 'degraded' : 'operational');
    return { id: svc.id, name: svc.name, status, latency, httpStatus: res.status };
  } catch (err) {
    return {
      id: svc.id, name: svc.name, status: 'down', latency: Date.now() - start,
      error: err.name === 'AbortError' ? 'timeout' : err.message,
    };
  } finally { clearTimeout(timer); }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const startedAt = Date.now();
  const results = await Promise.all(SERVICES.map(pingOne));
  const down = results.filter((r) => r.status === 'down').length;
  const degraded = results.filter((r) => r.status === 'degraded').length;
  const overall = down === results.length ? 'down' : (down || degraded ? 'degraded' : 'operational');
  res.json({
    overall,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    services: results,
  });
}
