# Katala System Overview（現行実装サマリー）

最終更新: 2026-07-31

このドキュメントは、Katalaの**現在の実装状態**を1枚で把握するための運用ドキュメントです。
「思想」「計画」ではなく、**今動いているもの**を基準に整理します。

> **2026-07-31 真実化:** アクティブ面は verification + `katala:think` sidecar。
> Next.js frontend/auth（`src/app`）は dormant。詳細は `docs/industry/PARTS_ASSEMBLY.md` と private monorepo の usability report。

---

## 1. 現在の実装スコープ

### ✅ アクティブ（検証済み）

- Stateless think sidecar: `npm run katala:think`（`packages/katala/gateway/katalaThinkContract.mjs`）
- Core engines: Trust / Consensus / Mediation / Synergy / Profiling / Ledger / KBB
- Agent gateway: `KatalaClawGateway` + `AgentGatewayPolicy`（Tailscale peer + optional bearer）
- Intake router: Discord envelope → fail-closed intent routing
- Local-first CI: `bash scripts/verify.sh local`（GHA は opt-in）
- Gateway measurement: Vitest for health/auth/mediate + IntakeRouter + LocalMediationManager

### ⏳ Dormant（意図的隔離）

- Next.js / Auth.js / WebAuthn UI・API（`tsconfig.frontend-dormant.json`）
- 依存（next / react / next-auth / simplewebauthn）は root package に未宣言

### ❌ 未実装（計画のみ / 研究契約のみ）

- 本格 ZK / DID・VC 本運用
- SCS 経済圏 / P2P gossip
- Auth0 テナント本番

---

## 2. アーキテクチャ（現行アクティブ）

```text
Host agent
  -> context (provenance / visibility / ttl)
  -> katala:think (stateless)
  -> candidate_actions + safety flags
  -> human approval (host)
  -> host executor

Optional fleet path:
Peer (Tailscale) -> KatalaClawGateway -> LocalMediationManager -> Ledger/Board
```

### コンポーネント対応

- Think contract: `packages/katala/gateway/katalaThinkContract.mjs`
- Gateway: `packages/katala/gateway/KatalaClawGateway.ts`
- Policy: `packages/katala/core/AgentGatewayPolicy.ts`
- Mediation: `packages/katala/core/MediationService.ts`, `LocalMediationManager.ts`
- Trust: `packages/katala/core/TrustScorer.ts`, `ConsensusEngine.ts`
- Ledger: `packages/katala/core/ImmutableLedger.ts`

---

## 3. 検証コマンド

```bash
npm run verify:gateway
npm run verify:local
npm run katala:think --silent   # stdin JSON
```

---

## 4. OSS 公開カット

Public extract: `scripts/export-public-subset.py` → `../katala-trust`
Industry map: `docs/industry/INDUSTRY_LANDSCAPE_2026-07.md`

---

## 5. 次の実装優先順位

1. Host 1本への `katala:think` 埋め込み（承認ゲート付き）
2. Open issue の contract-complete 仕分け
3. dormant Next の promote-or-archive 明示決定
4. ZK/DID/経済圏は後段

---

_Owner: Katala maintainers_
