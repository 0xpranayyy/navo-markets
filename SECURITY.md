# Security Policy

Navo handles user wallets, trading credentials, and builder API access. This document defines the security model and operational requirements.

## Threat Model Summary

| Asset | Risk | Mitigation |
|-------|------|------------|
| Builder HMAC secret | Full relayer impersonation | Server-only storage; never in client bundle |
| Sign endpoint abuse | Unauthorized builder signatures | Wallet EIP-191 auth, path allowlist, CORS, rate limit |
| CLOB API credentials | Order placement as user | Device-local storage; cleared on logout |
| Privy session | Account takeover | Privy-managed auth; HTTPS only |
| XSS | Credential exfiltration | No `dangerouslySetInnerHTML`; CSP-friendly patterns |

## Secret Classification

| Secret | Where it lives | Exposed to browser? |
|--------|----------------|---------------------|
| Polymarket builder HMAC secret | Vercel/Railway env (`POLYMARKET_BUILDER_SECRET`) | **Never** |
| Builder API key + passphrase | Returned from `/api/polymarket/sign` after wallet auth | Yes, but gated |
| CLOB user API credentials | `localStorage` per wallet (Polymarket standard) | Device-local only |
| Privy app ID | `VITE_PRIVY_APP_ID` | Public (expected) |
| Builder attribution code | `VITE_POLYMARKET_BUILDER_CODE` | Public (expected) |

## Sign Server Protections

The `/api/polymarket/sign` endpoint implements defense in depth:

1. **Wallet authorization** — EIP-191 signature over `{address, timestamp, method, path}` (domain: `navo.markets`)
2. **Path allowlist** — only Polymarket relayer paths (`/submit`, `/deployed`, `/nonce`, etc.)
3. **CORS lockdown** — production allows Navo origins only (no wildcard)
4. **Rate limiting** — 40 requests/minute per IP (best-effort on serverless)
5. **Safe errors** — no stack traces in production responses
6. **Auth expiry** — signatures valid for 300 seconds (`SIGN_AUTH_MAX_AGE_SEC`)

## HTTP Security Headers

Configured in `vercel.json`:

- `Strict-Transport-Security` — HSTS with preload
- `X-Frame-Options: DENY` — clickjacking protection
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — restricted camera/mic/geo
- API routes: `Cache-Control: no-store`

## User Data Handling

- **Logout** clears CLOB API credentials from `localStorage` and resets in-memory clients
- **No analytics** or third-party trackers beyond Privy auth and Polymarket APIs
- Wallet addresses displayed truncated; full address copy is user-initiated
- Watchlist and theme preferences stored locally only

## Production Deployment Checklist

- [ ] Set `POLYMARKET_BUILDER_*` only in Vercel **server** env (never `VITE_` prefix)
- [ ] Set `ALLOWED_ORIGINS` to your production domain(s)
- [ ] Keep `SIGN_REQUIRE_WALLET_AUTH=true`
- [ ] Never commit `.env.local` or `.env.production`
- [ ] Rotate builder credentials if ever exposed in chat, logs, or commits
- [ ] Verify Privy allowed origins include production URL
- [ ] Confirm sign health: `GET /api/polymarket/health` → `{ configured: true }`

## Incident Response

1. **Rotate** affected Polymarket builder credentials immediately
2. **Restrict** `ALLOWED_ORIGINS` if CORS abuse suspected
3. **Review** Vercel/Railway access logs for anomalous `/sign` traffic
4. **Force** user re-authentication by incrementing `SESSION_VERSION` if session schema compromised

## Reporting

If you discover a vulnerability, do not open a public issue. Rotate affected credentials immediately and restrict `ALLOWED_ORIGINS` while investigating.
