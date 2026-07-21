import { createHmac } from 'node:crypto';
import {
  AUTH_MAX_AGE_SEC,
  corsRejected,
  isAllowedMethod,
  isAllowedSignPath,
  rateLimit,
  safeErrorMessage,
  setCors,
  walletAuthRequired,
} from './security.js';
import { verifyWalletAuth } from './wallet-auth.js';

export { setCors, corsRejected, rateLimit, safeErrorMessage, walletAuthRequired, isAllowedMethod, isAllowedSignPath };

export function getBuilderCreds() {
  return {
    key: process.env.POLYMARKET_BUILDER_API_KEY,
    secret: process.env.POLYMARKET_BUILDER_API_SECRET ?? process.env.POLYMARKET_BUILDER_SECRET,
    passphrase: process.env.POLYMARKET_BUILDER_PASSPHRASE,
  };
}

export function missingCreds() {
  const c = getBuilderCreds();
  return !c.key || !c.secret || !c.passphrase;
}

export function buildHmacSignature(secret, timestamp, method, requestPath, body) {
  let message = String(timestamp) + method + requestPath;
  if (body !== undefined) {
    message += typeof body === 'string' ? body : JSON.stringify(body);
  }
  const base64Secret = Buffer.from(secret, 'base64');
  const sig = createHmac('sha256', base64Secret).update(message).digest('base64');
  return sig.replace(/\+/g, '-').replace(/\//g, '_');
}

export async function validateSignRequest(req, payload) {
  if (corsRejected(req)) {
    return { ok: false, status: 403, error: 'Origin not allowed' };
  }
  if (!rateLimit(req)) {
    return { ok: false, status: 429, error: 'Too many requests' };
  }

  const { method, path, body, address, authTimestamp, authSignature } = payload ?? {};
  if (!isAllowedMethod(method)) {
    return { ok: false, status: 400, error: 'Invalid method' };
  }
  if (!isAllowedSignPath(path)) {
    return { ok: false, status: 403, error: 'Path not allowed' };
  }

  if (walletAuthRequired()) {
    if (!address || !authTimestamp || !authSignature) {
      return { ok: false, status: 401, error: 'Wallet authorization required' };
    }
    const auth = await verifyWalletAuth({
      address,
      authTimestamp,
      authSignature,
      method,
      path,
      maxAgeSec: AUTH_MAX_AGE_SEC,
    });
    if (!auth.ok) {
      return { ok: false, status: 401, error: 'Unauthorized' };
    }
  }

  return { ok: true, method: method.toUpperCase(), path, body };
}
