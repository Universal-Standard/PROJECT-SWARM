import type { D1Database, KVNamespace, R2Bucket, Queue, DurableObjectNamespace } from "@cloudflare/workers-types";

export interface Env {
  // D1 Database
  DB: D1Database;
  // KV Namespaces
  SESSIONS: KVNamespace;
  RATE_LIMIT: KVNamespace;
  // R2 Bucket
  STORAGE: R2Bucket;
  // Queues
  EXECUTION_QUEUE: Queue<ExecutionJob>;
  // Durable Objects
  WS_ROOMS: DurableObjectNamespace;
  // Secrets
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GEMINI_API_KEY: string;
  SESSION_SECRET: string;
  ENCRYPTION_KEY: string;
}

export interface ExecutionJob {
  executionId: string;
  workflowId: string;
  userId: string;
  input: unknown;
  agentIndex: number;
  previousResults: AgentResult[];
}

export interface AgentResult {
  nodeId: string;
  agentName: string;
  provider: string;
  model: string;
  response: string;
  tokenCount?: number;
  costMicroCents?: number;
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label?: string;
    role?: string;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    description?: string;
    capabilities?: string[];
  };
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface Session {
  userId: string;
  githubToken?: string;
  createdAt: number;
  expiresAt: number;
}
