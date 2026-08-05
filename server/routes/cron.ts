import type { Express, Request, Response } from "express";
import { runDueSchedules } from "../lib/scheduler-tick";
import { logger } from "../lib/logger";

/**
 * Registers the serverless-safe scheduler tick endpoint.
 *
 * Vercel serverless functions have no persistent process, so the
 * in-process `node-cron` timers in server/scheduler.ts and
 * server/lib/scheduler.ts never fire there. Instead, Vercel Cron (or any
 * external scheduler — GitHub Actions, cron-job.org, EasyCron, etc.) is
 * configured to hit this endpoint on an interval; each hit performs a
 * "catch-up" check across all enabled workflow schedules and executes any
 * that are due (see server/lib/scheduler-tick.ts for the due-check logic).
 *
 * This endpoint is a no-op — and returns 401 — unless the caller supplies
 * the correct CRON_SECRET, either as:
 *   - an `Authorization: Bearer <CRON_SECRET>` header (Vercel Cron sends
 *     this automatically when CRON_SECRET is set as an env var), or
 *   - a `?secret=<CRON_SECRET>` query parameter (for external schedulers
 *     that can't set custom headers)
 *
 * If CRON_SECRET is not configured, the endpoint refuses all requests —
 * fail closed, not open.
 */
export function registerCronRoutes(app: Express): void {
  app.get("/api/cron/tick", async (req: Request, res: Response) => {
    const configuredSecret = process.env.CRON_SECRET;

    if (!configuredSecret) {
      logger.error("CRON_SECRET is not configured; refusing cron tick request");
      res.status(503).json({ error: "Cron tick endpoint is not configured" });
      return;
    }

    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
    const querySecret = typeof req.query.secret === "string" ? req.query.secret : null;
    const providedSecret = bearerToken ?? querySecret;

    if (providedSecret !== configuredSecret) {
      logger.error("Rejected cron tick request with invalid or missing secret");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const result = await runDueSchedules();
      logger.info("Cron tick completed", result);
      res.json({ ok: true, ...result, tickedAt: new Date().toISOString() });
    } catch (error) {
      logger.error("Cron tick failed", error);
      res.status(500).json({ error: "Cron tick failed" });
    }
  });
}
