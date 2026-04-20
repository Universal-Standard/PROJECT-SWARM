import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./middleware/error-handler";
import { wsManager } from "./websocket";
import { createServer } from "http";
import { configureHelmet } from "./middleware/helmet";
import { corsMiddleware } from "./middleware/cors";
import { globalRateLimiter } from "./middleware/rate-limiter";
import { registerHealthRoutes } from "./routes/health";

const app = express();

// Security headers (must be first)
configureHelmet(app);

// CORS must be applied early, before routes
app.use(corsMiddleware);

// Global rate limiting
app.use(globalRateLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register health check routes early (before auth, so load balancers can reach them)
  registerHealthRoutes(app);

  await registerRoutes(app);

  // Initialize Phase 3A features (single scheduler instance)
  const { scheduler: libScheduler } = await import("./lib/scheduler");
  const { costTracker } = await import("./lib/cost-tracker");

  await libScheduler.initialize();
  log("Workflow scheduler started");
  await costTracker.initializePricing();

  // Use enhanced error handler (must be registered after all routes)
  app.use(errorHandler);

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
