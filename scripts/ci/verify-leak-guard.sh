#!/usr/bin/env bash
# Local leak/secret path guard (same checks as former inline leak-guard.yml).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

BLOCKED=0

echo "== sensitive path scan =="
PATH_PATTERNS=(
  '^memory/'
  '^MEMORY\.md$'
  '^USER\.md$'
  '^AGENTS\.md$'
  '^SOUL\.md$'
  '^HEARTBEAT\.md$'
  '^IDENTITY\.md$'
  '^BOOTSTRAP\.md$'
  '^CLAUDE\.md$'
  '^TOOLS\.md$'
  '^PREDICTIONS\.md$'
  '^knowledge/people/'
  '^knowledge/business/competitive-intel'
  '^knowledge/investment/'
  '^knowledge/legal/'
  '^knowledge/security/'
  '\.env\.local$'
  '\.env\.1password$'
  'machine\.json$'
  'BitflyerBot/'
  '\.serena/'
  '\.claude/'
  'katalalog_yugi/'
  'auth-profiles\.json$'
)

for pattern in "${PATH_PATTERNS[@]}"; do
  matches=$(git ls-files | grep -E "$pattern" || true)
  if [ -n "$matches" ]; then
    echo "❌ Sensitive path: $matches"
    BLOCKED=1
  fi
done

echo "== hardcoded secret scan =="
SECRET_PATTERNS=(
  'AUTH_SECRET=[^$({]'
  'sk-ant-[a-zA-Z0-9_-]{20,}'
  'ghp_[a-zA-Z0-9]{36}'
  '(^|[^A-Z0-9_])DISCORD_TOKEN=[a-zA-Z0-9._-]{20,}'
  'AKIA[0-9A-Z]{16}'
  'xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+'
)

for pattern in "${SECRET_PATTERNS[@]}"; do
  matches=$(git grep -lE "$pattern" -- \
    ':(exclude)*.yml' \
    ':(exclude)*.yaml' \
    ':(exclude)*leak-guard*' \
    ':(exclude)*verify-leak-guard*' \
    ':(exclude).env.example' \
    ':(exclude)docs/openclaw/**' \
    ':(exclude)Labyrinth_Beta/inf-Coding/viszagi_implementation_handoff.md' \
    ':(exclude)Labyrinth_Standard/lab-coding/viszagi_implementation_handoff.md' \
    ':(exclude)ViszBot-Debug/README_INTEGRATION.md' \
    ':(exclude)inf-Coding/viszagi_implementation_handoff.md' \
    ':(exclude)*.test.ts' \
    ':(exclude)*.spec.ts' \
    ':(exclude)benchmarks/*' \
    ':(exclude)*.jsonl' \
    || true)
  if [ -n "$matches" ]; then
    echo "❌ Potential secret ($pattern) in: $matches"
    BLOCKED=1
  fi
done

if [ "$BLOCKED" -eq 1 ]; then
  echo "leak guard failed: sensitive paths or potential secrets detected"
  exit 1
fi

echo "leak guard passed"
