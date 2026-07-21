# Navo — Production Deployment

> **See also:** [README.md](./README.md) · [SECURITY.md](./SECURITY.md) · [docs/TRADING.md](./docs/TRADING.md)

Operational runbook for deploying Navo to production.

## Deployment topology

| Service | What | How |
|---------|------|-----|
| **Frontend (PWA)** | Vite static app (`dist/`) | Vercel, Netlify, Cloudflare Pages |
| **Sign server** | `server/sign.mjs` — builder HMAC | Railway, Fly.io, Render, any Node host |

The sign server **must** be deployed separately. The Vite dev proxy does not run in production.

---

## 0. Privy + Sign in with Apple (required)

1. Create an app at [dashboard.privy.io](https://dashboard.privy.io)
2. Enable login methods: **Email**, **Google**, **Apple**, **Wallet**
3. For Apple:
   - Follow Privy’s Apple setup (Services ID + return URL)
   - Or use Privy’s managed Apple if offered on your plan
4. **Allowed origins**: add `http://localhost:5173` and your production URL (e.g. `https://navo.vercel.app`)
5. Copy the **App ID** into `VITE_PRIVY_APP_ID` (never put the Privy secret in `VITE_*`)

Without step 4, Apple/Google OAuth redirects fail on mobile Safari and installed PWAs.

---

## 1. Deploy sign server

### Environment variables

```env
POLYMARKET_BUILDER_API_KEY=
POLYMARKET_BUILDER_SECRET=          # or POLYMARKET_BUILDER_API_SECRET
POLYMARKET_BUILDER_PASSPHRASE=
SIGN_PORT=8787
HOST=0.0.0.0
ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com
```

### Docker

```bash
docker build -f Dockerfile.sign -t navo-sign .
docker run -p 8787:8787 --env-file .env.local navo-sign
curl http://localhost:8787/health
# → {"configured":true,"service":"navo-sign"}
```

### Railway / Fly

See `railway.sign.toml` / `fly.sign.toml`. Set the same env vars, then deploy.

---

## 2. Deploy frontend (PWA)

```env
# Vercel / Netlify / .env.production
VITE_PRIVY_APP_ID=...
VITE_POLYMARKET_SIGN_URL=https://navo-sign.example.com/sign
VITE_POLYMARKET_BUILDER_HEALTH_URL=https://navo-sign.example.com/health
```

```bash
npm run build
# Output: dist/  (includes sw.js + manifest for Add to Home Screen)
```

### Vercel

- Build: `npm run build`
- Output: `dist`
- `vercel.json` is included (SPA rewrites + SW headers)

---

## 3. Add to Home Screen (mobile)

### iPhone (Safari)

1. Open the HTTPS site in Safari
2. Tap **Share** → **Add to Home Screen**
3. Open **Navo** from the home screen (standalone, no browser chrome)
4. Sign in with **Apple** (or Google / email)

### Android (Chrome)

1. Open the site → tap **Install** when prompted (or menu → Install app)
2. Or use the in-app Install banner

Icons are PNG (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, maskable). Service worker caches the app shell for offline browsing of markets.

---

## 4. Verify end-to-end

1. Landing → Sign in with Apple → lands in Markets
2. Markets load live prices from Polymarket
3. Profile → Enable trading (sign server health must be `configured: true`)
4. Deposit (Privy fund) → Move to trading wallet → place a small order
5. Install PWA → reopen → still signed in / markets work offline (cached)

---

## 5. Capacitor native (App Store / Play Store)

Android project is generated (`android/`). iOS needs CocoaPods once:

```bash
brew install cocoapods   # once
npx cap add ios
npm run cap:ios          # build + open Xcode
npm run cap:android      # build + open Android Studio
```

Set production `VITE_*` env vars before `npm run build` / `cap:sync`.

| Feature | Plugin |
|---------|--------|
| Push | `@capacitor/push-notifications` |
| Face ID | `@capgo/capacitor-native-biometric` (optional) |

Web PWA remains the primary mobile path; native is for store distribution.


## 6. CI

`.github/workflows/ci.yml` — `npm test`, `npm run build`, sign-server `/health`.
