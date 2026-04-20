import type { D1Database } from "@cloudflare/workers-types";

function randomId(prefix: string): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}

function nowSecs(): number {
  return Math.floor(Date.now() / 1000);
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function createWorkflow(db: D1Database, data: {
  userId: string;
  name: string;
  description?: string;
  nodes?: unknown[];
  edges?: unknown[];
  isTemplate?: boolean;
  category?: string;
}) {
  const id = randomId("wf");
  const now = nowSecs();
  await db.prepare(`
    INSERT INTO workflow_defs (id, user_id, name, description, nodes, edges, is_template, category, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.userId, data.name, data.description ?? null,
    JSON.stringify(data.nodes ?? []), JSON.stringify(data.edges ?? []),
    data.isTemplate ? 1 : 0, data.category ?? null, now, now
  ).run();
  return getWorkflowById(db, id);
}

export async function getWorkflowById(db: D1Database, id: string) {
  const row = await db.prepare("SELECT * FROM workflow_defs WHERE id = ?").bind(id).first<Record<string, unknown>>();
  if (!row) return null;
  return deserializeWorkflow(row);
}

export async function listWorkflowsByUser(db: D1Database, userId: string) {
  const { results } = await db.prepare(
    "SELECT * FROM workflow_defs WHERE user_id = ? ORDER BY updated_at DESC"
  ).bind(userId).all<Record<string, unknown>>();
  return results.map(deserializeWorkflow);
}

export async function updateWorkflow(db: D1Database, id: string, data: Partial<{
  name: string;
  description: string | null;
  nodes: unknown[];
  edges: unknown[];
  category: string | null;
}>) {
  const parts: string[] = ["updated_at = ?"];
  const vals: unknown[] = [nowSecs()];
  if (data.name !== undefined)        { parts.push("name = ?");        vals.push(data.name); }
  if (data.description !== undefined) { parts.push("description = ?"); vals.push(data.description); }
  if (data.nodes !== undefined)       { parts.push("nodes = ?");       vals.push(JSON.stringify(data.nodes)); }
  if (data.edges !== undefined)       { parts.push("edges = ?");       vals.push(JSON.stringify(data.edges)); }
  if (data.category !== undefined)    { parts.push("category = ?");    vals.push(data.category); }
  vals.push(id);
  await db.prepare(`UPDATE workflow_defs SET ${parts.join(", ")} WHERE id = ?`).bind(...vals).run();
  return getWorkflowById(db, id);
}

export async function deleteWorkflow(db: D1Database, id: string) {
  await db.prepare("DELETE FROM workflow_defs WHERE id = ?").bind(id).run();
}

function deserializeWorkflow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: row.description as string | null,
    nodes: JSON.parse((row.nodes as string) || "[]") as unknown[],
    edges: JSON.parse((row.edges as string) || "[]") as unknown[],
    isTemplate: Boolean(row.is_template),
    category: row.category as string | null,
    createdAt: new Date((row.created_at as number) * 1000).toISOString(),
    updatedAt: new Date((row.updated_at as number) * 1000).toISOString(),
  };
}

// ─── Executions ───────────────────────────────────────────────────────────────

export async function createExecution(db: D1Database, data: {
  workflowId: string;
  userId: string;
  input?: unknown;
  status?: string;
}) {
  const id = randomId("exec");
  const now = nowSecs();
  await db.prepare(`
    INSERT INTO execution_runs (id, workflow_id, user_id, status, input, started_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, data.workflowId, data.userId, data.status ?? "queued", JSON.stringify(data.input ?? {}), now, now, now).run();
  return getExecutionById(db, id);
}

export async function getExecutionById(db: D1Database, id: string) {
  const row = await db.prepare("SELECT * FROM execution_runs WHERE id = ?").bind(id).first<Record<string, unknown>>();
  if (!row) return null;
  return deserializeExecution(row);
}

export async function listExecutionsByUser(db: D1Database, userId: string, workflowId?: string) {
  const query = workflowId
    ? "SELECT * FROM execution_runs WHERE user_id = ? AND workflow_id = ? ORDER BY started_at DESC LIMIT 50"
    : "SELECT * FROM execution_runs WHERE user_id = ? ORDER BY started_at DESC LIMIT 50";
  const stmt = workflowId
    ? db.prepare(query).bind(userId, workflowId)
    : db.prepare(query).bind(userId);
  const { results } = await stmt.all<Record<string, unknown>>();
  return results.map(deserializeExecution);
}

export async function updateExecution(db: D1Database, id: string, data: Partial<{
  status: string;
  output: unknown;
  error: string | null;
  costCents: number;
}>) {
  const parts: string[] = ["updated_at = ?"];
  const vals: unknown[] = [nowSecs()];
  if (data.status !== undefined) {
    parts.push("status = ?");
    vals.push(data.status);
    if (["completed", "failed"].includes(data.status)) {
      parts.push("completed_at = ?");
      vals.push(nowSecs());
    }
  }
  if (data.output !== undefined)    { parts.push("output = ?");     vals.push(JSON.stringify(data.output)); }
  if (data.error !== undefined)     { parts.push("error = ?");      vals.push(data.error); }
  if (data.costCents !== undefined) { parts.push("cost_cents = ?"); vals.push(data.costCents); }
  vals.push(id);
  await db.prepare(`UPDATE execution_runs SET ${parts.join(", ")} WHERE id = ?`).bind(...vals).run();
  return getExecutionById(db, id);
}

function deserializeExecution(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    workflowId: row.workflow_id as string,
    userId: row.user_id as string,
    status: row.status as string,
    input: row.input ? JSON.parse(row.input as string) : null,
    output: row.output ? JSON.parse(row.output as string) : null,
    error: row.error as string | null,
    costCents: (row.cost_cents as number) ?? 0,
    startedAt: new Date((row.started_at as number) * 1000).toISOString(),
    completedAt: row.completed_at ? new Date((row.completed_at as number) * 1000).toISOString() : null,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(db: D1Database, data: {
  id: string;
  githubUserId?: number;
  githubUsername?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}) {
  const now = nowSecs();
  await db.prepare(`
    INSERT INTO users (id, github_user_id, github_username, email, display_name, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      github_user_id = excluded.github_user_id,
      github_username = excluded.github_username,
      email = excluded.email,
      display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      updated_at = excluded.updated_at
  `).bind(
    data.id, data.githubUserId ?? null, data.githubUsername ?? null,
    data.email ?? null, data.displayName ?? null, data.avatarUrl ?? null,
    now, now
  ).run();
  return getUserById(db, data.id);
}

export async function getUserById(db: D1Database, id: string) {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<{
    id: string; github_user_id: number | null; github_username: string | null;
    email: string | null; display_name: string | null; avatar_url: string | null;
    default_provider: string; created_at: number; updated_at: number;
  }>();
}

// ─── Costs ────────────────────────────────────────────────────────────────────

export async function recordCost(db: D1Database, data: {
  executionId: string;
  agentId?: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}) {
  const id = randomId("cost");
  await db.prepare(`
    INSERT INTO execution_costs (id, execution_id, agent_id, provider, model, input_tokens, output_tokens, total_tokens, cost_usd, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, data.executionId, data.agentId ?? null, data.provider, data.model,
    data.inputTokens, data.outputTokens, data.inputTokens + data.outputTokens,
    data.costUsd, Math.floor(Date.now() / 1000)
  ).run();
}

export async function getCostSummary(db: D1Database, userId: string) {
  const totalRow = await db.prepare(`
    SELECT COALESCE(SUM(ec.cost_usd), 0) as total
    FROM execution_costs ec
    JOIN execution_runs er ON ec.execution_id = er.id
    WHERE er.user_id = ?
  `).bind(userId).first<{ total: number }>();

  const byProvider = await db.prepare(`
    SELECT ec.provider, COALESCE(SUM(ec.cost_usd), 0) as total
    FROM execution_costs ec
    JOIN execution_runs er ON ec.execution_id = er.id
    WHERE er.user_id = ?
    GROUP BY ec.provider
  `).bind(userId).all<{ provider: string; total: number }>();

  const byModel = await db.prepare(`
    SELECT ec.model, COALESCE(SUM(ec.cost_usd), 0) as total
    FROM execution_costs ec
    JOIN execution_runs er ON ec.execution_id = er.id
    WHERE er.user_id = ?
    GROUP BY ec.model
  `).bind(userId).all<{ model: string; total: number }>();

  return {
    totalCostUsd: (totalRow?.total ?? 0) / 1_000_000,
    byProvider: Object.fromEntries(byProvider.results.map(r => [r.provider, r.total / 1_000_000])),
    byModel: Object.fromEntries(byModel.results.map(r => [r.model, r.total / 1_000_000])),
  };
}
