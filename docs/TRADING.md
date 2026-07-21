# Trading

Navo's trading stack follows [Polymarket's official builder documentation](https://docs.polymarket.com) for V2 collateral (pUSD), Gnosis Safe wallets, and CLOB order attribution.

## Wallet Model

| Wallet | Role |
|--------|------|
| **Privy embedded EOA** | User's signing identity; holds USDC.e for deposits |
| **Gnosis Safe (derived)** | Polymarket trading wallet; holds pUSD collateral |
| **CLOB API key** | Per-user order credentials; stored in `localStorage` |

Signature type: `POLY_GNOSIS_SAFE` (type 2).

## Enable Trading Flow

1. User taps **Enable Trading** → `initializeTradingSession()`
2. `RelayClient` connects with `RemoteBuilderConfig` (wallet-signed HMAC)
3. Check Safe deployment at `deriveSafeAddress(eoa)` — deploy if missing
4. `ClobClient.createOrDeriveApiKey()` for user CLOB credentials
5. `checkAllApprovals(safe)` — if false, relay approval batch:
   - pUSD approvals for CTF Exchange V2, Neg Risk Exchange V2, adapters
   - CTF outcome token approvals
6. Session saved: `{ version, eoaAddress, safeAddress, apiCredentials, ready }`

## Funding

```
Privy fundWallet() → USDC.e on EOA
        │
        ▼
transferToSafe(): EOA → Safe (USDC.e transfer)
        │
        ▼
CollateralOnramp.wrap() → pUSD in Safe
```

Withdraw reverses via `CollateralOfframp.unwrap()` and optional EOA transfer.

Minimum practical order: ~$5 (CLOB min size ~5 shares).

## Order Placement

```typescript
// Preflight (order-preflight.ts)
checkTradingAllowed()   // geoblock — fail-open on network error
resolveOrderOptions()   // tick size, neg risk from CLOB
validateOrderSize()     // min shares / notional

// Submit
client.postOrder(signedOrder, OrderType.GTC | FOK)
```

Builder code attached via `VITE_POLYMARKET_BUILDER_CODE` on `ClobClient`.

## Sign Server Contract

**Request** (POST `/api/polymarket/sign`):

```json
{
  "method": "POST",
  "path": "/submit",
  "body": { "...": "..." },
  "address": "0x...",
  "authTimestamp": 1710000000,
  "authSignature": "0x..."
}
```

**Response**:

```json
{
  "POLY_BUILDER_SIGNATURE": "...",
  "POLY_BUILDER_TIMESTAMP": "...",
  "POLY_BUILDER_API_KEY": "...",
  "POLY_BUILDER_PASSPHRASE": "..."
}
```

Allowed paths: `/nonce`, `/relay-payload`, `/transaction`, `/transactions`, `/submit`, `/deployed`.

## Session Lifecycle

| Event | Action |
|-------|--------|
| Login | Load session from `localStorage` if version matches |
| Logout | `clearTradingSession(eoa)`, reset in-memory clients |
| Version mismatch | Auto-clear stale session; user re-enables trading |
| Safe revert | User must re-run Enable Trading |

## Production Checklist

- [ ] Builder credentials in **server** env only
- [ ] `VITE_POLYMARKET_BUILDER_CODE` set for order attribution
- [ ] Sign server health returns `{ configured: true }`
- [ ] User completes: Deposit → Move to Trading Wallet → Place order
- [ ] Test cancel open limit order from Portfolio
