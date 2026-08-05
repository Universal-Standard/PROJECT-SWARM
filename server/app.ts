import express, { type Express } from "express";
import { registerRoutes } from "./routes";
import { errorHandler } from "./middleware/error-handler";
import { configureHelmet } from "./middleware/helmet";
import { corsMiddleware } from "./middleware/cors";
import { globalRateLimiter } from "./middleware/rate-limiter";
import { registerHealthRoutes } from "./routes/health";
import { registerCronRoutes } from "./routes/cron";

/**
 * Lightweight request logger, extracted here (rather than imported from
 * ./vite) so this module never pulls the `vite` package into the Vercel
 * serverless function bundle. `vite` is a devDependency used only by the
 * traditional Node server (server/index.ts) for dev-mode HMR and prod
 * static-file serving; the Vercel deployment serves the built client via
 * Vercel's own static hosting, so `vite` has no reason to be in the
 * `api/index.ts` bundle.
 */
function log(message: string) {
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  // eslint-disable-next-line no-console
  console.log(`${time} [app] ${message}`);
}

/**
 * Builds and returns a fully configured Express application.
 *
 * Deliberately does NOT:
 *   - call `app.listen()` (the caller owns the HTTP lifecycle)
 *   - attach a WebSocket server (requires a persistent `http.Server`,
 *     which does not exist in Vercel's serverless Node runtime)
 *   - start the in-process `node-cron` scheduler (requires a persistent
 *     process; see server/routes/cron.ts + server/lib/scheduler-tick.ts
 *     for the serverless-safe replacement used on Vercel)
 *   - mount Vite dev middleware or serve static client files (the
 *     traditional server does this itself in server/index.ts; Vercel
 *     serves the built client directly via its static hosting layer,
 *     configured in vercel.json)
 *
 * This function is safe to call from both server/index.ts (traditional
 * Node server on Railway/Render/Replit/local) and api/index.ts (Vercel
 * serverless function).
 */
export async function createApp(): Promise<Express> {
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

  // Register health check routes early (before auth, so load balancers
  // and Vercel health probes can reach them without hitting rate limits
  // meant for API traffic).
  registerHealthRoutes(app);

  // Serverless-safe cron tick endpoint. No-op unless called by Vercel
  // Cron (or an equivalent external scheduler) with a valid CRON_SECRET.
  // See server/lib/scheduler-tick.ts for why this exists.
  registerCronRoutes(app);

  await registerRoutes(app);

  // Must be registered after all routes
  app.use(errorHandler);

  return app;
}
