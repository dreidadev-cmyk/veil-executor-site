'use strict';
import crypto from 'crypto';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const REDIRECT = process.env.DISCORD_REDIRECT_URI
  || 'https://veil-executor.vercel.app/api/auth/callback';

export default function handler(req, res) {
  if (!CLIENT_ID) {
    return res.status(500).send('DISCORD_CLIENT_ID not configured');
  }

  const state = crypto.randomUUID();
  res.setHeader(
    'Set-Cookie',
    `veil_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  );

  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'consent');

  res.redirect(302, url.toString());
}
