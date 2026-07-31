# Katala Trust Roadmap — 2026-08

Retrieved: 2026-08-01

## Goal (2 weeks)

Make the public claim true: **`katala:think` is a verification sidecar**, not only a capability gate.

## Priority track

| Rank | Work | Done when |
| --- | --- | --- |
| 1 | Wire TrustScorer + local consensus into `katala:think` | Response includes `verification` with axes/grade/dissent; tests green | **done 2026-08-01** |
| 2 | Public CI on `katala-trust` | GitHub Actions runs `npm run verify:local` on PR/push | **done 2026-08-01** |
| 3 | Host embed sample | `examples/host-hook-smoke` calls think and asserts fail-closed + trust fields | **done 2026-08-01** |
| 4 | Narrow OSS core further | Export drops Economic/XAlgorithm/Profiling/IdentityAdoption from public cut | **done 2026-08-01** |
| 5 | Tiny labeled eval set | 20–50 claims → grade distribution reproducible in CI | **done 2026-08-01** (`evals/trust-claims-v1.jsonl`, 30/30 @ 0.8 threshold) |

## Non-goals (parked)

- Next.js / Auth / WebAuthn productization
- ZK / DID / SCS economy
- Multi-LLM live consensus agents (local dual-profile consensus first)

## Verification commands

```bash
# private monorepo
npm run verify:gateway
npm run verify:local

# public cut
cd ../katala-trust && npm run verify:local
```

## Status

- 2026-08-01: Rank 1–5 landed (`thinkTrustBridge.mjs`, host-hook smoke, OSS CI, narrower export, `evals/trust-claims-v1.jsonl`).
- 2026-08-01: OpenClaw tool adapter (`openClawToolAdapter.mjs` + smoke) maps host tool args → `katala:think`.
- Overnight loop until 09:00 JST continues verify/harden/research notes.
- Next after sleep: register adapter against a real OpenClaw/ZeroClaw runtime (not smoke-only).
