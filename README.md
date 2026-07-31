# Katala Trust (OSS verification sidecar)

Lab-neutral verification for AI agents: detox intent, score trust, mediate,
and emit fail-closed recommendations — without owning host memory or execution.

> Private R&D monorepo stays separate. This repository is the public, measurable cut.

## Quick start

```bash
npm install
npm run verify:local

printf '%s' '{"request_id":"smoke","host":{"name":"local","session_id":"manual"},"task":{"goal":"verify Katala think surface","mode":"review"},"context_items":[],"capabilities":{"can_write":false,"can_shell":false,"can_network":false},"workspace":{"read_paths":[],"write_paths":[]},"memory_mode":"none"}' \
  | npm run katala:think --silent
```

## Docs

- [Industry landscape (2026-07)](docs/industry/INDUSTRY_LANDSCAPE_2026-07.md)
- [Parts assembly](docs/industry/PARTS_ASSEMBLY.md)
- [Thought engine contract](docs/openclaw/KATALA_THOUGHT_ENGINE_CONTRACT.md)
- [Safe embedding](docs/openclaw/OPENCLAW_SAFE_EMBEDDING.md)

## License

MIT
