import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import { healthRoutes } from "../health";

describe("Health Check Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    healthRoutes(app);
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
    it("should return 200 when app is ready", async () => {
      const response = await request(app).get("/ready");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("ready", true);
    });

    it("should include database and cache status", async () => {
      const response = await request(app).get("/ready");

      expect(response.body).toHaveProperty("database");
      expect(response.body).toHaveProperty("cache");
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

  describe("GET /status", () => {
    it("should return detailed system status", async () => {
      const response = await request(app).get("/status");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("environment");
    });

    it("should include system resources info", async () => {
      const response = await request(app).get("/status");

      expect(response.body).toHaveProperty("memory");
      expect(response.body).toHaveProperty("cpu");
      expect(response.body.memory).toHaveProperty("used");
      expect(response.body.memory).toHaveProperty("total");
    });
  });
});
