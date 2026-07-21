# Contributing

Thank you for contributing to Navo. This guide covers conventions for maintaining code quality and design consistency.

## Development Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

See [README.md](./README.md) for full environment configuration.

## Code Conventions

### TypeScript

- Strict mode enabled — no `any` without justification
- Domain types live in `src/types.ts`
- API mappers return typed domain objects, not raw API shapes

### React

- Functional components only
- Global state via `AppContext` reducer — avoid prop drilling for app-wide data
- API access only through `PolymarketApiClient` / `useApp()` actions

### Styling

- Inline styles matching existing patterns (no CSS modules unless in `styles.css` for globals)
- Use theme tokens from `useTheme()` — never hardcode colors except brand constants in `theme/brand.ts`
- iOS components from `components/ios/controls.tsx` for lists, buttons, search

### Security

- Never commit `.env.local`, `.env.production`, or secrets
- Never prefix server secrets with `VITE_`
- Sign server changes must preserve wallet auth + path allowlist

## Pull Request Checklist

- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] No secrets in diff
- [ ] UI changes follow [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)
- [ ] Trading changes documented if touching `src/api/trading/`

## Commit Messages

Use imperative mood, concise scope:

```
fix: filter resolved markets from Gamma feed
feat: add wallet-signed builder auth to sign endpoint
docs: expand architecture guide
```

## Questions

Open an issue for architectural changes before large refactors.
