# Architecture

This document describes Navo's system design, module boundaries, and data flows at an engineering level.

## System Context

Navo is a **client-only application** (plus a minimal sign server) that interfaces with Polymarket's public APIs. It does not operate proprietary market infrastructure — it orchestrates user wallets, Polymarket's relayer, and the CLOB.

```
┌─────────────────────────────────────────────────────────────┐
│                        Navo Client                          │
│  React UI ─ AppContext ─ ApiClient ─ Trading Module         │
└───────────┬───────────────────────────────┬─────────────────┘
            │                               │
     Privy Auth                        Sign Server
            │                               │
            ▼                               ▼
     Embedded EOA                   Builder HMAC
            │                               │
            └───────────┬───────────────────┘
                        ▼
              Polymarket Relayer → Gnosis Safe
                        │
                        ▼
                   CLOB V2 (orders)
```

## Layer Responsibilities

### Presentation (`src/screens/`, `src/components/`)

- **Screens** — route-level views bound to `AppContext` tab/phase state.
- **Components** — reusable UI; iOS controls live under `components/ios/`.
- **No direct API calls** — screens dispatch actions or call hooks that delegate to `ApiClient`.

### State (`src/store/AppContext.tsx`)

Global reducer managing:

| Domain | State keys |
|--------|------------|
| Navigation | `phase`, `tab`, `selectedId`, `settingsOpen` |
| Markets | `markets`, `activeCategory`, `searchQuery`, `watchlist` |
| Trading | `ticket`, `cashOutOpen`, `ordering`, `amount` |
| Portfolio | `positions`, `orders`, `openOrders`, `cash` |
| System | `toast`, loading flags, error strings |

Persistence: watchlist and theme preference in `localStorage`; trading session in `navo-trading-{eoa}`.

### Service Layer (`src/api/`)

#### `client.ts` — `PolymarketApiClient`

Single facade implementing `ApiClient`. Responsibilities:

- Market catalog fetch and cache merge
- Order placement with preflight
- Portfolio sync (Data API + on-chain balance)
- Trading session bootstrap (`setupTrading`)
- Builder health probe

#### `polymarket.ts`

Pure mapping functions from Gamma/CLOB/Data API responses to domain types (`Market`, `OrderBook`, etc.).

#### `trading/`

| Module | Role |
|--------|------|
| `session.ts` | Safe deploy, CLOB key derivation, session persistence |
| `transfer.ts` | USDC.e → Safe → pUSD wrap; reverse for withdraw |
| `approvals.ts` | pUSD + CTF approval batches for V2 exchanges |
| `order-preflight.ts` | Geoblock, tick size, neg-risk, min order size |
| `remote-builder-config.ts` | Browser-safe remote HMAC via sign server |
| `sign-auth.ts` | EIP-191 wallet signatures for sign requests |
| `constants.ts` | Contract addresses, API URLs, `SESSION_VERSION` |

### Authentication (`src/auth/`)

`AuthProvider` wraps Privy and exposes:

- `login()` / `openSignIn()` — branded SignInSheet
- `getWalletClient()` — viem client for embedded wallet
- `buildProfileForAddress()` — user profile assembly
- `waitForWalletProfile()` — post-OAuth wallet polling (15s)

Bridge pattern: `auth-bridge.ts` allows `ApiClient` to access auth without React coupling.

### Sign Server (`api/` + `server/sign.mjs`)

Serverless (Vercel) and standalone (Node) implementations share logic via `api/_lib/`:

- `security.js` — CORS, rate limit, path allowlist
- `wallet-auth.js` — viem `verifyMessage` for EIP-191
- `sign-utils.js` — HMAC signature generation

## Market Feed Pipeline

```
Gamma Events API (active=true)
        │
        ▼
  marketFeed.ts filters
  · past endDate
  · enableOrderBook
  · resolved threshold (Yes ≥ 98%)
        │
        ▼
  buildMarketFeed(category)
        │
        ▼
  AppContext MERGE_MARKETS
        │
        ▼
  ws-prices.ts (live midpoints)
```

## Error Handling

- API errors surface as `marketsError`, `portfolioError` in state.
- `ErrorState` component with retry actions.
- `ErrorBoundary` at root catches React render failures.
- Sign server returns generic messages in production.

## Versioning & Migration

| Constant | Purpose |
|----------|---------|
| `SESSION_VERSION = 3` | Gnosis Safe session schema |
| Legacy `foresight-trading-*` keys | Migrated to `navo-trading-*` on read |

Breaking session changes increment `SESSION_VERSION` and clear stale localStorage entries.
