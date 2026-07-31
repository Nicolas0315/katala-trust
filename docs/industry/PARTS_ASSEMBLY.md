# Parts Assembly — Verification Sidecar (OSS cut)

Retrieved: 2026-07-31

## Goal

Ship a public, measurable subset of Katala as an **independent verification sidecar**.
Private monorepo remains the R&D home; this cut is what outsiders can run and trust.

## Assembled parts (v1)

| # | Part | Code | Why now |
| --- | --- | --- | --- |
| 1 | Think contract CLI | `packages/katala/gateway/katala-think.mjs` + `katalaThinkContract.mjs` | Host-agnostic stdin/stdout verification |
| 2 | Trust + consensus engines | `packages/katala/core/TrustScorer.ts`, `ConsensusEngine.ts` | Lab-neutral trust axes |
| 3 | Mediation + synergy | `MediationService.ts`, `LocalMediationManager.ts`, `SynergyEngine.ts` | A2A negotiation before reveal |
| 4 | Gateway policy + HTTP bridge | `AgentGatewayPolicy.ts`, `KatalaClawGateway.ts`, `IntakeRouter.ts` | Peer auth + HITL objects |
| 5 | Immutable ledger + board | `ImmutableLedger.ts`, `KatalaBulletinBoard.ts` | Audit trail for resolved mediation |

## Explicitly out of v1 public cut

- `Labyrinth_*`, `inf-Coding`, `runs/`, `spectrograms/`, `output/`
- Fleet sync scripts / machine-specific verification docs
- Dormant Next.js frontend (`src/app`) until dependencies are promoted intentionally
- Trading experiments, Discord session dumps, personal path docs

## Measurement instruments (must stay green)

```bash
npm test -- --run
npm run typecheck:katala
npm run verify:gateway
npm run verify:local
```

Gateway coverage added 2026-07-31:

- `KatalaClawGateway.test.ts` — health, auth fail-closed, mediate OK/422
- `IntakeRouter.test.ts` — reject / short-circuit / full pipeline
- `LocalMediationManager.test.ts` — mediate + Tailscale range check

## Host embedding shape

```text
Host agent
  -> sanitize context (provenance/visibility/ttl)
  -> katala:think (stateless)
  -> human approval if required
  -> host executor (shell/git/network)
```

Katala never owns host memory or execution by default.
