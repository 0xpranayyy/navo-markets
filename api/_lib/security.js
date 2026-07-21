/** Relayer paths the builder signer may sign (Polymarket builder-relayer-client). */
const ALLOWED_PATH_PREFIXES = [
  '/nonce',
  '/relay-payload',
  '/transaction',
  '/transactions',
  '/submit',
  '/deployed',
];

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE']);

const rateBuckets = new Map();

export function normalizePath(path) {
  if (typeof path !== 'string' || !path.trim()) return '';
  const trimmed = path.trim();
  const withoutQuery = trimmed.split('?')[0];
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
}

export function isAllowedSignPath(path) {
  const p = normalizePath(path);
  if (!p) return false;
  return ALLOWED_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

export function isAllowedMethod(method) {
  return typeof method === 'string' && ALLOWED_METHODS.has(method.toUpperCase());
}

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

/** Sliding-window rate limit per IP (best-effort on serverless). */
export function rateLimit(req, { max = 40, windowMs = 60_000 } = {}) {
  const ip = clientIp(req);
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.start > windowMs) {
    bucket = { start: now, count: 0 };
    rateBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  if (rateBuckets.size > 5000) {
    for (const [key, b] of rateBuckets) {
      if (now - b.start > windowMs) rateBuckets.delete(key);
    }
  }
  return bucket.count <= max;
}

const DEFAULT_PRODUCTION_ORIGINS = [
  'https://navomarkets.vercel.app',
  'https://navo-neon.vercel.app',
];

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return DEFAULT_PRODUCTION_ORIGINS;
  }
  return ['http://localhost:5173', 'http://127.0.0.1:5173', ...DEFAULT_PRODUCTION_ORIGINS];
}

function isNavoPreviewOrigin(origin) {
  return /^https:\/\/navo[a-z0-9-]*\.vercel\.app$/i.test(origin);
}

export function isOriginAllowed(origin) {
  if (!origin) return false;
  const allowed = parseAllowedOrigins();
  if (allowed.includes('*')) return true;
  if (allowed.includes(origin)) return true;
  if (isNavoPreviewOrigin(origin)) return true;
  return false;
}

export function setCors(res, req) {
  const origin = req.headers.origin;
  const allowed = parseAllowedOrigins();

  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', allowed[0] ?? 'null');
  } else if (allowed.includes('*') || isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export function corsRejected(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  const allowed = parseAllowedOrigins();
  if (allowed.includes('*')) return false;
  return !isOriginAllowed(origin);
}

export function safeErrorMessage(err, fallback = 'Request failed') {
  if (process.env.NODE_ENV === 'development') {
    return err instanceof Error ? err.message : fallback;
  }
  return fallback;
}

export function walletAuthRequired() {
  return process.env.SIGN_REQUIRE_WALLET_AUTH !== 'false';
}

export const AUTH_MAX_AGE_SEC = Number(process.env.SIGN_AUTH_MAX_AGE_SEC ?? 300);
