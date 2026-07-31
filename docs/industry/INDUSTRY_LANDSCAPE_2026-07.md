# Industry Landscape — Independent AI Verification (2026-07)

Retrieved: 2026-07-31

## Thesis

Frontier labs optimize generation, tool use, and in-house evals.
What remains scarce is a **lab-neutral verification layer** that sits beside any host agent:
intent detox, trust scoring, cross-check routing, and human approval — without owning memory or execution.

Katala targets that gap as an OSS verification sidecar.

## Frontier posture (compressed)

| Actor | Direction relevant to Katala | Implication |
| --- | --- | --- |
| OpenAI | Model Spec, tool/agent products, provenance experiments | Specs are vendor-owned; external auditors still needed |
| Anthropic | Constitutional / Claude safety layers, monitorability research | Strong self-governance ≠ third-party verification |
| Google DeepMind | Gemini agents, eval suites, grounding/citations | Citations help; independent mediation still missing |
| Meta | Open weights + Llama ecosystem tooling | More models → more need for cross-model consistency checks |
| xAI / others | Fast shipping chat/agent surfaces | Speed widens the verification lag |

Common pattern: **self-evaluation inside the producer**.
Katala's complementary role: **fail-closed verification outside the producer**.

## Paper / research themes to track

1. **Monitorability of chain-of-thought / agent traces** — score whether reasoning is inspectable before action.
2. **Cross-model consistency / disagreement routing** — accept / fuse / escalate when models conflict (Katala CMCV contracts).
3. **Tool-call provenance** — cryptographically or hash-link tool invocations for audit.
4. **Fabrication / unsupported claim detection** — deep-research quality axes (Katala KS47 contracts).
5. **Agent gateway policy** — peer auth, capability bounds, human-in-the-loop (Katala-Claw).

## Regulatory pressure

EU AI Act transparency/labeling obligations (Article 50 cluster) increase demand for
machine-readable provenance and human-oversight hooks in agent pipelines.
An embeddable sidecar is cheaper than rebuilding each product stack.

## Market gap Katala fills

- Not another chat UI
- Not another model host
- A **stateless think/verify contract** hosts can call before side effects

See [PARTS_ASSEMBLY.md](./PARTS_ASSEMBLY.md) for the concrete OSS parts cut.
