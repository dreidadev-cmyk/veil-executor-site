'use strict';
import crypto from 'crypto';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT = process.env.DISCORD_REDIRECT_URI
  || 'https://veil-executor.vercel.app/api/auth/callback';

export default async function handler(req, res) {
  const { code, state } = req.query;
  const cookieState = (req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('veil_oauth_state='))
    ?.split('=')[1];

  if (!code || !state || state !== cookieState) {
    return res.status(400).send('Invalid OAuth state');
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT,
  });

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!tokenRes.ok) return res.status(401).send('Token exchange failed');
  const tokens = await tokenRes.json();

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) return res.status(401).send('User fetch failed');
  const user = await userRes.json();

  const session = {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/0.png`,
    role: 'member',
    issuedAt: Date.now(),
  };

  const token = signSession(session, process.env.SESSION_SECRET);

  res.setHeader('Set-Cookie', [
    'veil_oauth_state=; Path=/; Max-Age=0',
    `veil_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
  ]);

  res.redirect(302, '/dashboard.html');
}

function signSession(obj, secret) {
  if (!secret) throw new Error('SESSION_SECRET missing');
  const payload = Buffer.from(JSON.stringify(obj)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}
