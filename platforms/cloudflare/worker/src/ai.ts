import type { Env } from "./types";
import type { WorkflowNode, AgentResult } from "./types";

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Pricing in micro-cents per 1M tokens (1/1000000 USD)
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o":              { input:  5_000_000, output: 15_000_000 },
  "gpt-4o-mini":         { input:    150_000, output:    600_000 },
  "gpt-4-turbo":         { input: 10_000_000, output: 30_000_000 },
  "gpt-3.5-turbo":       { input:    500_000, output:  1_500_000 },
  "claude-3-5-sonnet-20241022": { input: 3_000_000, output: 15_000_000 },
  "claude-3-haiku-20240307":    { input:   250_000, output:  1_250_000 },
  "claude-3-opus-20240229":     { input: 15_000_000, output: 75_000_000 },
  "gemini-1.5-flash":    { input:     75_000, output:    300_000 },
  "gemini-1.5-pro":      { input:  1_250_000, output:  5_000_000 },
};

function calcCostMicroCents(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] ?? { input: 0, output: 0 };
  return Math.round((p.input * inputTokens + p.output * outputTokens) / 1_000_000);
}

export async function runAgent(
  node: WorkflowNode,
  messages: AIMessage[],
  env: Env,
  ctx: ExecutionContext
): Promise<AgentResult> {
  const provider = node.data.provider || "openai";
  const model = node.data.model || "gpt-4o-mini";
  const maxTokens = node.data.maxTokens || 1000;

  let response = "";
  let inputTokens = 0;
  let outputTokens = 0;

  if (provider === "openai" && env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    });
    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
      error?: { message: string };
    };
    if (data.error) throw new Error(`OpenAI error: ${data.error.message}`);
    response = data.choices?.[0]?.message?.content ?? "";
    inputTokens = data.usage?.prompt_tokens ?? 0;
    outputTokens = data.usage?.completion_tokens ?? 0;

  } else if (provider === "anthropic" && env.ANTHROPIC_API_KEY) {
    const systemMsg = messages.find(m => m.role === "system")?.content;
    const userMsgs = messages.filter(m => m.role !== "system");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model, max_tokens: maxTokens,
        ...(systemMsg ? { system: systemMsg } : {}),
        messages: userMsgs.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      }),
    });
    const data = await res.json() as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
      error?: { message: string };
    };
    if (data.error) throw new Error(`Anthropic error: ${data.error.message}`);
    response = data.content?.find(c => c.type === "text")?.text ?? "";
    inputTokens = data.usage?.input_tokens ?? 0;
    outputTokens = data.usage?.output_tokens ?? 0;

  } else if (provider === "gemini" && env.GEMINI_API_KEY) {
    const userContent = messages.map(m => m.content).join("\n");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userContent }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    );
    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
      error?: { message: string };
    };
    if (data.error) throw new Error(`Gemini error: ${data.error.message}`);
    response = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    inputTokens = data.usageMetadata?.promptTokenCount ?? 0;
    outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0;

  } else {
    response = `[No AI provider configured for ${provider}. Set the appropriate API key secret.]`;
  }

  return {
    nodeId: node.id,
    agentName: node.data.label || node.id,
    provider,
    model,
    response,
    tokenCount: inputTokens + outputTokens,
    costUsd: calcCostMicroCents(model, inputTokens, outputTokens),
  };
}
