# Adjacent tooling notes — 2026-08-01

Written: 2026-08-01 overnight (local synthesis; verify against vendor docs before product claims)

## How Katala differs from common “guardrail” stacks

| Family | Typical role | Overlap with Katala | Gap Katala still owns |
| --- | --- | --- | --- |
| Prompt/output filters (Guardrails-style validators) | Schema / topic / toxicity checks on strings | Claim-ish rejection | Multi-axis trust + consensus + host approval decision |
| Policy engines inside one lab | Model Spec / Constitutional self-governance | Safety intent | Lab-neutral sidecar beside any host |
| Agent frameworks tool ACL | Allow/deny tool names | Capability bounds | Provenance-graded context + human escalation on deadlock |

## Practical embed chain (current OSS)

1. `sanitizeThinkRequest` — drop PRIVATE/IGNORE
2. `toolArgsToThinkRequest` — host tool → contract
3. `katala:think` — verification block
4. `decideHostAction` — allow / block / ask-human
5. Host enforces; Katala never executes

## Operator backlog after 09:00

- Junction `skills/katala-think` into `~/.openclaw/skills` (explicit)
- One live blocked-write log from a real OpenClaw session
- Optional: expand eval only when scoring rules change
