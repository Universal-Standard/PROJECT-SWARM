import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Env } from "../types";
import * as db from "../db";
import { getSession, getSessionIdFromRequest } from "../session";

export const executionsRouter = new Hono<{ Bindings: Env }>();

const createSchema = z.object({
  workflowId: z.string(),
  input: z.unknown().default({}),
});

async function requireAuth(c: any): Promise<string | Response> {
  const sessionId = getSessionIdFromRequest(c.req.raw);
  if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
  const session = await getSession(c.env.SESSIONS, sessionId);
  if (!session) return c.json({ error: "Session expired" }, 401);
  return session.userId;
}

executionsRouter.get("/", async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;
  const workflowId = c.req.query("workflowId");
  const executions = await db.listExecutionsByUser(c.env.DB, userId, workflowId);
  return c.json(executions);
});

executionsRouter.get("/:id", async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;
  const execution = await db.getExecutionById(c.env.DB, c.req.param("id"));
  if (!execution || execution.userId !== userId) return c.json({ error: "Not found" }, 404);
  return c.json(execution);
});

executionsRouter.post("/", zValidator("json", createSchema), async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;
  const { workflowId, input } = c.req.valid("json");

  const workflow = await db.getWorkflowById(c.env.DB, workflowId);
  if (!workflow || workflow.userId !== userId) return c.json({ error: "Workflow not found" }, 404);

  // Create execution record immediately
  const execution = await db.createExecution(c.env.DB, {
    workflowId, userId, input, status: "queued",
  });

  // Enqueue for async processing
  await c.env.EXECUTION_QUEUE.send({
    executionId: execution!.id,
    workflowId,
    userId,
    input,
    agentIndex: 0,
    previousResults: [],
  });

  return c.json(execution, 201);
});

// WebSocket endpoint for real-time updates
executionsRouter.get("/:id/ws", async (c) => {
  const upgradeHeader = c.req.header("Upgrade");
  if (upgradeHeader !== "websocket") {
    return c.json({ error: "Expected WebSocket upgrade" }, 426);
  }

  const executionId = c.req.param("id");
  const id = c.env.WS_ROOMS.idFromName(executionId);
  const stub = c.env.WS_ROOMS.get(id);

  return stub.fetch(c.req.raw);
});
