# Contributing to Katala Trust

## Setup

```bash
git clone https://github.com/Nicolas0315/katala-trust.git
cd katala-trust
npm install
npm run verify:local
```

## Rules

- Keep the surface lab-neutral and fail-closed by default.
- Do not add private monorepo trees (Labyrinth, fleet runtimes, Discord dumps).
- Prefer tests in `packages/katala/**/*.test.ts` for behavior changes.
- Gateway peer auth requires a bearer token unless `KATALA_GATEWAY_ALLOW_TAILNET_ONLY=1`.
