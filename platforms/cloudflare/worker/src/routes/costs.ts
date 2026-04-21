import { Hono } from "hono";
import type { Env } from "../types";
import { getCostSummary } from "../db";
import { getSession, getSessionIdFromRequest } from "../session";

export const costsRouter = new Hono<{ Bindings: Env }>();

costsRouter.get("/", async (c) => {
  const sessionId = getSessionIdFromRequest(c.req.raw);
  if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
  const session = await getSession(c.env.SESSIONS, sessionId);
  if (!session) return c.json({ error: "Session expired" }, 401);
  const summary = await getCostSummary(c.env.DB, session.userId);
  return c.json(summary);
});
