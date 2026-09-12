import { Hono } from "hono";
import { z } from "zod/v4";
import type { Env } from "../types";
import { getSession, getSessionIdFromRequest } from "../session";
import * as db from "../db";

export const knowledgeRouter = new Hono<{ Bindings: Env }>();

const knowledgeQuerySchema = z.object({
  query: z.string().trim().max(500).optional(),
  agentType: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  minConfidence: z.coerce.number().int().min(0).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

async function requireAuth(c: any): Promise<string | Response> {
  const sessionId = getSessionIdFromRequest(c.req.raw);
  if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
  const session = await getSession(c.env.SESSIONS, sessionId);
  if (!session) return c.json({ error: "Session expired" }, 401);
  return session.userId;
}

knowledgeRouter.get("/", async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;

  try {
    const filters = knowledgeQuerySchema.parse(c.req.query());
    const entries = await db.searchKnowledge(c.env.DB, userId, filters);
    return c.json(entries);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues[0]?.message || "Invalid query parameters" }, 400);
    }
    return c.json({ error: "Failed to load knowledge entries" }, 500);
  }
});

knowledgeRouter.get("/metadata", async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;

  try {
    const metadata = await db.getKnowledgeMetadata(c.env.DB, userId);
    return c.json(metadata);
  } catch {
    return c.json({ error: "Failed to load knowledge metadata" }, 500);
  }
});

knowledgeRouter.delete("/:id", async (c) => {
  const userId = await requireAuth(c);
  if (userId instanceof Response) return userId as any;

  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(c.req.param());
    const deleted = await db.deleteKnowledgeEntry(c.env.DB, userId, id);
    if (!deleted) return c.json({ error: "Knowledge entry not found" }, 404);
    return c.body(null, 204);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues[0]?.message || "Invalid request parameters" }, 400);
    }
    return c.json({ error: "Failed to delete knowledge entry" }, 500);
  }
});
