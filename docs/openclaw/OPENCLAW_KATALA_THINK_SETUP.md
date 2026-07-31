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

See also [OPENCLAW_SAFE_EMBEDDING.md](./OPENCLAW_SAFE_EMBEDDING.md).
