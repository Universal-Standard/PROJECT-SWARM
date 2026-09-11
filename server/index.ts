import { createApp } from "./app";
import { setupVite, serveStatic, log } from "./vite";
import { wsManager } from "./websocket";
import { createServer } from "http";

/**
 * Traditional Node server entrypoint — used for local development, Replit,
 * and any always-on host (Railway, Render, Fly, self-hosted, etc.).
 *
 * This is NOT used by the Vercel deployment; see api/index.ts for the
 * serverless entrypoint, which reuses the same createApp() factory but
 * skips everything below that requires a persistent process: the raw
 * http.Server (needed for WebSocket), the in-process node-cron scheduler,
 * and Vite's dev middleware.
 */
(async () => {
  const app = await createApp();

  // Initialize Phase 3A features (single scheduler instance)
  const { scheduler: libScheduler } = await import("./lib/scheduler");
  const { costTracker } = await import("./lib/cost-tracker");

  await libScheduler.initialize();
  log("Workflow scheduler started");
  await costTracker.initializePricing();

  // Create HTTP server and initialize WebSocket before serving static/vite
  const port = parseInt(process.env.PORT || "5000", 10);
  const server = createServer(app);
  wsManager.initialize(server);

  // Importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Graceful shutdown
  process.on("SIGTERM", () => {
    log("SIGTERM signal received: closing HTTP server");
    libScheduler.shutdown();
    server.close(() => {
      process.exit(0);
    });
  });

  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
