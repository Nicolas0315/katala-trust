import { timingSafeEqual } from "crypto";
import type { IncomingHttpHeaders } from "http";
import { SynergyRequestSchema, type SynergyRequest } from "./types";

export interface PeerAuthConfig {
  acceptedTokens: string[];
  requireToken: boolean;
  trustedTailscalePrefixes?: string[];
}

export interface PeerAuthInput {
  remoteAddress: string;
  headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>;
}

export interface PeerAuthResult {
  ok: boolean;
  reason: string;
  peerId?: string;
}

export interface HumanApprovalMediationRequest {
  requestId: string;
  status: "pending-human-approval";
  requestedAt: string;
  requesterAgentId: string;
  targetAgentId: string;
  summary: string;
  request: SynergyRequest;
}

const DEFAULT_TAILSCALE_PREFIXES = ["100.", "::ffff:100.", "fd7a:115c:a1e0:"];

function normalizeRemoteAddress(address: string): string {
  return address.trim().replace(/^\[|\]$/g, "");
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function extractBearerToken(
  headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>,
): string | null {
  const raw = headers.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export function isTrustedTailnetAddress(
  remoteAddress: string,
  prefixes: string[] = DEFAULT_TAILSCALE_PREFIXES,
): boolean {
  const normalized = normalizeRemoteAddress(remoteAddress);
  return prefixes.some((prefix) => normalized.startsWith(prefix));
}

export function verifyPeerRequest(input: PeerAuthInput, config: PeerAuthConfig): PeerAuthResult {
  const prefixes = config.trustedTailscalePrefixes ?? DEFAULT_TAILSCALE_PREFIXES;
  if (!isTrustedTailnetAddress(input.remoteAddress, prefixes)) {
    return { ok: false, reason: "remote-address-outside-tailnet" };
  }

  const token = extractBearerToken(input.headers);
  if (config.requireToken && !token) {
    return { ok: false, reason: "missing-peer-token" };
  }
  if (token) {
    const matched = config.acceptedTokens.some((accepted) => constantTimeEquals(token, accepted));
    if (!matched) return { ok: false, reason: "invalid-peer-token" };
  }

  return { ok: true, reason: token ? "tailnet-and-token-verified" : "tailnet-verified" };
}

export function parseGatewayTokens(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function validateMediationEnvelope(input: unknown): SynergyRequest {
  return SynergyRequestSchema.parse(input);
}

export function createHumanApprovalMediationRequest(
  request: SynergyRequest,
  requestedAt: string = new Date().toISOString(),
): HumanApprovalMediationRequest {
  return {
    requestId: `med_${request.user_a.user_id}_${request.user_b.user_id}_${requestedAt}`,
    status: "pending-human-approval",
    requestedAt,
    requesterAgentId: request.user_a.user_id,
    targetAgentId: request.user_b.user_id,
    summary: `${request.user_a.user_id} requests mediated contact with ${request.user_b.user_id}`,
    request,
  };
}
