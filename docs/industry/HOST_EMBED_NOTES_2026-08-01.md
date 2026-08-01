# Host embedding notes — 2026-08-01

Retrieved / updated: 2026-08-01 morning

## Current embed surface

- Contract: `katala:think` / `katala:think-host` (exit 0 allow / 2 ask-human / 3 block)
- Verification block: axes / grade / consensus / dissent / claim_summaries
- Adapter / sanitizer / approval gate / smokes / Rank-5 eval as previously shipped
- Skill install: **copy** into `~/.openclaw/skills/katala-think` (junctions are rejected)

## Proven

1. OpenClaw skill Ready (`openclaw-managed`, visible to model) after real file copy
2. Blocked-write demo: intended production write → `host_decision=block`, `write_performed=false`
3. Junction/symlink installs that resolve outside the skills root fail with `symlink-escape`
4. Host CLI exit codes are enforceable by callers (`0/2/3`)
5. Deterministic `examples/agent-turn-preflight.mjs` in CI
6. Live OpenClaw local agent turn ran the preflight via `exec` and returned `host_decision=block` / `write_performed=false`

## Still open

1. Gateway-routed agent turn (non-`--local`) with provider auth on the gateway host
2. Rate limits / timeouts for production sessions
3. Expanding eval only when scoring rules change

## Measurement posture

Keep Rank-5 green before expanding claim count.
