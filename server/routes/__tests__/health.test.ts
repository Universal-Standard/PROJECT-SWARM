import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import { registerHealthRoutes } from "../health";

// Mock the database to avoid real DB connections in tests
vi.mock("../../db", () => ({
  db: {
    execute: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

describe("Health Check Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerHealthRoutes(app);
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return 200 with healthy status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
    });

    it("should return valid timestamp", async () => {
      const response = await request(app).get("/health");
      const timestamp = new Date(response.body.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("should return non-negative uptime", async () => {
      const response = await request(app).get("/health");

      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof response.body.uptime).toBe("number");
    });
  });

  describe("GET /ready", () => {
    it("should return 200 when database is connected", async () => {
      const response = await request(app).get("/ready");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "ready");
    });

    it("should include database check status", async () => {
      const response = await request(app).get("/ready");

      expect(response.body).toHaveProperty("checks");
      expect(response.body.checks).toHaveProperty("database", "connected");
    });

    it("should return 503 when database is unavailable", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.execute).mockRejectedValueOnce(new Error("Connection refused"));

      const response = await request(app).get("/ready");

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty("status", "not ready");
      expect(response.body.checks).toHaveProperty("database", "disconnected");
    });
  });

  describe("GET /metrics", () => {
    it("should return Prometheus-compatible metrics", async () => {
      const response = await request(app).get("/metrics");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/plain");
      expect(response.text).toContain("app_uptime_seconds");
      expect(response.text).toContain("app_requests_total");
    });

    it("should include metric metadata", async () => {
      const response = await request(app).get("/metrics");

      expect(response.text).toContain("# HELP");
      expect(response.text).toContain("# TYPE");
    });
  });

  describe("GET /api/status", () => {
    it("should return detailed system status", async () => {
      const response = await request(app).get("/api/status");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("environment");
    });

    it("should include system resources info", async () => {
      const response = await request(app).get("/api/status");

      expect(response.body).toHaveProperty("system");
      expect(response.body.system).toHaveProperty("memory");
      expect(response.body.system.memory).toHaveProperty("rss");
      expect(response.body.system.memory).toHaveProperty("heapUsed");
    });

    it("should return 503 when database is unavailable", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.execute).mockRejectedValueOnce(new Error("Connection refused"));

      const response = await request(app).get("/api/status");

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty("status", "degraded");
    });
  });
});
