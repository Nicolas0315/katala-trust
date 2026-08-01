---
name: katala-think
description: Before side-effecting actions (write, shell, network, merge, deploy), call the Katala trust/think sidecar and honor allow/block/ask-human.
---

# katala-think (OpenClaw / host skill)

Use this skill when the host is about to take a **side effect** or when the user asks to verify / trust-score a claim bundle.

## Contract

1. Build tool args (`goal`, optional `mode`, `context` or `context_items`).
2. Map with `toolArgsToThinkRequest` from `packages/katala/gateway/openClawToolAdapter.mjs`.
3. Pipe JSON to `node packages/katala/gateway/katala-think.mjs` (or `npm run katala:think`).
4. Decide with `decideHostAction` from `packages/katala/gateway/hostApprovalGate.mjs`.
5. Enforce:
   - `allow` → proceed
   - `block` → refuse the side effect
   - `ask-human` → stop for operator approval

Never let Katala write host memory or run shell itself. Sidecar stays read-only.
Call `sanitizeThinkRequest` from `packages/katala/gateway/contextSanitizer.mjs` so PRIVATE/IGNORE items never leave the host.

## Minimal invoke

```bash
node examples/openclaw-tool-adapter-smoke.mjs
node examples/host-hook-smoke.mjs
node examples/blocked-write-demo.mjs
node examples/think-host-cli-smoke.mjs
```

Host exec wrapper (stdin tool args → decision; exit 0/2/3):

```bash
npm run katala:think-host
```

On a Windows host, junction example:

```bat
mklink /J "%USERPROFILE%\.openclaw\skills\katala-think" "%CD%\skills\katala-think"
```

## Install into local OpenClaw skills (operator)

From a checked-out `katala-trust` tree:

```bash
# Windows (Developer Mode / admin symlink as needed)
mklink /J "%USERPROFILE%\.openclaw\skills\katala-think" "%CD%\skills\katala-think"
```

Do not put tokens into the skill folder. Point the host at a local clone path only.

## Fail closed

If the sidecar is missing, times out, or returns unparseable JSON → treat as `ask-human`.
