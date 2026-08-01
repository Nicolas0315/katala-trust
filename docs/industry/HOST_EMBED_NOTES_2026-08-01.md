# Host embedding notes — 2026-08-01

Retrieved / updated: 2026-08-01 morning

## Current embed surface

- Contract: `katala:think` stdin/stdout JSON (`katalaThinkContract.mjs`)
- Verification block: axes / grade / consensus / dissent / claim_summaries
- Host tool mapper: `openClawToolAdapter.mjs` (`katala_think` descriptor + `toolArgsToThinkRequest`)
- Host decision helper: `hostApprovalGate.mjs` (`decideHostAction` → allow / block / ask-human)
- Context sanitizer: `contextSanitizer.mjs` (drops PRIVATE/IGNORE)
- Smokes: `host-hook-smoke.mjs`, `openclaw-tool-adapter-smoke.mjs`, `host-decision-matrix.mjs`, `blocked-write-demo.mjs`
- Eval: `evals/trust-claims-v1.jsonl` (30 labeled; runner threshold 0.8)
- Skill: `skills/katala-think/SKILL.md` (junctioned into local OpenClaw skills on 2026-08-01)

## Proven this morning

1. Junction: `~/.openclaw/skills/katala-think` → `katala-trust/skills/katala-think`
2. Blocked-write demo: intended production write → `host_decision=block`, `write_performed=false`
3. PRIVATE context dropped before sidecar (`dropped_private=1`)

## Still open

1. Live OpenClaw process registering `OPENCLAW_KATALA_THINK_TOOL` as a native tool (beyond skill text)
2. Production session IDs / rate limits / timeouts
3. Expanding eval only when scoring rules change

## Measurement posture

Keep Rank-5 green before expanding claim count. Prefer new bands only when scoring rules change.
Do not treat 30/30 as product-market fit — only as non-regression for the current scorer.

## Industry reminder (unchanged thesis)

Producer-side self-eval (Model Spec / Constitutional / Gemini grounding) does not replace a fail-closed external sidecar. Katala stays lab-neutral and memory-less.
