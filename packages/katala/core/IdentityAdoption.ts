import { createHash } from "crypto";

export type PersonhoodProvider = "world-id-nextauth" | "idkit-js" | "semaphore-rs";

export interface WorldIdVerificationInput {
  provider: "world-id-nextauth" | "idkit-js";
  subject: string;
  nullifierHash?: string;
  verificationLevel: "device" | "orb" | "document";
  purpose: string;
}

export interface DistilledPersonhoodRecord {
  schema: "katala.personhood.distilled.v1";
  provider: PersonhoodProvider;
  subjectHash: string;
  nullifierHashHash?: string;
  verificationLevel: string;
  purpose: string;
  verifiedAt: string;
  rawStored: false;
  collectedFields: string[];
}

export interface SemaphoreProofInput {
  signal: string;
  externalNullifier: string;
  proof: string;
  merkleTreeRoot: string;
}

export interface SemaphoreProofAssessment {
  provider: "semaphore-rs";
  accepted: boolean;
  failureReasons: string[];
  distilled: {
    signalHash: string;
    externalNullifierHash: string;
    merkleTreeRootHash: string;
  };
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function distillWorldIdVerification(
  input: WorldIdVerificationInput,
  verifiedAt: string = new Date().toISOString(),
): DistilledPersonhoodRecord {
  return {
    schema: "katala.personhood.distilled.v1",
    provider: input.provider,
    subjectHash: hash(input.subject),
    nullifierHashHash: input.nullifierHash ? hash(input.nullifierHash) : undefined,
    verificationLevel: input.verificationLevel,
    purpose: input.purpose,
    verifiedAt,
    rawStored: false,
    collectedFields: ["subjectHash", "verificationLevel", "purpose"],
  };
}

export function satisfiesNoStoreBoundary(record: DistilledPersonhoodRecord): boolean {
  return (
    record.rawStored === false &&
    record.collectedFields.every((field) => !["subject", "rawPayload", "biometric"].includes(field))
  );
}

export function assessSemaphoreProof(input: SemaphoreProofInput): SemaphoreProofAssessment {
  const failureReasons: string[] = [];
  if (!input.signal) failureReasons.push("missing-signal");
  if (!input.externalNullifier) failureReasons.push("missing-external-nullifier");
  if (!input.merkleTreeRoot) failureReasons.push("missing-merkle-root");
  if (!/^0x[0-9a-f]+$/i.test(input.proof)) failureReasons.push("proof-must-be-hex");

  return {
    provider: "semaphore-rs",
    accepted: failureReasons.length === 0,
    failureReasons,
    distilled: {
      signalHash: hash(input.signal),
      externalNullifierHash: hash(input.externalNullifier),
      merkleTreeRootHash: hash(input.merkleTreeRoot),
    },
  };
}
