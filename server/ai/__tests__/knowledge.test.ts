import { describe, it, expect } from "vitest";
import { extractKnowledgeLearnings } from "../knowledge";

describe("extractKnowledgeLearnings", () => {
  it("extracts structured learnings with confidence scoring", () => {
    const response = `
      Learned: Use dependency injection to isolate side effects in tests.
      Best practice: Validate request payloads before using them.
      Overall: Consistent validation reduces runtime failures and improves reliability.
    `;

    const learnings = extractKnowledgeLearnings(response);

    expect(learnings.length).toBeGreaterThan(0);
    expect(learnings.every((entry) => entry.confidence >= 0 && entry.confidence <= 100)).toBe(true);
    expect(learnings.some((entry) => entry.content.includes("dependency injection"))).toBe(true);
  });

  it("extracts coding knowledge from code blocks with high confidence", () => {
    const response = `
\`\`\`ts
export async function validateInput(payload: unknown): Promise<boolean> {
  if (!payload) return false;
  return true;
}
\`\`\`
    `;

    const learnings = extractKnowledgeLearnings(response);
    const codingEntry = learnings.find((entry) => entry.category === "coding");

    expect(codingEntry).toBeDefined();
    expect(codingEntry?.context).toBe("Code example from execution");
    expect(codingEntry?.confidence).toBeGreaterThanOrEqual(82);
  });

  it("deduplicates equivalent learnings", () => {
    const response = `
      Learned: Always validate input payloads before processing.
      Learned: Always validate input payloads before processing.
    `;

    const learnings = extractKnowledgeLearnings(response);

    expect(learnings).toHaveLength(1);
  });
});
