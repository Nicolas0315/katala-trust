import { LLMAdapter, MockLLMAdapter } from "./llm-adapter";
import { IdentityVector } from "./types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export class ProfilingEngine {
  private adapter: LLMAdapter;

  constructor(adapter?: LLMAdapter) {
    this.adapter = adapter ?? new MockLLMAdapter();
  }

  /**
   * Analyzes chat history to update the user's Identity Vector.
   */
  async updateProfile(
    currentVector: IdentityVector,
    history: ChatMessage[],
  ): Promise<IdentityVector> {
    const analysis = await this.adapter.analyze(history);

    const updatedVector: IdentityVector = {
      ...currentVector,
      personality: {
        ...currentVector.personality,
        ...analysis.personality,
      },
      values: Array.from(new Set([...currentVector.values, ...(analysis.values ?? [])])),
      professionalFocus: Array.from(
        new Set([...currentVector.professionalFocus, ...(analysis.professionalFocus ?? [])]),
      ),
      socialEnergy: {
        ...currentVector.socialEnergy,
        ...analysis.socialEnergy,
      },
      meta: {
        confidenceScore: this.calculateConfidence(history),
        lastUpdated: new Date().toISOString(),
      },
    };

    return updatedVector;
  }

  /**
   * Process explicit user requests for profile adjustment ("Dialogue Tuning").
   */
  async tuneProfile(
    currentVector: IdentityVector,
    tuningInstruction: string,
  ): Promise<IdentityVector> {
    console.log(`Tuning profile with instruction: ${tuningInstruction}`);

    const instruction = tuningInstruction.toLowerCase();
    const updated: IdentityVector = {
      ...currentVector,
      personality: { ...currentVector.personality },
      values: [...currentVector.values],
      professionalFocus: [...currentVector.professionalFocus],
      socialEnergy: { ...currentVector.socialEnergy },
      meta: { ...currentVector.meta },
    };

    if (instruction.includes("outgoing") || instruction.includes("extravert")) {
      updated.personality = {
        ...updated.personality,
        extraversion: this.clamp(updated.personality.extraversion + 0.2),
      };
    }
    if (instruction.includes("introvert") || instruction.includes("reserved")) {
      updated.personality.extraversion = this.clamp(updated.personality.extraversion - 0.2);
    }
    if (instruction.includes("abstract") || instruction.includes("theoretical")) {
      updated.personality.intuition = this.clamp(updated.personality.intuition + 0.15);
    }
    if (instruction.includes("practical") || instruction.includes("concrete")) {
      updated.personality.intuition = this.clamp(updated.personality.intuition - 0.15);
    }
    if (instruction.includes("logical") || instruction.includes("analytical")) {
      updated.personality.thinking = this.clamp(updated.personality.thinking + 0.15);
    }
    if (instruction.includes("empathetic") || instruction.includes("feeling")) {
      updated.personality.thinking = this.clamp(updated.personality.thinking - 0.15);
    }
    if (instruction.includes("structured") || instruction.includes("planned")) {
      updated.personality.judging = this.clamp(updated.personality.judging + 0.15);
    }
    if (instruction.includes("flexible") || instruction.includes("spontaneous")) {
      updated.personality.judging = this.clamp(updated.personality.judging - 0.15);
    }

    const tone = instruction.match(/\btone\s+(concise|enthusiastic|professional|casual)\b/);
    if (tone) {
      updated.socialEnergy.preferredTone = tone[1] as IdentityVector["socialEnergy"]["preferredTone"];
    }

    const battery = instruction.match(/\bbattery\s+(\d{1,3})\b/);
    if (battery) {
      updated.socialEnergy.battery = Math.round(this.clamp(Number(battery[1]) / 100) * 100);
    }

    this.appendDirective(updated.values, instruction, /\bvalue\s+([a-z0-9 -]{2,40})/);
    this.appendDirective(updated.professionalFocus, instruction, /\bfocus\s+(?:on\s+)?([a-z0-9 -]{2,40})/);

    updated.meta = {
      ...updated.meta,
      lastUpdated: new Date().toISOString(),
      confidenceScore: Math.min(1, updated.meta.confidenceScore + 0.1),
    };

    return updated;
  }

  private calculateConfidence(history: ChatMessage[]): number {
    const messageCount = history.length;
    const baseConfidence = Math.min(messageCount / 50, 0.9);
    return baseConfidence;
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private appendDirective(target: string[], instruction: string, pattern: RegExp): void {
    const match = instruction.match(pattern);
    const value = match?.[1]?.trim().replace(/\s+/g, " ");
    if (value && !target.includes(value)) {
      target.push(value);
    }
  }
}
