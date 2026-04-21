import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import cors from "cors";
import crypto from "crypto";
import { storage } from "../../../server/storage";
import { orchestrator } from "../../../server/ai/orchestrator";
import { workflowValidator } from "../../../server/lib/workflow-validator";
import { logger } from "../../../server/lib/logger";
import {
  getGitHubAuthUrl,
  exchangeCodeForToken,
  storeGitHubTokens,
  revokeGitHubToken,
  getGitHubToken,
  isGitHubTokenExpired,
} from "../../../server/auth/github-oauth";
import {
  insertWorkflowSchema,
  insertAgentSchema,
  insertExecutionSchema,
} from "../../../shared/schema";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import type { WorkflowNode } from "../../../server/types/workflow";

const executeWorkflowSchema = insertExecutionSchema.pick({ workflowId: true, input: true });

function getUserId(req: any): string {
  return req.session.userId;
}

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

async function syncAgentsFromNodes(workflowId: string, nodes: WorkflowNode[]) {
  const existingAgents = await storage.getAgentsByWorkflowId(workflowId);
  for (const agent of existingAgents) {
    await storage.deleteAgent(agent.id);
  }
  for (const node of nodes) {
    if (node.type === "agent") {
      const role = node.data?.role || "Coordinator";
      const provider = node.data?.provider || "openai";
      const model =
        node.data?.model ||
        (provider === "openai"
          ? "gpt-4"
          : provider === "anthropic"
            ? "claude-3-5-sonnet-20241022"
            : "gemini-1.5-flash");
      await storage.createAgent({
        workflowId,
        name: node.data?.label || `${role} Agent`,
        role,
        description: node.data?.description || "",
        provider,
        model,
        systemPrompt: node.data?.systemPrompt || null,
        temperature: node.data?.temperature !== undefined ? node.data.temperature : 70,
        maxTokens: node.data?.maxTokens || 1000,
        capabilities: node.data?.capabilities || [],
        nodeId: node.id,
        position: node.position,
      });
    }
  }
}

export function createStandaloneApp() {
  const app = express();
  const MemStore = MemoryStore(session);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false }));

  // CORS — restrict to explicit FRONTEND_URL in production, permissive in dev
  const corsOrigin = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL
    : process.env.NODE_ENV === "production"
      ? false
      : true;
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );

  // CSRF guard — for state-mutating requests, verify Origin matches allowed host
  app.use((req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return next();
    }
    const origin = req.headers.origin;
    const host = req.headers.host;
    const allowedOrigin = process.env.FRONTEND_URL;
    if (allowedOrigin) {
      if (!origin || origin !== allowedOrigin) {
        return res.status(403).json({ error: "Forbidden: CSRF check failed" });
      }
    } else if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return res.status(403).json({ error: "Forbidden: CSRF check failed" });
        }
      } catch {
        return res.status(403).json({ error: "Forbidden: invalid origin" });
      }
    }
    next();
  });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable is required in production");
    }
    logger.warn("SESSION_SECRET not set — using ephemeral random secret (sessions won't survive restarts)");
  }

  // Session
  app.use(
    session({
      secret: sessionSecret || crypto.randomBytes(32).toString("hex"),
      store: new MemStore({ checkPeriod: 86400000 }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", platform: process.env.PLATFORM || "standalone" });
  });

  // ─── Auth ─────────────────────────────────────────────────────────────────

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/github/login", (req: any, res) => {
    const state = crypto.randomBytes(32).toString("hex");
    req.session.githubOAuthState = state;
    const authUrl = getGitHubAuthUrl(state);
    res.redirect(authUrl);
  });

  app.get("/api/auth/github/callback", async (req: any, res) => {
    try {
      const { code, state } = req.query;
      if (!code || req.session.githubOAuthState !== state) {
        return res.status(400).send("Invalid OAuth state");
      }
      delete req.session.githubOAuthState;

      const { accessToken, refreshToken, expiresAt } = await exchangeCodeForToken(
        code as string,
      );

      // Fetch GitHub user info
      const ghRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      });
      const ghUser = (await ghRes.json()) as any;

      const userId = `gh_${ghUser.id}`;

      // Upsert user in DB
      await storage.upsertUser({
        id: userId,
        email: ghUser.email || null,
        firstName: ghUser.name?.split(" ")[0] || ghUser.login,
        lastName: ghUser.name?.split(" ").slice(1).join(" ") || null,
        profileImageUrl: ghUser.avatar_url || null,
      });

      await storeGitHubTokens(userId, accessToken, refreshToken, expiresAt);

      req.session.userId = userId;
      res.redirect(
        process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/app` : "/app",
      );
    } catch (err: any) {
      logger.error("GitHub callback error", err);
      res.redirect("/login?error=oauth_failed");
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  app.get("/api/auth/github/authorize", isAuthenticated, async (req: any, res) => {
    try {
      const state = crypto.randomBytes(32).toString("hex");
      req.session.githubOAuthState = state;
      const authUrl = getGitHubAuthUrl(state);
      res.json({ authUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/github/status", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(getUserId(req));
      if (!user) return res.json({ connected: false });
      res.json({
        connected: !!user.githubAccessToken && !isGitHubTokenExpired(user),
        expired: isGitHubTokenExpired(user),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/github/disconnect", isAuthenticated, async (req: any, res) => {
    try {
      await revokeGitHubToken(getUserId(req));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Workflows ──────────────────────────────────────────────────────────

  app.get("/api/workflows", isAuthenticated, async (req: any, res) => {
    try {
      const workflows = await storage.getWorkflowsByUserId(getUserId(req));
      res.json(workflows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/workflows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== userId) return res.status(403).json({ error: "Forbidden" });
      res.json(workflow);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/workflows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = insertWorkflowSchema.parse({ ...req.body, userId });
      const workflow = await storage.createWorkflow(data);
      await syncAgentsFromNodes(workflow.id, workflow.nodes as WorkflowNode[]);
      res.json(workflow);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/workflows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const existing = await storage.getWorkflowById(req.params.id);
      if (!existing) return res.status(404).json({ error: "Workflow not found" });
      if (existing.userId !== userId) return res.status(403).json({ error: "Forbidden" });

      const updateSchema = z
        .object({
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          nodes: z
            .array(
              z.object({
                id: z.string(),
                type: z.string(),
                position: z.object({ x: z.number(), y: z.number() }),
                data: z.record(z.any()),
              }),
            )
            .optional(),
          edges: z
            .array(
              z.object({
                id: z.string(),
                source: z.string(),
                target: z.string(),
                animated: z.boolean().optional(),
              }),
            )
            .optional(),
          category: z.string().optional(),
        })
        .strict();

      const validated = updateSchema.parse(req.body);
      if (Object.keys(validated).length === 0)
        return res.status(400).json({ error: "No valid fields to update" });

      const workflow = await storage.updateWorkflow(req.params.id, validated);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });

      if (validated.nodes)
        await syncAgentsFromNodes(req.params.id, validated.nodes as WorkflowNode[]);
      res.json(workflow);
    } catch (err: any) {
      if (err.name === "ZodError")
        return res.status(400).json({ error: "Invalid input", details: err.errors });
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/workflows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== userId) return res.status(403).json({ error: "Forbidden" });
      await storage.deleteWorkflow(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/workflows/:id/validate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== userId) return res.status(403).json({ error: "Forbidden" });
      res.json(workflowValidator.validate(workflow));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Agents ─────────────────────────────────────────────────────────────

  app.get("/api/workflows/:workflowId/agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.workflowId);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== userId) return res.status(403).json({ error: "Forbidden" });
      res.json(await storage.getAgentsByWorkflowId(req.params.workflowId));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = insertAgentSchema.parse(req.body);
      const workflow = await storage.getWorkflowById(data.workflowId);
      if (!workflow || workflow.userId !== userId)
        return res.status(403).json({ error: "Forbidden" });
      res.json(await storage.createAgent(data));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ─── Executions ─────────────────────────────────────────────────────────

  app.get("/api/executions", isAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getExecutionsByUserId(getUserId(req)));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get(
    "/api/workflows/:workflowId/executions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const workflow = await storage.getWorkflowById(req.params.workflowId);
        if (!workflow || workflow.userId !== userId)
          return res.status(403).json({ error: "Forbidden" });
        res.json(await storage.getExecutionsByWorkflowId(req.params.workflowId));
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    },
  );

  app.get("/api/executions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const execution = await storage.getExecutionById(req.params.id);
      if (!execution) return res.status(404).json({ error: "Execution not found" });
      const workflow = await storage.getWorkflowById(execution.workflowId);
      if (!workflow || workflow.userId !== userId)
        return res.status(403).json({ error: "Forbidden" });
      res.json(execution);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/executions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { workflowId, input } = executeWorkflowSchema.parse(req.body);
      const workflow = await storage.getWorkflowById(workflowId);
      if (!workflow || workflow.userId !== userId)
        return res.status(403).json({ error: "Forbidden" });
      const execution = await orchestrator.executeWorkflow(workflowId, input);
      res.json(execution);
    } catch (err: any) {
      if (err.name === "ZodError")
        return res.status(400).json({ error: "Invalid input", details: err.errors });
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/executions/:id/logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const execution = await storage.getExecutionById(req.params.id);
      if (!execution) return res.status(404).json({ error: "Execution not found" });
      const workflow = await storage.getWorkflowById(execution.workflowId);
      if (!workflow || workflow.userId !== userId)
        return res.status(403).json({ error: "Forbidden" });
      const filters = {
        level: req.query.level as string | undefined,
        agentId: req.query.agentId as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };
      res.json(await storage.getLogsByExecutionId(req.params.id, filters));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/executions/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const execution = await storage.getExecutionById(req.params.id);
      if (!execution) return res.status(404).json({ error: "Execution not found" });
      const workflow = await storage.getWorkflowById(execution.workflowId);
      if (!workflow || workflow.userId !== userId)
        return res.status(403).json({ error: "Forbidden" });
      res.json(await storage.getMessagesByExecutionId(req.params.id));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Templates ──────────────────────────────────────────────────────────

  app.get("/api/templates", async (req, res) => {
    try {
      res.json(await storage.getTemplates());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Costs ──────────────────────────────────────────────────────────────

  app.get("/api/costs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { costTracker } = await import("../../../server/lib/cost-tracker");
      const period = (req.query.period as string) || "30days";
      const costs = await costTracker.getCostAnalytics(userId, period);
      res.json(costs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Knowledge entries ───────────────────────────────────────────────────

  app.get("/api/knowledge", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const agentType = req.query.agentType as string | undefined;
      res.json(await storage.getKnowledgeEntries(userId, agentType));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Error handler ───────────────────────────────────────────────────────

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error("Unhandled error", err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });

  return app;
}
