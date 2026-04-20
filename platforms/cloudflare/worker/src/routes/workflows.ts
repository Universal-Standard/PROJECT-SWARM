import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../types";
import * as db from "../db";
import { getSession, getSessionIdFromRequest } from "../session";

export const workflowsRouter = new Hono<{ Bindings: Env }>();

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  nodes: z.array(z.unknown()).default([]),
  edges: z.array(z.unknown()).default([]),
  category: z.string().optional(),
});

async function requireAuth(c: any): Promise<string | Response> {
  const sessionId = getSessionIdFromRequest(c.req.raw);
  if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
  const session = await getSession(c.env.SESSIONS, sessionId);
  if (!session) return c.json({ error: "Session expired" }, 401);
  return session.userId;
}

workflowsRouter.get("/", async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;
  const workflows = await db.listWorkflowsByUser(c.env.DB, userId);
  return c.json(workflows);
});

workflowsRouter.get("/:id", async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;
  const workflow = await db.getWorkflowById(c.env.DB, c.req.param("id"));
  if (!workflow || workflow.userId !== userId) return c.json({ error: "Not found" }, 404);
  return c.json(workflow);
});

workflowsRouter.post("/", zValidator("json", createSchema), async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;
  const data = c.req.valid("json");
  const workflow = await db.createWorkflow(c.env.DB, { ...data, userId });
  return c.json(workflow, 201);
});

workflowsRouter.patch("/:id", async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;
  const existing = await db.getWorkflowById(c.env.DB, c.req.param("id"));
  if (!existing || existing.userId !== userId) return c.json({ error: "Not found" }, 404);
  const data = await c.req.json();
  const updated = await db.updateWorkflow(c.env.DB, c.req.param("id"), data);
  return c.json(updated);
});

workflowsRouter.delete("/:id", async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;
  const existing = await db.getWorkflowById(c.env.DB, c.req.param("id"));
  if (!existing || existing.userId !== userId) return c.json({ error: "Not found" }, 404);
  await db.deleteWorkflow(c.env.DB, c.req.param("id"));
  return c.json({ success: true });
});
