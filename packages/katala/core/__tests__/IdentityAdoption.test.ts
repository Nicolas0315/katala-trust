import { describe, expect, it } from "vitest";
import {
  assessSemaphoreProof,
  distillWorldIdVerification,
  satisfiesNoStoreBoundary,
} from "../IdentityAdoption";

describe("IdentityAdoption", () => {
  it("distills World ID verification into a no-store record", () => {
    const record = distillWorldIdVerification(
      {
        provider: "world-id-nextauth",
        subject: "raw-subject",
        nullifierHash: "raw-nullifier",
        verificationLevel: "orb",
        purpose: "agent-login",
      },
      "2026-06-28T00:00:00.000Z",
    );

    expect(record.rawStored).toBe(false);
    expect(record.subjectHash).not.toBe("raw-subject");
    expect(record.nullifierHashHash).not.toBe("raw-nullifier");
    expect(satisfiesNoStoreBoundary(record)).toBe(true);
  });

  it("assesses semaphore proof shape without storing raw identity", () => {
    const accepted = assessSemaphoreProof({
      signal: "unique-agent",
      externalNullifier: "katala-login",
      merkleTreeRoot: "root",
      proof: "0xabc123",
    });
    const rejected = assessSemaphoreProof({
      signal: "",
      externalNullifier: "",
      merkleTreeRoot: "",
      proof: "not-hex",
    });

    expect(accepted.accepted).toBe(true);
    expect(accepted.distilled.signalHash).not.toBe("unique-agent");
    expect(rejected.accepted).toBe(false);
    expect(rejected.failureReasons).toContain("proof-must-be-hex");
  });
});
