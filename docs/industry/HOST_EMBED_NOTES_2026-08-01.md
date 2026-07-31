# Host embedding notes — 2026-08-01 overnight

Retrieved / written: 2026-08-01 (overnight loop)

## Current embed surface

- Contract: `katala:think` stdin/stdout JSON (`katalaThinkContract.mjs`)
- Verification block: axes / grade / consensus / dissent / claim_summaries
- Host tool mapper: `openClawToolAdapter.mjs` (`katala_think` descriptor + `toolArgsToThinkRequest`)
- Host decision helper: `hostApprovalGate.mjs` (`decideHostAction` → allow / block / ask-human)
- Smokes: `host-hook-smoke.mjs`, `openclaw-tool-adapter-smoke.mjs`
- Eval: `evals/trust-claims-v1.jsonl` (30 labeled; runner threshold 0.8)

## What is still not “real host”

Smoke proves the adapter shape. It does **not** prove:

1. A live OpenClaw/ZeroClaw process registering the tool
2. Host approval gate wiring `needs-human` → block execution
3. Context sanitizer stripping PRIVATE before export
4. Production session IDs / rate limits / timeouts

Next operator step after 09:00: point one real host config at `OPENCLAW_KATALA_THINK_TOOL` and log one blocked write.

## Local OpenClaw observation (2026-08-01)

- `~/.openclaw/openclaw.json` present; `tools.exec.mode=full` (no Katala tool registered yet).
- Skills dir populated with many skills; **no `katala-think` skill** until operator links `skills/katala-think`.
- Real registration still needs an explicit local symlink/junction — overnight loop does **not** mutate `~/.openclaw` config without operator intent.

## Measurement posture

Keep Rank-5 green before expanding claim count. Prefer new bands only when scoring rules change.
Do not treat 30/30 as product-market fit — only as non-regression for the current scorer.

## Industry reminder (unchanged thesis)

Producer-side self-eval (Model Spec / Constitutional / Gemini grounding) does not replace a fail-closed external sidecar. Katala stays lab-neutral and memory-less.
