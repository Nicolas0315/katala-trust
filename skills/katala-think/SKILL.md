---
name: katala-think
description: Before side-effecting actions (write, shell, network, merge, deploy), call the Katala trust/think sidecar and honor allow/block/ask-human.
---

# katala-think (OpenClaw / host skill)

Use this skill when the host is about to take a **side effect** or when the user asks to verify / trust-score a claim bundle.

## Contract

1. Build tool args (`goal`, optional `mode`, `context` or `context_items`).
2. Map with `toolArgsToThinkRequest` from `packages/katala/gateway/openClawToolAdapter.mjs`.
3. Prefer `npm run katala:think-host` (sanitize → think → decide; exit 0/2/3).
4. Or call `katala:think` then `decideHostAction` yourself.
5. Enforce:
   - `allow` (exit 0) → proceed
   - `ask-human` (exit 2) → stop for operator approval
   - `block` (exit 3) → refuse the side effect

Never let Katala write host memory or run shell itself. Sidecar stays read-only.
Call `sanitizeThinkRequest` so PRIVATE/IGNORE items never leave the host.

## Minimal invoke

```bash
node examples/blocked-write-demo.mjs
node examples/think-host-cli-smoke.mjs
npm run katala:think-host
```

## Install into local OpenClaw skills (operator)

OpenClaw **rejects junction/symlink skills** that resolve outside the skills root
(`symlink-escape`). **Copy** the skill directory (do not `mklink`):

```bat
mkdir "%USERPROFILE%\.openclaw\skills\katala-think"
copy /Y "%CD%\skills\katala-think\SKILL.md" "%USERPROFILE%\.openclaw\skills\katala-think\SKILL.md"
openclaw skills info katala-think
```

Expected: `Source: openclaw-managed`, `Visible to model: yes`, `Ready`.

Do not put tokens into the skill folder. Keep the katala-trust checkout path for the CLI.

## Fail closed

If the sidecar is missing, times out, or returns unparseable JSON → treat as `ask-human`.
