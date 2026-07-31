# Katala Thought Engine Contract

最終更新: 2026-03-29

この文書は、Katalaの「思考エンジン」だけを他エージェントへ安全に引き継ぐための契約書です。
目的は、Katalaの推論価値を移植できるようにしつつ、人格・記憶・既存リポジトリ破壊まで一緒に持ち出さないことです。

---

## 1. この文書でいう「思考エンジン」

Katalaの思考エンジンは、以下の責務だけを持つ独立層として扱います。

- 意図の正規化
- 感情ノイズのデトックス
- 信頼性/整合性評価
- シナジー/メディエーション計算
- ポリシー評価
- 実行候補の蒸留

逆に、以下は**思考エンジンに含めません**。

- `SOUL.md` / `IDENTITY.md` / `USER.md` のような人格・関係性表現
- ホスト側の永続メモリ
- チャネル実装そのもの
- `git` / shell / file write などの破壊可能な実行権限
- ホストリポジトリへの直接変更

---

## 2. 現行コードとの対応

現時点で思考エンジン候補として扱う中核は以下です。

| レイヤ | 役割 | 現行コード |
| --- | --- | --- |
| Detox | 感情ノイズ除去・意図抽出 | `src/lib/mediation/detox.ts` |
| Policy | 収集/公開/監査の閾値判定 | `src/lib/policy/openThreshold.ts`, `src/lib/policy/distilledAuditPolicy.ts`, `src/lib/policy/inclusionGuard.ts` |
| Mediation | 意図を合意候補へ変換 | `packages/katala/core/MediationService.ts`, `packages/katala/core/LocalMediationManager.ts` |
| Trust | 信頼性/検証可能性評価 | `packages/katala/core/TrustScorer.ts`, `packages/katala/core/ConsensusEngine.ts` |
| Synergy | 相性/共鳴計算 | `packages/katala/core/SynergyEngine.ts`, `packages/katala/core/SynergyScorer.ts` |
| Profiling | 蒸留された特徴量更新 | `packages/katala/core/ProfilingEngine.ts`, `packages/katala/core/IdentityVector.ts` |
| Gateway Bridge | 外部エージェントからの安全な受け口 | `packages/katala/gateway/KatalaClawGateway.ts`, `packages/katala/gateway/PythonInfCodingAdapter.ts` |
| Sidecar Contract | stateless stdin/stdout JSON 実装 | `packages/katala/gateway/katalaThinkContract.mjs`, `packages/katala/gateway/katala-think.mjs` |

この構成から分かる通り、Katalaはすでに「思考」と「橋渡し」の核を持っています。
足りないのは、他エージェントへ渡す際の**境界契約**を厳密化することです。

---

## 3. 非交渉の原則

### 3.1 Stateless by Default

思考エンジンは、デフォルトで**無状態**です。
リクエスト間の暗黙の持ち越しは禁止します。

### 3.2 No Hidden Writeback

思考エンジンは、ホストのメモリ・プロフィール・ログへ自動書き戻ししません。
書き戻しは、明示された `memory_exports` のみ許可します。

### 3.3 No Direct Mutation

思考エンジンは、ホストのファイルシステム・Git・外部サービスを直接変更しません。
返すのは「提案」か「差分候補」までです。

### 3.4 Provenance Required

入力される文脈には、最低でも以下のどれかが必要です。

- 出所
- 可視性レベル
- TTL
- ハッシュ/参照ID

由来不明の文脈は、低信頼として扱うか拒否します。

### 3.5 Fail Closed

契約外入力、権限超過、可視性違反、危険な書き戻し要求が来た場合は、
便利さより安全を優先して**失敗で閉じる**のが正解です。

---

## 4. I/O 契約

## 4.1 入力契約

思考エンジンへ渡す入力は、少なくとも以下を含む JSON とします。

```json
{
  "request_id": "uuid-or-host-generated-id",
  "host": {
    "name": "openclaw-compatible-host",
    "session_id": "host-session-id"
  },
  "task": {
    "goal": "What should be decided",
    "mode": "analyze|mediate|propose|review"
  },
  "context_items": [
    {
      "id": "ctx-1",
      "kind": "message|doc|fact|code|policy",
      "content": "sanitized content or reference",
      "visibility": "IGNORE|PRIVATE|MEDIATION|PUBLIC",
      "provenance": "source or hash",
      "ttl_seconds": 3600
    }
  ],
  "capabilities": {
    "can_write": false,
    "can_shell": false,
    "can_network": false
  },
  "workspace": {
    "read_paths": ["src", "docs", "packages"],
    "write_paths": []
  },
  "memory_mode": "none"
}
```

### 4.2 出力契約

出力も JSON とし、ホスト側が後段処理しやすい蒸留形式に限定します。

```json
{
  "request_id": "uuid-or-host-generated-id",
  "status": "ok|rejected|unsafe|needs-human",
  "distilled_intent": "short normalized intent",
  "reasoning_summary": [
    "high-signal rationale only"
  ],
  "candidate_actions": [
    {
      "kind": "reply|plan|patch-proposal|policy-warning",
      "target": "host-facing target",
      "payload": {},
      "risk": "low|medium|high"
    }
  ],
  "memory_exports": [
    {
      "kind": "distilled_fact",
      "content": "explicitly exportable memory only",
      "visibility": "MEDIATION|PUBLIC",
      "ttl_seconds": 86400,
      "confidence": 0.82
    }
  ],
  "safety": {
    "requires_human_approval": true,
    "forbidden_action_attempted": false
  }
}
```

---

## 5. メモリ契約

## 5.1 許可するモード

- `none`
  - 完全無記憶。デフォルト。
- `ephemeral`
  - リクエスト単位の一時記憶のみ。セッション終了時に破棄。
- `distilled-export`
  - ホストの承認後に、蒸留済み事実のみ外部へ出せる。

## 5.2 禁止するモード

- ホストの永続メモリへ自動同期
- 生ログの自動保存
- 人格ファイルの自動学習
- 他セッションからの暗黙再利用

## 5.3 記憶汚染を防ぐルール

- メモリは `request_id` または `session_id` 単位で名前空間分離する
- `PRIVATE` は思考中参照のみ可、輸出不可
- `MEDIATION` は蒸留後のみ輸出可
- `PUBLIC` でも raw text のまま保存しない
- TTL切れ文脈は再利用しない

---

## 6. ワークスペース契約

思考エンジンは、ホストワークスペースに対して以下のルールで動きます。

- 既定値は `read-only`
- `write_paths` が空なら変更禁止
- `.git`, `.github`, `node_modules`, `backups`, `runs`, `memory`, ホスト固有設定領域は既定で禁止
- 実変更が必要な場合も、まず `patch-proposal` を返す
- 適用はホストか人間が行う

これにより、Katalaを積んでも既存リポジトリの破壊半径を最小化できます。

---

## 7. ホストへの引き継ぎ単位

他エージェントへ引き継ぐのは、以下の3点だけで十分です。

1. 入力契約
2. 出力契約
3. 安全制約

逆に、以下は引き継がない前提にします。

- Katala固有の人格
- セッション記憶
- Git権限
- 外部チャネル資格情報
- 既存リポジトリの書き込み権

---

## 8. 推奨パッケージ化

他エージェントへ移植する場合、Katala思考エンジンは以下のどちらかで提供するのが安全です。

### A. Sidecar CLI

例:

```bash
katala-think --stdin-json --stateless
```

利点:

- ホストとプロセス境界を分離できる
- 権限をOSレベルで絞りやすい
- ログ/一時領域/終了処理を独立管理できる

### B. Local RPC

例:

- `POST /katala/think`
- localhost only
- 認証付き
- read-only mount

利点:

- 複数ホストから共通利用しやすい
- レート制限と監査を入れやすい

---

## 9. 受け入れテスト

他エージェントへ載せる前に、最低限この5つは通すべきです。

1. 同一入力で、別セッション間に記憶持ち越しが起きない
2. `PRIVATE` 文脈が `memory_exports` に現れない
3. 書き込み権限なしで、ファイル変更や Git 実行を試みない
4. 契約外入力時に `unsafe` または `rejected` で返る
5. ホスト停止後に、一時領域が残留しない

---

## 10. 結論

Katalaを「完全体」に近づけるには、全部を一つの巨大エージェントへ混ぜるより、
**思考エンジンだけを抽出可能な部品として確立すること**が先です。

そのための最小条件は以下です。

- 無状態を既定にする
- メモリ輸出を明示制にする
- 変更権限を持たせない
- 可視性と出所を強制する
- 提案と実行を分離する

この契約が固まれば、Katalaは他エージェントに「賢さ」だけを供給し、
人格汚染・記憶汚染・リポジトリ破壊をかなりの確率で防げます。
