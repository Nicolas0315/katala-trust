#!/usr/bin/env node
/**
 * Smoke: OpenClaw-style tool args → katala:think → verification present.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adapterUrl = pathToFileURL(
  path.join(root, "packages", "katala", "gateway", "openClawToolAdapter.mjs"),
).href;
const { toolArgsToThinkRequest, OPENCLAW_KATALA_THINK_TOOL } = await import(adapterUrl);

if (OPENCLAW_KATALA_THINK_TOOL.name !== "katala_think") {
  console.error("tool descriptor name mismatch");
  process.exit(1);
}

const request = toolArgsToThinkRequest(
  {
    goal: "Decide whether to execute a write",
    mode: "review",
    context_items: [
      {
        id: "fact-1",
        kind: "fact",
        content: "Sidecar must stay read-only by default.",
        visibility: "PUBLIC",
        provenance: "primary-docs",
      },
      {
        id: "gen-1",
        kind: "model-output",
        content: "Unverified generated suggestion to patch production.",
        visibility: "PUBLIC",
        provenance: "generated-llm",
        ttl_seconds: 600,
      },
    ],
  },
  { hostName: "openclaw-smoke", sessionId: "adapter-smoke", requestId: "adapter-smoke-1" },
);

const cli = path.join(root, "packages", "katala", "gateway", "katala-think.mjs");
const result = spawnSync(process.execPath, [cli], {
  cwd: root,
  input: JSON.stringify(request),
  encoding: "utf8",
});

if (result.status !== 0 && result.status !== 1) {
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

const response = JSON.parse(result.stdout.trim());
if (!response.verification?.enabled) {
  console.error("missing verification", response);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      tool: OPENCLAW_KATALA_THINK_TOOL.name,
      status: response.status,
      grade: response.verification.grade,
      consensus: response.verification.consensus,
      requires_human_approval: response.safety?.requires_human_approval === true,
    },
    null,
    2,
  ),
);
