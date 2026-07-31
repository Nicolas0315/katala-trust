# OpenClaw / ZeroClaw Safe Embedding for Katala

最終更新: 2026-03-29

この文書は、Katalaを OpenClaw / ZeroClaw 系ホストへ「思考拡張エンジン」として組み込む際に、
記憶汚染・人格混線・既存リポジトリ破壊を避けるための実装指針です。

実際の導入手順は `docs/OPENCLAW_KATALA_THINK_SETUP.md` を参照してください。

この文書の結論は単純です。

> Katalaはホストの「頭脳補助」として差し込み、
> ホストの「記憶」「人格」「実行権限」は奪わない。

---

## 1. 推奨アーキテクチャ

```text
OpenClaw / ZeroClaw Host
  -> context sanitizer
  -> katala-think sidecar
  -> distilled result
  -> host approval gate
  -> optional executor
```

より具体的には、以下の3面分離を守ります。

### 1.1 Thought Plane

Katalaが担当する層です。

- intent normalization
- detox
- mediation
- trust scoring
- proposal generation

### 1.2 Memory Plane

ホストが担当する層です。

- 会話履歴
- 永続メモリ
- ユーザー固有プロファイル
- ホスト固有の人格ファイル

### 1.3 Execution Plane

ホストまたは人間が担当する層です。

- shell
- git
- file write
- network side effects
- channel posting

Katalaは、この実行層に直接触れないのが基本です。

---

## 2. なぜ Tool/Sidecar として組み込むべきか

ZeroClaw は trait ベースで `Provider`, `Memory`, `Tool`, `RuntimeAdapter`, `Identity` を差し替えられます。
しかし Katala を最初から `Memory` や `Identity` の置換として入れるのは危険です。

最初の正解は、**Katala を `Tool` または sidecar として載せること**です。

理由:

- 破壊半径が小さい
- 呼び出し単位で無状態化しやすい
- read-only 制約をかけやすい
- 異常時に host 側で切り離しやすい
- ホスト既存メモリを汚しにくい

---

## 3. 4つの firewall

## 3.1 Memory Firewall

Katala はホストメモリを自動更新しません。

ルール:

- ホスト会話履歴を全文同期しない
- Katala内部 scratch は `request_id` 単位
- scratch は TTL 後に削除
- 共有可能なのは `memory_exports` に明示された蒸留済み事実のみ

## 3.2 Workspace Firewall

Katala はワークスペースを既定で read-only として読むだけにします。

ルール:

- mount は read-only
- `.git` とホスト設定ディレクトリは禁止
- patch は生成しても、適用はホスト責任
- 危険コマンドは capability で無効化

## 3.3 Capability Firewall

Katala が持つ権限は明示的に削ります。

初期設定:

- `can_write = false`
- `can_shell = false`
- `can_network = false`
- `allow_git = false`

## 3.4 Identity Firewall

Katala はホストの人格や記憶を勝手に学習しません。

ルール:

- `IDENTITY.md`, `SOUL.md`, `USER.md`, `memory/*` をデフォルト注入しない
- ホスト人格はホストが持つ
- Katala は「思考役」に留まる
- 出力トーン変換はホストが行う

---

## 4. 推奨する統合方式

## 4.1 MVP: sidecar command

ホスト側から以下のように呼び出す構成が最も安全です。

```bash
katala-think --stdin-json --stateless --read-only
```

入出力は JSON、権限は read-only、保存はなし。
まずはこれで十分です。

## 4.2 次段階: localhost RPC

sidecar が安定したら、localhost のみ公開する RPC にします。

要件:

- `127.0.0.1` bind only
- bearer token or local secret
- rate limit
- request size limit
- per-request tmp namespace

## 4.3 やってはいけない統合

- Katala をホストの永続メモリ backend として直結する
- Katala にホストの full workspace write を渡す
- Katala に host identity/prompt/memory を丸ごと混ぜる
- Katala から直接 channel 投稿や git push をさせる

---

## 5. 記憶汚染を避ける実装ルール

## 5.1 共有メモリは蒸留後のみ

共有してよいのは raw conversation ではなく、以下のような蒸留済み事実だけです。

- task intent
- accepted constraints
- risk flags
- approved decisions
- provenance hash

## 5.2 書き戻しは host approval 必須

Katala が返す `memory_exports` は、即保存してはいけません。
ホスト側で次の判定を挟みます。

1. visibility が `PRIVATE` ではないか
2. raw text が残っていないか
3. TTL が過剰でないか
4. provenance があるか

## 5.3 scratch はホスト永続領域と分ける

例:

- Katala scratch: `.katala/tmp/<request_id>/`
- Host memory: `~/.zeroclaw/...` あるいは OpenClaw 側 memory store
- Shared distilled log: `logs/katala_distilled.jsonl`

この3つを混ぜないのが重要です。

---

## 6. 既存リポジトリ破壊を避ける実装ルール

## 6.1 提案と実行を分離

Katala が返すのは以下までです。

- reply candidate
- plan
- patch proposal
- safety warning

実際の `git apply`, file write, command execution は host または人間が行います。

## 6.2 writeback allowlist

どうしても自動反映が必要なら、以下の順で解禁します。

1. `docs/` のみ
2. 専用 staging ディレクトリのみ
3. 明示的に指定された sandbox path のみ

最初から repo 全体 write を与えるのは悪手です。

## 6.3 Git 禁止

Katala sidecar には、少なくとも初期段階では以下を禁止します。

- `git reset`
- `git checkout`
- `git clean`
- `git commit`
- `git push`

Git を触るのは host orchestration 側の責務です。

---

## 7. ZeroClaw/OpenClaw 側の設定例

概念例:

```toml
[tools.katala_think]
command = ["katala-think", "--stdin-json", "--stateless", "--read-only"]
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

要点は設定値そのものではなく、以下の順序です。

1. 無記憶
2. read-only
3. 提案のみ
4. 承認後に限定輸出

---

## 8. Katala 側で追加すべきもの

現在の Katala には、すでに橋渡しの萌芽があります。

- `packages/katala/gateway/KatalaClawGateway.ts`
- `packages/katala/gateway/PythonInfCodingAdapter.ts`
- `packages/katala/core/LocalMediationManager.ts`
- `packages/katala/gateway/katalaThinkContract.mjs`
- `packages/katala/gateway/katala-think.mjs`

今後はこれを、より壊れにくい「思考専用 sidecar」へ寄せるべきです。

現時点の最小実行入口は以下です。

```bash
npm run katala:think
```

必要な追加:

1. `katala-think` の richer policy integration
2. memory mode の段階開放（現状は `none` が安全既定）
3. writeback を host approval と結合
4. visibility / provenance のさらに厳密な分類
5. sidecar から host tool への typed handoff

---

## 9. 受け入れチェックリスト

組み込み前に、このチェックが全て `yes` であること。

- Katala を止めても host memory が壊れない
- 連続リクエストで hidden memory carryover が起きない
- `PRIVATE` 文脈が shared export へ漏れない
- sidecar 単独では repo を変更できない
- sidecar 単独では git を実行できない
- host persona と Katala persona が混ざらない
- failure 時に host が切り離せる

---

## 10. 結論

OpenClaw/ZeroClaw に Katala を載せるときは、
Katala を「第二の人格」や「第二の記憶装置」にしてはいけません。

正しくはこうです。

- Katala = 思考拡張
- Host = 記憶と実行の主権者
- Human = 最終承認者

この三権分離を守れば、
Katala の推論力だけを借りながら、記憶汚染と既存リポ破壊をかなり防げます。
