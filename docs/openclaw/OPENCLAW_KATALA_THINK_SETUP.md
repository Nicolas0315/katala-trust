# katala-think setup

## Install

```bash
git clone https://github.com/Nicolas0315/katala-trust.git
cd katala-trust
npm install
```

## Smoke

```bash
npm run verify:local
printf '%s' '{"request_id":"smoke","host":{"name":"local","session_id":"manual"},"task":{"goal":"verify Katala think surface","mode":"review"},"context_items":[],"capabilities":{"can_write":false,"can_shell":false,"can_network":false},"workspace":{"read_paths":[],"write_paths":[]},"memory_mode":"none"}' \
  | npm run katala:think --silent
```

## Host tool adapter

OpenClaw-compatible hosts can register `OPENCLAW_KATALA_THINK_TOOL` from
`packages/katala/gateway/openClawToolAdapter.mjs` and map tool args with
`toolArgsToThinkRequest` before piping JSON to `katala:think`.

```bash
node examples/openclaw-tool-adapter-smoke.mjs
```

See also [OPENCLAW_SAFE_EMBEDDING.md](./OPENCLAW_SAFE_EMBEDDING.md).
