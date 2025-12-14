import type { Express, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Health Check Endpoints
 *
 * Provides health, readiness, and metrics endpoints for monitoring.
 * Used by load balancers, orchestrators (Kubernetes), and monitoring tools.
 */

const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;

// Track request metrics
export function incrementRequestCount() {
  requestCount++;
}

export function incrementErrorCount() {
  errorCount++;
}

export function registerHealthRoutes(app: Express) {
  /**
   * Basic health check
   * Returns 200 if server is running
   * Used by: Load balancers, uptime monitors
   */
  app.get("/health", async (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
    });
  });

  /**
   * Readiness check
   * Returns 200 if server is ready to accept traffic (DB connected, etc.)
   * Used by: Kubernetes, container orchestrators
   */
  app.get("/ready", async (req: Request, res: Response) => {
    try {
      // Check database connection
      await db.execute(sql`SELECT 1`);

      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "connected",
        },
      });
    } catch (error) {
      console.error("Readiness check failed:", error);
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "disconnected",
        },
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Metrics endpoint
   * Returns Prometheus-compatible metrics
   * Used by: Prometheus, Grafana, monitoring systems
   */
  app.get("/metrics", async (req: Request, res: Response) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    // Prometheus format
    const metrics = [
      "# HELP app_uptime_seconds Application uptime in seconds",
      "# TYPE app_uptime_seconds gauge",
      `app_uptime_seconds ${uptimeSeconds}`,
      "",
      "# HELP app_requests_total Total number of requests",
      "# TYPE app_requests_total counter",
      `app_requests_total ${requestCount}`,
      "",
      "# HELP app_errors_total Total number of errors",
      "# TYPE app_errors_total counter",
      `app_errors_total ${errorCount}`,
      "",
      "# HELP app_memory_usage_bytes Memory usage in bytes",
      "# TYPE app_memory_usage_bytes gauge",
      `app_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`,
      `app_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}`,
      `app_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}`,
      `app_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
      "",
      "# HELP nodejs_version_info Node.js version info",
      "# TYPE nodejs_version_info gauge",
      `nodejs_version_info{version="${process.version}"} 1`,
      "",
    ].join("\n");

    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(metrics);
  });

  /**
   * Detailed status endpoint (JSON format)
   * More detailed than /health, includes version, environment, etc.
   */
  app.get("/api/status", async (req: Request, res: Response) => {
    try {
      // Check database
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      const dbLatency = Date.now() - dbStart;

      res.status(200).json({
        status: "operational",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor((Date.now() - startTime) / 1000),
          readable: formatUptime(Date.now() - startTime),
        },
        metrics: {
          requests: requestCount,
          errors: errorCount,
          errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0,
        },
        services: {
          database: {
            status: "connected",
            latency: `${dbLatency}ms`,
          },
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
          },
        },
      });
    } catch (error) {
      console.error("Status check failed:", error);
      res.status(503).json({
        status: "degraded",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });
}

/**
 * Format uptime into readable string
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
