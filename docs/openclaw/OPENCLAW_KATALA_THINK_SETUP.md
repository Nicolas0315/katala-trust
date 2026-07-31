# OpenClaw / ZeroClaw Setup for `katala-think`

最終更新: 2026-03-30

この文書は、GitHub 上の Katala リポジトリから `katala-think` を取得し、
OpenClaw / ZeroClaw 系ホストへ stateless sidecar として組み込むまでの最短手順です。

対象は現在の最小安全実装です。

- stateless
- read-only
- no hidden writeback
- no persistent memory
- no `PRIVATE` export

詳細な契約は以下を参照してください。

- `docs/KATALA_THOUGHT_ENGINE_CONTRACT.md`
- `docs/OPENCLAW_SAFE_EMBEDDING.md`

---

## 1. 何が入るのか

現在の sidecar 実体は以下です。

- `packages/katala/gateway/katala-think.mjs`
- `packages/katala/gateway/katalaThinkContract.mjs`

この sidecar は stdin から JSON を受け、stdout に JSON を返します。
ホストの Git、ファイル書き込み、永続メモリ更新は行いません。

---

## 2. 前提条件

- Git
- Node.js 24 以上を推奨
- npm 11 以上を推奨

確認:

```bash
node --version
npm --version
git --version
```

Windows PowerShell でも同じです。

---

## 3. リポジトリ取得

```bash
git clone git@github.com:Nicolas0315/Katala.git
cd Katala
```

HTTPS を使う場合:

```bash
git clone https://github.com/Nicolas0315/Katala.git
cd Katala
```

---

## 4. 依存導入

```bash
npm install
```

`katala-think` 自体は Node 実行だけで動きますが、契約テストも回すなら依存導入が必要です。

---

## 5. 単体起動

### Bash / Zsh

```bash
cat <<'EOF' | npm run katala:think
{
  "request_id": "req-001",
  "host": {
    "name": "openclaw-compatible-host",
    "session_id": "sess-001"
  },
  "task": {
    "goal": "Review the task and return a safe stateless plan.",
    "mode": "review"
  },
  "context_items": [
    {
      "id": "ctx-1",
      "kind": "fact",
      "content": "Katala should remain read-only.",
      "visibility": "PUBLIC",
      "provenance": "docs/setup",
      "ttl_seconds": 3600
    }
  ],
  "capabilities": {
    "can_write": false,
    "can_shell": false,
    "can_network": false
  },
  "workspace": {
    "read_paths": ["docs", "packages", "src"],
    "write_paths": []
  },
  "memory_mode": "none"
}
EOF
```

### PowerShell

```powershell
@'
{
  "request_id": "req-001",
  "host": {
    "name": "openclaw-compatible-host",
    "session_id": "sess-001"
  },
  "task": {
    "goal": "Review the task and return a safe stateless plan.",
    "mode": "review"
  },
  "context_items": [
    {
      "id": "ctx-1",
      "kind": "fact",
      "content": "Katala should remain read-only.",
      "visibility": "PUBLIC",
      "provenance": "docs/setup",
      "ttl_seconds": 3600
    }
  ],
  "capabilities": {
    "can_write": false,
    "can_shell": false,
    "can_network": false
  },
  "workspace": {
    "read_paths": ["docs", "packages", "src"],
    "write_paths": []
  },
  "memory_mode": "none"
}
'@ | npm run katala:think
```

期待される挙動:

- `status: "ok"`
- `memory_exports: []`
- `safety.requires_human_approval: false`

---

## 6. 失敗時の安全挙動

`katala-think` は以下を unsafe/rejected に倒します。

- `write_paths` がある
- `can_write = true`
- `can_shell = true`
- `can_network = true`
- `memory_mode != "none"`
- schema 不正
- JSON 不正

例:

```json
{
  "status": "unsafe",
  "candidate_actions": [
    {
      "kind": "policy-warning"
    }
  ]
}
```

これが current MVP の安全設計です。

---

## 7. OpenClaw / ZeroClaw 側の最小統合

最初は Memory や Identity として組み込まず、Tool / sidecar として接続してください。

概念設定例:

```toml
[tools.katala_think]
command = ["npm", "run", "katala:think", "--silent"]
workspace_mode = "read_only"
memory_mode = "none"
allow_writeback = false
allow_network = false
allow_shell = false
allowed_export_levels = ["MEDIATION", "PUBLIC"]
forbidden_paths = [
  ".git",
  ".github",
  "node_modules",
  "memory",
  "backups",
  "runs",
  "output",
  ".zeroclaw"
]
```

ホスト側の責務:

1. `PRIVATE` を含む raw conversation をそのまま長期保存しない
2. `katala-think` へ渡す前に context を sanitize する
3. 返ってきた `candidate_actions` をそのまま実行しない
4. write / git / posting は host approval gate の後に行う

---

## 8. 受け入れ確認

以下を通したら最低限導入可能です。

### 8.1 sidecar 実行確認

```bash
npm run katala:think
```

stdin を待つ状態になること。

### 8.2 契約テスト

```bash
node ./node_modules/vitest/vitest.mjs run packages/katala/gateway/katalaThinkContract.test.ts
```

### 8.3 coverage 確認

```bash
node ./node_modules/vitest/vitest.mjs run --coverage packages/katala/gateway/katalaThinkContract.test.ts
```

現行実装の追加分では、以下が通る想定です。

- tests: pass
- `PRIVATE` 非漏洩
- read-only 保証
- invalid input rejection

---

## 9. OpenClaw へ渡すべきファイル

最低限これで足ります。

- `docs/OPENCLAW_KATALA_THINK_SETUP.md`
- `docs/KATALA_THOUGHT_ENGINE_CONTRACT.md`
- `docs/OPENCLAW_SAFE_EMBEDDING.md`
- `packages/katala/gateway/katala-think.mjs`
- `packages/katala/gateway/katalaThinkContract.mjs`

必要ならテストも渡してください。

- `packages/katala/gateway/katalaThinkContract.test.ts`

---

## 10. トラブルシュート

### Vitest / Rollup の optional dependency エラー

Windows 環境で `@rollup/rollup-win32-x64-msvc` が欠けることがあります。
その場合はまず再インストールしてください。

```bash
npm install
```

それでもだめなら:

```bash
npm install --no-save @rollup/rollup-win32-x64-msvc
```

### sidecar が `unsafe` になる

入力 JSON を確認してください。

- `write_paths` が空か
- `can_write/can_shell/can_network` が false か
- `memory_mode` が `none` か

### `PRIVATE` を使いたい

現在の MVP は `PRIVATE` を「参照しても輸出しない」設計です。
共有したいなら、ホスト側で蒸留して `MEDIATION` または `PUBLIC` に変換する必要があります。

---

## 11. 現在の制限

現在の `katala-think` は intentionally small です。

- 実行器ではない
- 永続メモリは持たない
- writeback しない
- richer trust/policy engine への接続はこれから

つまり、今は「安全な頭脳の差し込み口」を固めた段階です。
この段階を飛ばして Memory や Git までつなぐと、汚染と破壊が起きやすくなります。

---

## 12. 次の拡張順

1. host sanitizer と typed handoff を追加
2. `MEDIATION` 向け distilled export だけ段階解放
3. richer Katala policy modules と接続
4. localhost RPC 版 sidecar を追加
5. host approval gate と統合

この順番で進めるのが安全です。
