import { TrustScorer, Claim } from "../TrustScorer";
import {
  assessTrustInfrastructure,
  buildScoreEvidenceView,
  diffCriteriaVersions,
  TrustInfrastructurePlan,
} from "../TrustInfrastructure";
import {
  annotateForTrustScorer,
  feedbackPenalty,
  findTwoHopTrustChains,
  passesQualityFilter,
} from "../XAlgorithmTrust";

describe("TrustInfrastructure issue contracts", () => {
  const now = new Date().toISOString();

  function claim(overrides: Partial<Claim> = {}): Claim {
    return {
      id: "trust-claim",
      content: "Official release confirms the security patch.",
      source: {
        type: "primary",
        author: "Katala",
        url: "https://example.com/release",
        publishedAt: now,
      },
      domain: "tech",
      retrievedAt: now,
      language: "en",
      ...overrides,
    };
  }

  it("requires the #55 transparency and audit design controls", () => {
    const plan: TrustInfrastructurePlan = {
      algorithmOpenSource: true,
      algorithmRoadmap: ["publish weights", "publish benchmark fixtures"],
      conflictDisclosure: "disclosed",
      falsifiableScoreView: true,
      parallelCriteria: ["katala-default", "community-standard"],
      immutableLog: true,
      thirdPartyAudit: "quarterly",
      distributedEvaluation: true,
      criteriaVersioning: true,
      criteriaDiffView: true,
    };

    const assessment = assessTrustInfrastructure(plan);

    expect(assessment.passed).toBe(true);
    expect(assessment.capabilities).toContain("parallel criteria display");
    expect(assessment.score).toBe(1);
  });

  it("builds falsifiable score evidence with revision history", () => {
    const scorer = new TrustScorer();
    const result = scorer.score(claim());

    const view = buildScoreEvidenceView(result, {
      standardId: "katala-default",
      standardVersion: "2026.06",
      evidenceRefs: ["release-note", "security-advisory"],
      revisionHashes: ["abc123", "def456"],
    });

    expect(view.falsifiable).toBe(true);
    expect(view.revisionCount).toBe(2);
    expect(view.standardVersion).toBe("2026.06");
  });

  it("diffs criteria versions for score openness", () => {
    const diff = diffCriteriaVersions(
      { freshness: 0.2, provenance: 0.35 },
      { freshness: 0.15, provenance: 0.4, independence: 0.2 },
    );

    expect(diff).toContainEqual({ criterion: "freshness", before: 0.2, after: 0.15, delta: -0.05 });
    expect(diff).toContainEqual({ criterion: "independence", before: null, after: 0.2, delta: null });
  });

  it("maps #49 LLM annotation and slop filtering into TrustScorer inputs", () => {
    const good = annotateForTrustScorer("Official paper with source and retrieved evidence.");
    const bad = annotateForTrustScorer("Secret guaranteed 100% result, no evidence, click now.");

    expect(good.labels).toContain("source_request");
    expect(passesQualityFilter(good)).toBe(true);
    expect(bad.labels).toContain("low_quality");
    expect(bad.reasons.some((reason) => reason.includes("100"))).toBe(true);
    expect(passesQualityFilter(bad)).toBe(false);
  });

  it("finds two-hop trust chains and applies feedback hierarchy", () => {
    const chains = findTwoHopTrustChains(
      [
        { from: "alice", to: "bob", weight: 0.8 },
        { from: "bob", to: "carol", weight: 0.7 },
        { from: "alice", to: "mallory", weight: 0.3 },
        { from: "mallory", to: "carol", weight: 0.2 },
      ],
      "alice",
      "carol",
    );

    expect(chains).toEqual([{ path: ["alice", "bob", "carol"], strength: 0.56 }]);
    expect(feedbackPenalty("block")).toBeGreaterThan(feedbackPenalty("report"));
    expect(feedbackPenalty("report")).toBeGreaterThan(feedbackPenalty("dont_like"));
  });
});
