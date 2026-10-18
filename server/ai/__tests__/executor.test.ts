import { afterEach, describe, expect, it } from "vitest";
import type { Agent } from "@shared/schema";
import { AIExecutor } from "../executor";

const originalProviderKeys = {
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  gemini: process.env.GEMINI_API_KEY,
};

function clearProviderKeys(): void {
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GEMINI_API_KEY;
}

function restoreProviderKeys(): void {
  if (originalProviderKeys.openai) process.env.OPENAI_API_KEY = originalProviderKeys.openai;
  else delete process.env.OPENAI_API_KEY;

  if (originalProviderKeys.anthropic) {
    process.env.ANTHROPIC_API_KEY = originalProviderKeys.anthropic;
  } else {
    delete process.env.ANTHROPIC_API_KEY;
  }

  if (originalProviderKeys.gemini) process.env.GEMINI_API_KEY = originalProviderKeys.gemini;
  else delete process.env.GEMINI_API_KEY;
}

describe("AIExecutor provider configuration", () => {
  afterEach(() => {
    restoreProviderKeys();
  });

  it("can be constructed without provider credentials", () => {
    clearProviderKeys();

    expect(() => new AIExecutor()).not.toThrow();
  });

  it("fails closed when an invoked provider is not configured", async () => {
    clearProviderKeys();
    const executor = new AIExecutor();
    const agent = {
      provider: "openai",
      model: "gpt-4o-mini",
      systemPrompt: "You are a test agent.",
    } as Agent;

    await expect(
      executor.executeAgent(agent, {
        agentId: "test-agent",
        messages: [{ role: "user", content: "hello" }],
        temperature: 70,
        maxTokens: 32,
        enableFallback: false,
      })
    ).rejects.toThrow("OPENAI_API_KEY is not configured");
  });
});
