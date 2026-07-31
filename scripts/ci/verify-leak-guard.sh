#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "leak guard requires a git repository" >&2
  exit 1
fi

BLOCKED=0
PATH_PATTERNS=(
  '^\.env$'
  '\.env\.local$'
  'auth-profiles\.json$'
  'machine\.json$'
)

echo "== sensitive path scan =="
for pattern in "${PATH_PATTERNS[@]}"; do
  matches=$(git ls-files | grep -E "$pattern" || true)
  if [ -n "$matches" ]; then
    echo "blocked path matches /$pattern/:"
    echo "$matches"
    BLOCKED=1
  fi
done

echo "== hardcoded secret scan =="
SECRET_PATTERNS=(
  'sk-ant-[a-zA-Z0-9_-]{20,}'
  'ghp_[a-zA-Z0-9]{36}'
  'AKIA[0-9A-Z]{16}'
  'xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+'
)
for pattern in "${SECRET_PATTERNS[@]}"; do
  matches=$(git grep -nE "$pattern" -- ':!scripts/ci/verify-leak-guard.sh' || true)
  if [ -n "$matches" ]; then
    echo "blocked secret pattern /$pattern/:"
    echo "$matches"
    BLOCKED=1
  fi
done

if [ "$BLOCKED" -ne 0 ]; then
  echo "leak guard failed" >&2
  exit 1
fi
echo "leak guard passed"
