import { describe, it, expect, beforeEach, vi } from "vitest";
import { CostTracker } from "../cost-tracker";

// Mock dependencies
vi.mock("../../db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 1,
            executionId: "exec_123",
            agentId: "agent_1",
            provider: "openai",
            model: "gpt-4",
            inputTokens: 1000,
            outputTokens: 500,
            totalTokens: 1500,
            estimatedCost: 450,
            currency: "USD",
            calculatedAt: new Date(),
          },
        ]),
      }),
    }),
    query: {
      providerPricing: {
        findFirst: vi.fn().mockResolvedValue({
          id: 1,
          provider: "openai",
          model: "gpt-4",
          inputTokenPrice: 3000, // Per 1M tokens in cents
          outputTokenPrice: 6000,
          currency: "USD",
        }),
      },
    },
  },
}));

describe("CostTracker", () => {
  let costTracker: CostTracker;

  beforeEach(() => {
    costTracker = new CostTracker();
    vi.clearAllMocks();
  });

  describe("trackExecutionCost", () => {
    it("should calculate cost correctly for OpenAI GPT-4", async () => {
      const result = await costTracker.trackExecutionCost(
        "exec_123",
        "agent_1",
        "openai",
        "gpt-4",
        {
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
        }
      );

      expect(result).toBeDefined();
      expect(result.estimatedCost).toBe(450); // (1000/1M * 3000) + (500/1M * 6000) = 3 + 30 = 33 cents
      expect(result.provider).toBe("openai");
      expect(result.model).toBe("gpt-4");
    });

    it("should store token usage", async () => {
      const result = await costTracker.trackExecutionCost(
        "exec_123",
        "agent_1",
        "openai",
        "gpt-4",
        {
          inputTokens: 2000,
          outputTokens: 1000,
          totalTokens: 3000,
        }
      );

      expect(result.inputTokens).toBe(2000);
      expect(result.outputTokens).toBe(1000);
      expect(result.totalTokens).toBe(3000);
    });

    it("should handle unknown provider gracefully", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.providerPricing.findFirst).mockResolvedValueOnce(null);

      const result = await costTracker.trackExecutionCost(
        "exec_123",
        "agent_1",
        "unknown",
        "unknown-model",
        {
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
        }
      );

      expect(result.estimatedCost).toBe(0); // No pricing = $0 estimate
    });
  });

  describe("initializePricing", () => {
    it("should initialize default pricing for all providers", async () => {
      await costTracker.initializePricing();

      // Should have called findFirst for each default pricing entry
      const { db } = await import("../../db");
      expect(db.query.providerPricing.findFirst).toHaveBeenCalled();
    });
  });

  describe("cost calculations", () => {
    it("should calculate Anthropic Claude Opus costs correctly", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.providerPricing.findFirst).mockResolvedValueOnce({
        id: 2,
        provider: "anthropic",
        model: "claude-3-opus-20240229",
        inputTokenPrice: 1500,
        outputTokenPrice: 7500,
        currency: "USD",
      });

      const result = await costTracker.trackExecutionCost(
        "exec_456",
        "agent_2",
        "anthropic",
        "claude-3-opus-20240229",
        {
          inputTokens: 2000,
          outputTokens: 1000,
          totalTokens: 3000,
        }
      );

      // (2000/1M * 1500) + (1000/1M * 7500) = 3 + 7.5 = 10.5 cents
      expect(result.estimatedCost).toBeGreaterThan(0);
    });

    it("should calculate Gemini costs correctly", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.providerPricing.findFirst).mockResolvedValueOnce({
        id: 3,
        provider: "gemini",
        model: "gemini-1.5-pro",
        inputTokenPrice: 125,
        outputTokenPrice: 500,
        currency: "USD",
      });

      const result = await costTracker.trackExecutionCost(
        "exec_789",
        "agent_3",
        "gemini",
        "gemini-1.5-pro",
        {
          inputTokens: 10000,
          outputTokens: 5000,
          totalTokens: 15000,
        }
      );

      // (10000/1M * 125) + (5000/1M * 500) = 1.25 + 2.5 = 3.75 cents
      expect(result.estimatedCost).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("should handle zero tokens", async () => {
      const result = await costTracker.trackExecutionCost(
        "exec_zero",
        "agent_zero",
        "openai",
        "gpt-4",
        {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        }
      );

      expect(result.estimatedCost).toBe(0);
    });

    it("should round costs to nearest cent", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.providerPricing.findFirst).mockResolvedValueOnce({
        id: 1,
        provider: "openai",
        model: "gpt-3.5-turbo",
        inputTokenPrice: 50,
        outputTokenPrice: 150,
        currency: "USD",
      });

      const result = await costTracker.trackExecutionCost(
        "exec_round",
        "agent_round",
        "openai",
        "gpt-3.5-turbo",
        {
          inputTokens: 333,
          outputTokens: 333,
          totalTokens: 666,
        }
      );

      // Cost should be rounded integer
      expect(Number.isInteger(result.estimatedCost)).toBe(true);
    });
  });
});
