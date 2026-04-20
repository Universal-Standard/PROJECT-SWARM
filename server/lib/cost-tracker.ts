import { db } from "../db";
import {
  executionCosts,
  providerPricing,
  executions,
  agents,
  workflows,
  type ExecutionCost,
  type ProviderPricing,
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { logger } from "./logger";

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface CostAnalytics {
  totalCost: number;
  period: string;
  breakdown: {
    byWorkflow: Array<{ workflowId: string; workflowName: string; cost: number }>;
    byProvider: Array<{ provider: string; cost: number }>;
    byModel: Array<{ model: string; cost: number }>;
    byAgent: Array<{ agentId: string; agentName: string; cost: number }>;
  };
}

export class CostTracker {
  /**
   * Initialize default pricing table
   */
  async initializePricing(): Promise<void> {
    const defaultPricing: Array<Omit<ProviderPricing, "id" | "effectiveDate" | "updatedAt">> = [
      // OpenAI pricing (per 1M tokens in cents)
      {
        provider: "openai",
        model: "gpt-4",
        inputTokenPrice: 3000,
        outputTokenPrice: 6000,
        currency: "USD",
      },
      {
        provider: "openai",
        model: "gpt-4-turbo",
        inputTokenPrice: 1000,
        outputTokenPrice: 3000,
        currency: "USD",
      },
      {
        provider: "openai",
        model: "gpt-3.5-turbo",
        inputTokenPrice: 50,
        outputTokenPrice: 150,
        currency: "USD",
      },

      // Anthropic pricing
      {
        provider: "anthropic",
        model: "claude-3-opus-20240229",
        inputTokenPrice: 1500,
        outputTokenPrice: 7500,
        currency: "USD",
      },
      {
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        inputTokenPrice: 300,
        outputTokenPrice: 1500,
        currency: "USD",
      },
      {
        provider: "anthropic",
        model: "claude-3-haiku-20240307",
        inputTokenPrice: 25,
        outputTokenPrice: 125,
        currency: "USD",
      },

      // Gemini pricing
      {
        provider: "gemini",
        model: "gemini-1.5-pro",
        inputTokenPrice: 125,
        outputTokenPrice: 500,
        currency: "USD",
      },
      {
        provider: "gemini",
        model: "gemini-1.5-flash",
        inputTokenPrice: 7,
        outputTokenPrice: 30,
        currency: "USD",
      },
    ];

    for (const pricing of defaultPricing) {
      // Check if pricing already exists
      const existing = await db.query.providerPricing.findFirst({
        where: and(
          eq(providerPricing.provider, pricing.provider),
          eq(providerPricing.model, pricing.model)
        ),
      });

      if (!existing) {
        await db.insert(providerPricing).values(pricing);
      }
    }

    logger.info("Initialized provider pricing", { count: defaultPricing.length });
  }

  /**
   * Track cost for an execution
   */
  async trackExecutionCost(
    executionId: string,
    agentId: string,
    provider: string,
    model: string,
    tokenUsage: TokenUsage
  ): Promise<ExecutionCost> {
    // Get pricing for provider and model
    const pricing = await db.query.providerPricing.findFirst({
      where: and(eq(providerPricing.provider, provider), eq(providerPricing.model, model)),
    });

    let costUsd = 0;
    if (pricing) {
      // Calculate cost in cents
      const inputCost = (tokenUsage.inputTokens / 1_000_000) * pricing.inputTokenPrice;
      const outputCost = (tokenUsage.outputTokens / 1_000_000) * pricing.outputTokenPrice;
      costUsd = Math.round(inputCost + outputCost);
    }

    // Store cost record
    const [cost] = await db
      .insert(executionCosts)
      .values({
        executionId,
        agentId,
        provider,
        model,
        promptTokens: tokenUsage.inputTokens,
        completionTokens: tokenUsage.outputTokens,
        totalTokens: tokenUsage.totalTokens,
        costUsd,
      })
      .returning();

    return cost;
  }

  /**
   * Get cost analytics for a time period
   */
  async getCostAnalytics(userId: string, startDate: Date, endDate: Date): Promise<CostAnalytics> {
    // Get all execution costs in the period, joining workflows to get their names
    const costs = await db
      .select({
        cost: executionCosts,
        execution: executions,
        agent: agents,
        workflowName: workflows.name,
      })
      .from(executionCosts)
      .innerJoin(executions, eq(executionCosts.executionId, executions.id))
      .innerJoin(agents, eq(executionCosts.agentId, agents.id))
      .innerJoin(workflows, eq(executions.workflowId, workflows.id))
      .where(
        and(
          eq(executions.userId, userId),
          gte(executionCosts.timestamp, startDate),
          lte(executionCosts.timestamp, endDate)
        )
      );

    // Calculate total cost
    const totalCost = costs.reduce((sum, record) => sum + (record.cost.costUsd || 0), 0);

    // Breakdown by workflow
    const workflowCosts = new Map<string, { name: string; cost: number }>();
    costs.forEach((record) => {
      const wfId = record.execution.workflowId;
      if (!workflowCosts.has(wfId)) {
        workflowCosts.set(wfId, { name: record.workflowName, cost: 0 });
      }
      workflowCosts.get(wfId)!.cost += record.cost.costUsd || 0;
    });

    // Breakdown by provider
    const providerCosts = new Map<string, number>();
    costs.forEach((record) => {
      const provider = record.cost.provider;
      providerCosts.set(provider, (providerCosts.get(provider) || 0) + (record.cost.costUsd || 0));
    });

    // Breakdown by model
    const modelCosts = new Map<string, number>();
    costs.forEach((record) => {
      const model = record.cost.model;
      modelCosts.set(model, (modelCosts.get(model) || 0) + (record.cost.costUsd || 0));
    });

    // Breakdown by agent
    const agentCosts = new Map<string, { name: string; cost: number }>();
    costs.forEach((record) => {
      const agentId = record.agent.id;
      if (!agentCosts.has(agentId)) {
        agentCosts.set(agentId, { name: record.agent.name, cost: 0 });
      }
      const agent = agentCosts.get(agentId)!;
      agent.cost += record.cost.costUsd || 0;
    });

    const period = `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`;

    return {
      totalCost,
      period,
      breakdown: {
        byWorkflow: Array.from(workflowCosts.entries())
          .map(([workflowId, data]) => ({
            workflowId,
            workflowName: data.name,
            cost: data.cost,
          }))
          .sort((a, b) => b.cost - a.cost),
        byProvider: Array.from(providerCosts.entries())
          .map(([provider, cost]) => ({ provider, cost }))
          .sort((a, b) => b.cost - a.cost),
        byModel: Array.from(modelCosts.entries())
          .map(([model, cost]) => ({ model, cost }))
          .sort((a, b) => b.cost - a.cost),
        byAgent: Array.from(agentCosts.entries())
          .map(([agentId, data]) => ({
            agentId,
            agentName: data.name,
            cost: data.cost,
          }))
          .sort((a, b) => b.cost - a.cost),
      },
    };
  }

  /**
   * Get token usage statistics
   */
  async getTokenUsageStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    byProvider: Array<{ provider: string; tokens: number }>;
  }> {
    const costs = await db
      .select({
        cost: executionCosts,
        execution: executions,
      })
      .from(executionCosts)
      .innerJoin(executions, eq(executionCosts.executionId, executions.id))
      .where(
        and(
          eq(executions.userId, userId),
          gte(executionCosts.timestamp, startDate),
          lte(executionCosts.timestamp, endDate)
        )
      );

    const totalTokens = costs.reduce((sum, r) => sum + (r.cost.totalTokens || 0), 0);
    const inputTokens = costs.reduce((sum, r) => sum + (r.cost.promptTokens || 0), 0);
    const outputTokens = costs.reduce((sum, r) => sum + (r.cost.completionTokens || 0), 0);

    const providerTokens = new Map<string, number>();
    costs.forEach((record) => {
      const provider = record.cost.provider;
      providerTokens.set(
        provider,
        (providerTokens.get(provider) || 0) + (record.cost.totalTokens || 0)
      );
    });

    return {
      totalTokens,
      inputTokens,
      outputTokens,
      byProvider: Array.from(providerTokens.entries())
        .map(([provider, tokens]) => ({ provider, tokens }))
        .sort((a, b) => b.tokens - a.tokens),
    };
  }

  /**
   * Get cost trends (daily aggregation)
   */
  async getCostTrends(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; cost: number }>> {
    const costs = await db
      .select({
        cost: executionCosts,
        execution: executions,
      })
      .from(executionCosts)
      .innerJoin(executions, eq(executionCosts.executionId, executions.id))
      .where(
        and(
          eq(executions.userId, userId),
          gte(executionCosts.timestamp, startDate),
          lte(executionCosts.timestamp, endDate)
        )
      )
      .orderBy(executionCosts.timestamp);

    // Group by date
    const dailyCosts = new Map<string, number>();
    costs.forEach((record) => {
      const date = record.cost.timestamp.toISOString().split("T")[0];
      dailyCosts.set(date, (dailyCosts.get(date) || 0) + (record.cost.costUsd || 0));
    });

    return Array.from(dailyCosts.entries())
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get most expensive workflows
   */
  async getMostExpensiveWorkflows(
    userId: string,
    limit: number = 10
  ): Promise<
    Array<{ workflowId: string; workflowName: string; totalCost: number; executionCount: number }>
  > {
    const costs = await db
      .select({
        cost: executionCosts,
        execution: executions,
        workflowName: workflows.name,
      })
      .from(executionCosts)
      .innerJoin(executions, eq(executionCosts.executionId, executions.id))
      .innerJoin(workflows, eq(executions.workflowId, workflows.id))
      .where(eq(executions.userId, userId));

    // Group by workflow
    const workflowStats = new Map<
      string,
      { name: string; totalCost: number; executionCount: number }
    >();
    costs.forEach((record) => {
      const wfId = record.execution.workflowId;
      if (!workflowStats.has(wfId)) {
        workflowStats.set(wfId, {
          name: record.workflowName,
          totalCost: 0,
          executionCount: 0,
        });
      }
      const stats = workflowStats.get(wfId)!;
      stats.totalCost += record.cost.costUsd || 0;
      stats.executionCount++;
    });

    return Array.from(workflowStats.entries())
      .map(([workflowId, stats]) => ({
        workflowId,
        workflowName: stats.name,
        totalCost: stats.totalCost,
        executionCount: stats.executionCount,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }

  /**
   * Export cost report as CSV
   */
  async exportCostReport(userId: string, startDate: Date, endDate: Date): Promise<string> {
    const costs = await db
      .select({
        cost: executionCosts,
        execution: executions,
        agent: agents,
      })
      .from(executionCosts)
      .innerJoin(executions, eq(executionCosts.executionId, executions.id))
      .innerJoin(agents, eq(executionCosts.agentId, agents.id))
      .where(
        and(
          eq(executions.userId, userId),
          gte(executionCosts.timestamp, startDate),
          lte(executionCosts.timestamp, endDate)
        )
      );

    // Build CSV
    const headers = [
      "Date",
      "Execution ID",
      "Workflow ID",
      "Agent",
      "Provider",
      "Model",
      "Prompt Tokens",
      "Completion Tokens",
      "Total Tokens",
      "Cost (micro-cents)",
    ];

    const rows = costs.map((record) => [
      record.cost.timestamp.toISOString(),
      record.execution.id,
      record.execution.workflowId,
      record.agent.name,
      record.cost.provider,
      record.cost.model,
      record.cost.promptTokens,
      record.cost.completionTokens,
      record.cost.totalTokens,
      record.cost.costUsd,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
  }

  /**
   * Update provider pricing
   */
  async updatePricing(
    provider: string,
    model: string,
    inputTokenPrice: number,
    outputTokenPrice: number
  ): Promise<void> {
    const existing = await db.query.providerPricing.findFirst({
      where: and(eq(providerPricing.provider, provider), eq(providerPricing.model, model)),
    });

    if (existing) {
      await db
        .update(providerPricing)
        .set({
          inputTokenPrice,
          outputTokenPrice,
          updatedAt: new Date(),
        })
        .where(eq(providerPricing.id, existing.id));
    } else {
      await db.insert(providerPricing).values({
        provider,
        model,
        inputTokenPrice,
        outputTokenPrice,
      });
    }
  }
}

export const costTracker = new CostTracker();
