export type AnnotationLabel = "claim" | "opinion" | "unsafe" | "low_quality" | "source_request";
export type FeedbackAction = "dont_like" | "report" | "mute" | "block";

export interface TrustAnnotation {
  labels: AnnotationLabel[];
  qualityScore: number;
  reasons: string[];
}

export interface TrustGraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface TrustChain {
  path: string[];
  strength: number;
}

const LOW_QUALITY_PATTERNS = [
  /\bguaranteed\b/i,
  /\b100\s*%/,
  /\bsecret\b/i,
  /\bclick\b/i,
  /\bno evidence\b/i,
];

function pushUnique<T>(items: T[], item: T): void {
  if (!items.includes(item)) items.push(item);
}

export function annotateForTrustScorer(content: string): TrustAnnotation {
  const labels: AnnotationLabel[] = [];
  const reasons: string[] = [];

  if (/\b(source|citation|evidence|official|paper|retrieved)\b/i.test(content)) {
    pushUnique(labels, "source_request");
  }
  if (/\b(i think|opinion|maybe|probably)\b/i.test(content)) {
    pushUnique(labels, "opinion");
  } else {
    pushUnique(labels, "claim");
  }
  if (/\b(hack|exploit|credential|token leak)\b/i.test(content)) {
    pushUnique(labels, "unsafe");
    reasons.push("security-sensitive term");
  }

  const qualityPenalty = LOW_QUALITY_PATTERNS.reduce((penalty, pattern) => {
    if (pattern.test(content)) {
      reasons.push(`matched low-quality pattern: ${pattern.source}`);
      return penalty + 0.18;
    }
    return penalty;
  }, 0);
  const qualityScore = Number(Math.max(0, 1 - qualityPenalty).toFixed(4));
  if (qualityScore < 0.7) pushUnique(labels, "low_quality");

  return {
    labels,
    qualityScore,
    reasons,
  };
}

export function passesQualityFilter(annotation: TrustAnnotation, threshold = 0.7): boolean {
  return annotation.qualityScore >= threshold && !annotation.labels.includes("unsafe");
}

export function findTwoHopTrustChains(
  edges: TrustGraphEdge[],
  source: string,
  target: string,
  minStrength = 0.25,
): TrustChain[] {
  const firstHop = edges.filter((edge) => edge.from === source);
  const chains: TrustChain[] = [];

  for (const first of firstHop) {
    const secondHop = edges.filter((edge) => edge.from === first.to && edge.to === target);
    for (const second of secondHop) {
      const strength = Number((first.weight * second.weight).toFixed(4));
      if (strength >= minStrength) {
        chains.push({ path: [source, first.to, target], strength });
      }
    }
  }

  return chains.sort((a, b) => b.strength - a.strength);
}

export function feedbackPenalty(action: FeedbackAction): number {
  switch (action) {
    case "dont_like":
      return 0.1;
    case "report":
      return 0.35;
    case "mute":
      return 0.5;
    case "block":
      return 0.8;
  }
}
