import http from 'node:http';
import {
  buildHmacSignature,
  getBuilderCreds,
  missingCreds,
  safeErrorMessage,
  validateSignRequest,
} from '../api/_lib/sign-utils.js';

const PORT = Number(process.env.SIGN_PORT ?? process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '0.0.0.0';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function corsOrigin(req) {
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return ALLOWED_ORIGINS[0] ?? 'null';
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url?.split('?')[0];

  if (req.method === 'GET' && url === '/health') {
    json(res, 200, { configured: !missingCreds(), service: 'navo-sign', version: '1.1.0' });
    return;
  }

  if (req.method !== 'POST' || url !== '/sign') {
    json(res, 404, { error: 'Not found' });
    return;
  }

  if (missingCreds()) {
    json(res, 503, { error: 'Builder credentials not configured' });
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  try {
    const payload = JSON.parse(body);
    const validation = await validateSignRequest(req, payload);
    if (!validation.ok) {
      json(res, validation.status, { error: validation.error });
      return;
    }

    const creds = getBuilderCreds();
    const { method, path, body: requestBody } = validation;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = buildHmacSignature(creds.secret, timestamp, method, path, requestBody);

    json(res, 200, {
      POLY_BUILDER_SIGNATURE: signature,
      POLY_BUILDER_TIMESTAMP: String(timestamp),
      POLY_BUILDER_API_KEY: creds.key,
      POLY_BUILDER_PASSPHRASE: creds.passphrase,
    });
  } catch (err) {
    json(res, 500, { error: safeErrorMessage(err, 'Sign failed') });
  }
});

server.listen(PORT, HOST, () => {
  const status = missingCreds() ? 'builder creds missing' : 'ready';
  console.log(`Navo sign server on http://${HOST}:${PORT} (${status})`);
  if (!ALLOWED_ORIGINS.includes('*')) {
    console.log(`CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
  }
});
