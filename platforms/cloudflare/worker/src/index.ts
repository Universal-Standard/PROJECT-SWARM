/**
 * PROJECT-SWARM Cloudflare Worker
 *
 * Full-stack API running at the edge:
 * - Hono.js HTTP router (replaces Express)
 * - Cloudflare D1 for storage (replaces Neon PostgreSQL)
 * - KV for session management (replaces express-session)
 * - Durable Objects for WebSocket rooms (replaces ws library)
 * - Queues for async AI execution (replaces synchronous orchestrator)
 * - Cron triggers for scheduled workflows (replaces node-cron)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env, ExecutionJob } from "./types";
import { workflowsRouter } from "./routes/workflows";
import { executionsRouter } from "./routes/executions";
import { authRouter } from "./routes/auth";
import { costsRouter } from "./routes/costs";
import { processExecutionJob } from "./queues/execution-processor";
import { ExecutionRoom } from "./durable-objects/execution-room";

// Re-export Durable Object class (required by Wrangler)
export { ExecutionRoom };

const app = new Hono<{ Bindings: Env }>();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use("/api/*", cors({
  origin: ["https://project-swarm.pages.dev", "http://localhost:5173"],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.route("/api/auth", authRouter);
app.route("/api/workflows", workflowsRouter);
app.route("/api/executions", executionsRouter);
app.route("/api/costs", costsRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (c) => c.json({ status: "ok", runtime: "cloudflare-workers" }));

// ── Default export (Worker + Queue consumer + Cron) ───────────────────────────
export default {
  // HTTP requests
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  // Queue consumer: async AI execution
  async queue(batch: MessageBatch<ExecutionJob>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processExecutionJob(message.body, env, ctx);
        message.ack();
      } catch (err) {
        console.error("Queue consumer error:", err);
        message.retry();
      }
    }
  },

  // Cron trigger: check scheduled workflows every 5 minutes
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log("Cron trigger:", new Date(event.scheduledTime).toISOString());
    // Query D1 for due scheduled workflows and enqueue them
    // (workflow_schedules table can be added in a future migration)
    const now = Math.floor(Date.now() / 1000);
    try {
      const { results } = await env.DB.prepare(`
        SELECT * FROM workflow_schedules WHERE enabled = 1 AND next_run <= ?
      `).bind(now).all<{ id: string; workflow_id: string; user_id: string }>().catch(() => ({ results: [] as any[] }));

      for (const schedule of results) {
        await env.EXECUTION_QUEUE.send({
          executionId: `scheduled_${schedule.id}_${now}`,
          workflowId: schedule.workflow_id,
          userId: schedule.user_id,
          input: {},
          agentIndex: 0,
          previousResults: [],
        });
      }
    } catch {
      // Table doesn't exist yet — ignore
    }
  },
};
