import { pathToFileURL } from "node:url";
import { z } from "zod";

const visibilitySchema = z.enum(["IGNORE", "PRIVATE", "MEDIATION", "PUBLIC"]);
const taskModeSchema = z.enum(["analyze", "mediate", "propose", "review"]);
const responseStatusSchema = z.enum(["ok", "rejected", "unsafe", "needs-human"]);
const actionKindSchema = z.enum(["reply", "plan", "patch-proposal", "policy-warning"]);
const actionRiskSchema = z.enum(["low", "medium", "high"]);
const memoryModeSchema = z.enum(["none", "ephemeral", "distilled-export"]);

const safeRelativePathSchema = z
  .string()
  .min(1)
  .max(240)
  .refine((value) => {
    if (value.includes("\0")) return false;
    if (value.startsWith("/") || value.startsWith("\\") || /^[A-Za-z]:/.test(value)) return false;
    const parts = value.split(/[\\/]+/);
    return parts.every((part) => part.length > 0 && part !== "." && part !== "..");
  }, "path must be a safe relative path");

const contextItemSchema = z.object({
  id: z.string().min(1).max(120),
  kind: z.string().min(1).max(60),
  content: z.string().min(1).max(20_000),
  visibility: visibilitySchema,
  provenance: z.string().min(1).max(240),
  ttl_seconds: z.number().int().positive().max(31_536_000),
});

const payloadSchema = z.record(z.string(), z.unknown());

const candidateActionSchema = z.object({
  kind: actionKindSchema,
  target: z.string().min(1).max(120),
  payload: payloadSchema.default({}),
  risk: actionRiskSchema,
});

const memoryExportSchema = z.object({
  kind: z.literal("distilled_fact"),
  content: z.string().min(1).max(1_000),
  visibility: z.enum(["MEDIATION", "PUBLIC"]),
  ttl_seconds: z.number().int().positive().max(31_536_000),
  confidence: z.number().min(0).max(1),
});

export const katalaThinkRequestSchema = z.object({
  request_id: z.string().min(1).max(120),
  host: z.object({
    name: z.string().min(1).max(120),
    session_id: z.string().min(1).max(120),
  }),
  task: z.object({
    goal: z.string().min(1).max(4_000),
    mode: taskModeSchema,
  }),
  context_items: z.array(contextItemSchema).max(128).default([]),
  capabilities: z
    .object({
      can_write: z.boolean().default(false),
      can_shell: z.boolean().default(false),
      can_network: z.boolean().default(false),
    })
    .default({
      can_write: false,
      can_shell: false,
      can_network: false,
    }),
  workspace: z
    .object({
      read_paths: z.array(safeRelativePathSchema).max(64).default([]),
      write_paths: z.array(safeRelativePathSchema).max(16).default([]),
    })
    .default({
      read_paths: [],
      write_paths: [],
    }),
  memory_mode: memoryModeSchema.default("none"),
});

export const katalaThinkResponseSchema = z.object({
  request_id: z.string().min(1).max(120),
  status: responseStatusSchema,
  distilled_intent: z.string().min(1).max(500),
  reasoning_summary: z.array(z.string().min(1).max(200)).max(16),
  candidate_actions: z.array(candidateActionSchema).min(1).max(8),
  memory_exports: z.array(memoryExportSchema).max(8),
  safety: z.object({
    requires_human_approval: z.boolean(),
    forbidden_action_attempted: z.boolean(),
  }),
});

function normalizeGoal(goal) {
  const normalized = goal.replace(/\s+/g, " ").trim().slice(0, 240);
  return normalized.length > 0 ? normalized : "unspecified-goal";
}

function summarizeContext(contextItems) {
  const counts = {
    publicCount: 0,
    mediationCount: 0,
    privateCount: 0,
    ignoredCount: 0,
  };

  for (const item of contextItems) {
    if (item.visibility === "PUBLIC") counts.publicCount += 1;
    if (item.visibility === "MEDIATION") counts.mediationCount += 1;
    if (item.visibility === "PRIVATE") counts.privateCount += 1;
    if (item.visibility === "IGNORE") counts.ignoredCount += 1;
  }

  return counts;
}

function buildOkAction(request, counts) {
  const recommendedAction =
    request.task.mode === "review"
      ? "stateless-review"
      : `stateless-${request.task.mode}-review`;

  return {
    kind: "plan",
    target: "host",
    payload: {
      mode: request.task.mode,
      recommended_action: recommendedAction,
      public_context_count: counts.publicCount,
      mediation_context_count: counts.mediationCount,
      private_context_withheld: counts.privateCount > 0,
    },
    risk: "low",
  };
}

function buildUnsafeAction(reasonCodes) {
  return {
    kind: "policy-warning",
    target: "host",
    payload: {
      reason_codes: reasonCodes,
      recommended_action: "retry-with-stateless-read-only-contract",
    },
    risk: "high",
  };
}

function buildRejectionAction(reasonCodes) {
  return {
    kind: "policy-warning",
    target: "host",
    payload: {
      reason_codes: reasonCodes,
      recommended_action: "fix-request-schema-and-retry",
    },
    risk: "medium",
  };
}

function buildReasoningSummary(request, counts, extraReason) {
  const summary = [
    `mode:${request.task.mode}`,
    `public_context:${counts.publicCount}`,
    `mediation_context:${counts.mediationCount}`,
    `private_context_withheld:${counts.privateCount}`,
    `ignored_context:${counts.ignoredCount}`,
    `memory_mode:${request.memory_mode}`,
    "execution:read-only",
    "memory_exports:none",
  ];

  if (extraReason) {
    summary.push(`status_reason:${extraReason}`);
  }

  return summary;
}

export function createKatalaThinkResponse(request) {
  const counts = summarizeContext(request.context_items);
  const reasonCodes = [];

  if (request.capabilities.can_write) reasonCodes.push("write_capability_not_allowed");
  if (request.capabilities.can_shell) reasonCodes.push("shell_capability_not_allowed");
  if (request.capabilities.can_network) reasonCodes.push("network_capability_not_allowed");
  if (request.workspace.write_paths.length > 0) reasonCodes.push("write_paths_not_allowed");
  if (request.memory_mode !== "none") reasonCodes.push("memory_mode_not_supported_in_stateless_sidecar");

  const response = {
    request_id: request.request_id,
    status: reasonCodes.length > 0 ? "unsafe" : "ok",
    distilled_intent: normalizeGoal(request.task.goal),
    reasoning_summary: buildReasoningSummary(
      request,
      counts,
      reasonCodes.length > 0 ? reasonCodes.join(",") : undefined,
    ),
    candidate_actions: reasonCodes.length > 0
      ? [buildUnsafeAction(reasonCodes)]
      : [buildOkAction(request, counts)],
    memory_exports: [],
    safety: {
      requires_human_approval: reasonCodes.length > 0,
      forbidden_action_attempted: reasonCodes.length > 0,
    },
  };

  return katalaThinkResponseSchema.parse(response);
}

export function createKatalaThinkRejection(rawRequestId, reasonCodes) {
  const response = {
    request_id:
      typeof rawRequestId === "string" && rawRequestId.trim().length > 0
        ? rawRequestId.trim().slice(0, 120)
        : "invalid-request",
    status: "rejected",
    distilled_intent: "invalid katala-think request",
    reasoning_summary: [
      "request_validation:failed",
      `reason_codes:${reasonCodes.join(",")}`,
      "execution:read-only",
      "memory_exports:none",
    ],
    candidate_actions: [buildRejectionAction(reasonCodes)],
    memory_exports: [],
    safety: {
      requires_human_approval: true,
      forbidden_action_attempted: true,
    },
  };

  return katalaThinkResponseSchema.parse(response);
}

export function createKatalaThinkResponseFromUnknown(input) {
  const parsed = katalaThinkRequestSchema.safeParse(input);
  if (!parsed.success) {
    const rawRequestId =
      input && typeof input === "object" && typeof input.request_id === "string"
        ? input.request_id
        : undefined;
    const reasonCodes = parsed.error.issues.map((issue) =>
      `invalid_${issue.path.join("_") || "request"}`,
    );
    return createKatalaThinkRejection(rawRequestId, reasonCodes.length > 0 ? reasonCodes : ["invalid_request"]);
  }

  return createKatalaThinkResponse(parsed.data);
}

async function readAllFromStdin(stdin) {
  let data = "";
  for await (const chunk of stdin) {
    data += String(chunk);
  }
  return data;
}

export async function runKatalaThinkFromStdio({
  stdin = process.stdin,
  stdout = process.stdout,
} = {}) {
  try {
    const raw = await readAllFromStdin(stdin);
    const parsedInput = JSON.parse(raw || "{}");
    const response = createKatalaThinkResponseFromUnknown(parsedInput);
    stdout.write(`${JSON.stringify(response)}\n`);
    process.exitCode = response.status === "rejected" ? 1 : 0;
  } catch {
    const response = createKatalaThinkRejection("invalid-request", ["invalid_json"]);
    stdout.write(`${JSON.stringify(response)}\n`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  await runKatalaThinkFromStdio();
}
