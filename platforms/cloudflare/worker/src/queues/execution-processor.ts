import type { Env, ExecutionJob, WorkflowNode } from "../types";
import { getWorkflowById, updateExecution, recordCost } from "../db";
import { runAgent } from "../ai";

/**
 * Queue consumer: processes AI workflow executions.
 *
 * Called by Cloudflare Queues when a new execution job is dequeued.
 * Each invocation processes ONE agent node and re-queues for the next
 * if the workflow has more steps — this chains agent execution
 * without hitting the 30-second CPU time limit per invocation.
 */
export async function processExecutionJob(
  job: ExecutionJob,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const { executionId, workflowId, userId, input, agentIndex, previousResults } = job;

  const workflow = await getWorkflowById(env.DB, workflowId);
  if (!workflow) {
    await updateExecution(env.DB, executionId, { status: "failed", error: `Workflow ${workflowId} not found` });
    return;
  }

  const nodes = (workflow.nodes as WorkflowNode[]).filter(n => n.type === "agent");
  const edges = workflow.edges as Array<{ source: string; target: string }>;

  if (agentIndex >= nodes.length) {
    // All agents done — finalize
    const output = { results: previousResults, completedAt: new Date().toISOString() };
    const totalCost = previousResults.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
    await updateExecution(env.DB, executionId, { status: "completed", output, costCents: Math.round(totalCost / 10000) });

    // Broadcast completion to WebSocket room
    await broadcastToRoom(env, executionId, JSON.stringify({ type: "completed", output }));
    return;
  }

  // Get next node in topological order
  const sortedNodes = topologicalSort(nodes, edges);
  const currentNode = sortedNodes[agentIndex];
  if (!currentNode) {
    await updateExecution(env.DB, executionId, { status: "failed", error: "Invalid workflow graph" });
    return;
  }

  // Update status to in_progress on first step
  if (agentIndex === 0) {
    await updateExecution(env.DB, executionId, { status: "in_progress" });
  }

  // Broadcast agent start
  await broadcastToRoom(env, executionId, JSON.stringify({
    type: "agent_started",
    agentName: currentNode.data.label || currentNode.id,
    step: agentIndex + 1,
    total: nodes.length,
  }));

  try {
    // Build message context
    const systemPrompt = currentNode.data.systemPrompt || "You are a helpful AI agent.";
    const previousContext = previousResults.map(r =>
      `${r.agentName} responded: ${r.response}`
    ).join("\n\n");

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(previousContext ? [{ role: "user" as const, content: `Previous agents:\n${previousContext}` }] : []),
      { role: "user" as const, content: JSON.stringify(input) },
    ];

    const result = await runAgent(currentNode, messages, env, ctx);

    // Record cost
    if (result.costUsd && result.costUsd > 0) {
      await recordCost(env.DB, {
        executionId,
        provider: result.provider,
        model: result.model,
        inputTokens: 0,  // simplified
        outputTokens: result.tokenCount ?? 0,
        costUsd: result.costUsd,
      });
    }

    // Broadcast result
    await broadcastToRoom(env, executionId, JSON.stringify({
      type: "agent_completed",
      agentName: result.agentName,
      response: result.response,
    }));

    // Re-queue for next agent
    const nextResults = [...previousResults, result];
    await env.EXECUTION_QUEUE.send({
      executionId,
      workflowId,
      userId,
      input,
      agentIndex: agentIndex + 1,
      previousResults: nextResults,
    });

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await updateExecution(env.DB, executionId, { status: "failed", error });
    await broadcastToRoom(env, executionId, JSON.stringify({ type: "error", error }));
  }
}

async function broadcastToRoom(env: Env, executionId: string, message: string): Promise<void> {
  try {
    const id = env.WS_ROOMS.idFromName(executionId);
    const stub = env.WS_ROOMS.get(id);
    await stub.fetch(`https://internal/broadcast`, {
      method: "POST",
      body: message,
    });
  } catch {
    // Room might not exist (no connected clients) — that's fine
  }
}

function topologicalSort(nodes: WorkflowNode[], edges: Array<{ source: string; target: string }>): WorkflowNode[] {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const n of nodes) { inDegree.set(n.id, 0); adjList.set(n.id, []); }
  for (const e of edges) {
    adjList.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  const queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0);
  const result: WorkflowNode[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const neighborId of (adjList.get(node.id) ?? [])) {
      const deg = (inDegree.get(neighborId) ?? 1) - 1;
      inDegree.set(neighborId, deg);
      if (deg === 0) {
        const neighbor = nodes.find(n => n.id === neighborId);
        if (neighbor) queue.push(neighbor);
      }
    }
  }

  return result.length === nodes.length ? result : nodes; // fallback: original order
}
