import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";
import { createApp } from "../server/app";

/**
 * Vercel serverless entrypoint.
 *
 * All 90+ Express routes registered in server/routes.ts, plus
 * server/routes/health.ts and server/routes/cron.ts, are served through
 * this single function. See vercel.json for the rewrites that route
 * /api/*, /webhooks/*, /health, and /ready here.
 *
 * NOT AVAILABLE ON VERCEL (by design — see server/websocket.ts and
 * server/scheduler.ts, neither of which is imported here):
 *   - WebSocket connections (/ws). Vercel's Node serverless runtime has
 *     no persistent `http.Server` to attach a WebSocketServer to.
 *     Real-time execution updates (agent progress, live logs) will not
 *     work over this deployment. Either run the WebSocket-dependent
 *     features on a small always-on host (Railway/Render — see
 *     docs/deployment/) alongside this Vercel deployment, or migrate
 *     to a managed realtime service (Pusher, Ably, Supabase Realtime).
 *   - The in-process node-cron scheduler. Replaced on Vercel by
 *     GET /api/cron/tick, triggered by Vercel Cron (configured in
 *     vercel.json). See server/lib/scheduler-tick.ts for details and
 *     the precision caveat on the Hobby plan.
 *
 * The Express app instance is built once per cold start and cached in
 * module scope so warm invocations (the same execution environment
 * handling a subsequent request) reuse it instead of re-registering all
 * routes and middleware every time.
 */
let appPromise: Promise<Express> | null = null;

function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  app(req as any, res as any);
}
