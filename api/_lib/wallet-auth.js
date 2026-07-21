import { verifyMessage } from 'viem';

export const SIGN_AUTH_DOMAIN = 'navo.markets';

export function buildSignAuthMessage(address, authTimestamp, method, path) {
  return `${SIGN_AUTH_DOMAIN} wants you to authorize a builder sign request.\n\nAddress: ${address}\nTimestamp: ${authTimestamp}\nMethod: ${method.toUpperCase()}\nPath: ${path}`;
}

function isAddress(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function verifyWalletAuth({
  address,
  authTimestamp,
  authSignature,
  method,
  path,
  maxAgeSec,
}) {
  if (!isAddress(address)) return { ok: false, reason: 'invalid address' };
  if (typeof authSignature !== 'string' || !authSignature.startsWith('0x')) {
    return { ok: false, reason: 'invalid signature' };
  }
  const ts = Number(authTimestamp);
  if (!Number.isFinite(ts) || ts <= 0) return { ok: false, reason: 'invalid timestamp' };

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > maxAgeSec) return { ok: false, reason: 'auth expired' };

  const message = buildSignAuthMessage(address, ts, method, path);
  let valid = false;
  try {
    valid = await verifyMessage({
      address,
      message,
      signature: authSignature,
    });
  } catch {
    valid = false;
  }

  return valid ? { ok: true } : { ok: false, reason: 'signature mismatch' };
}
