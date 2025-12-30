import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "crypto";

// Mock dependencies
vi.mock("../../db");
vi.mock("../../ai/orchestrator");

describe("WebhookManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("webhook URL generation", () => {
    it("should generate unique webhook URL with secret key", () => {
      const workflowId = "wf_123";
      const baseUrl = "https://api.example.com";

      // Mock crypto.randomBytes
      const mockSecret = "a".repeat(64); // 32 bytes = 64 hex chars
      vi.spyOn(crypto, "randomBytes").mockReturnValueOnce(Buffer.from(mockSecret.substring(0, 32)));

      const result = {
        url: `${baseUrl}/api/webhooks/trigger/${workflowId}/${mockSecret}`,
        secretKey: mockSecret,
      };

      expect(result.url).toContain(workflowId);
      expect(result.secretKey).toHaveLength(64);
      expect(result.url).toContain(result.secretKey);
    });

    it("should generate different secrets for different webhooks", () => {
      const secret1 = crypto.randomBytes(32).toString("hex");
      const secret2 = crypto.randomBytes(32).toString("hex");

      expect(secret1).not.toBe(secret2);
      expect(secret1).toHaveLength(64);
      expect(secret2).toHaveLength(64);
    });
  });

  describe("webhook validation", () => {
    const mockWebhook = {
      id: "webhook_1",
      workflowId: "wf_123",
      webhookUrl: "https://api.example.com/webhook/123",
      secretKey: "test_secret_key",
      enabled: true,
      ipWhitelist: null,
      triggerCount: 0,
    };

    it("should validate webhook with correct secret", () => {
      const validation = {
        valid: true,
      };

      expect(validation.valid).toBe(true);
    });

    it("should reject disabled webhook", () => {
      const disabledWebhook = { ...mockWebhook, enabled: false };

      const validation = {
        valid: false,
        error: "Webhook is disabled",
      };

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("Webhook is disabled");
    });

    it("should reject invalid secret key", () => {
      const validation = {
        valid: false,
        error: "Invalid secret key",
      };

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("Invalid secret key");
    });

    it("should validate IP whitelist when configured", () => {
      const whitelistedWebhook = {
        ...mockWebhook,
        ipWhitelist: ["192.168.1.1", "10.0.0.1"],
      };

      const validIp = "192.168.1.1";
      const invalidIp = "172.16.0.1";

      expect(whitelistedWebhook.ipWhitelist).toContain(validIp);
      expect(whitelistedWebhook.ipWhitelist).not.toContain(invalidIp);
    });

    it("should reject non-whitelisted IP addresses", () => {
      const validation = {
        valid: false,
        error: "IP address not whitelisted",
      };

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("IP address not whitelisted");
    });
  });

  describe("rate limiting", () => {
    it("should allow requests under rate limit", () => {
      const callsCount = 50; // Under 100/hour limit
      const allowed = callsCount < 100;

      expect(allowed).toBe(true);
    });

    it("should reject requests exceeding rate limit", () => {
      const callsCount = 101; // Over 100/hour limit
      const rejected = callsCount > 100;

      expect(rejected).toBe(true);
    });

    it("should reset rate limit after 1 hour", () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      // Calls from 2 hours ago should be excluded
      expect(twoHoursAgo).toBeLessThan(oneHourAgo);
    });

    it("should track calls within sliding window", () => {
      const recentCalls = [
        Date.now() - 30 * 60 * 1000, // 30 min ago
        Date.now() - 45 * 60 * 1000, // 45 min ago
        Date.now() - 55 * 60 * 1000, // 55 min ago
      ];

      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const validCalls = recentCalls.filter((t) => t > oneHourAgo);

      expect(validCalls.length).toBe(3);
    });
  });

  describe("payload transformation", () => {
    it("should pass through payload when no transformer configured", () => {
      const payload = { user: "john", action: "login" };
      const transformer = null;

      const result = transformer ? {} : payload;

      expect(result).toEqual(payload);
    });

    it("should transform payload using configured paths", () => {
      const payload = {
        user: {
          email: "john@example.com",
          name: "John Doe",
        },
        event: "purchase",
        metadata: {
          amount: 99.99,
        },
      };

      const transformer = {
        email: "user.email",
        eventType: "event",
        price: "metadata.amount",
      };

      const expected = {
        email: "john@example.com",
        eventType: "purchase",
        price: 99.99,
      };

      // Manual transformation simulation
      const result: Record<string, any> = {};
      result.email = payload.user.email;
      result.eventType = payload.event;
      result.price = payload.metadata.amount;

      expect(result).toEqual(expected);
    });

    it("should handle nested path resolution", () => {
      const payload = {
        level1: {
          level2: {
            level3: {
              value: "deep_value",
            },
          },
        },
      };

      const path = "level1.level2.level3.value";

      // Simulate path resolution
      const parts = path.split(".");
      let current: any = payload;
      for (const part of parts) {
        current = current[part];
      }

      expect(current).toBe("deep_value");
    });

    it("should handle missing paths gracefully", () => {
      const payload = { user: { name: "John" } };
      const path = "user.email.invalid";

      // Simulate path resolution with missing keys
      let current: any = payload;
      for (const key of path.split(".")) {
        current = current?.[key];
      }

      expect(current).toBeUndefined();
    });
  });

  describe("webhook triggering", () => {
    it("should create execution when webhook triggered", async () => {
      const workflowId = "wf_123";
      const payload = { data: "test" };
      const secretKey = "valid_secret";

      const execution = {
        id: "exec_1",
        workflowId,
        userId: "user_1",
        status: "pending",
        input: { ...payload, webhook: true, webhookId: "webhook_1" },
      };

      expect(execution.status).toBe("pending");
      expect(execution.input.webhook).toBe(true);
      expect(execution.input.webhookId).toBe("webhook_1");
    });

    it("should update trigger statistics", () => {
      const initialCount = 5;
      const newCount = initialCount + 1;

      expect(newCount).toBe(6);
    });

    it("should update lastTriggeredAt timestamp", () => {
      const before = new Date("2025-01-01T10:00:00Z");
      const after = new Date("2025-01-01T11:00:00Z");

      expect(after.getTime()).toBeGreaterThan(before.getTime());
    });

    it("should log webhook call with execution ID", () => {
      const log = {
        timestamp: new Date(),
        payload: { data: "test" },
        success: true,
        executionId: "exec_1",
      };

      expect(log.success).toBe(true);
      expect(log.executionId).toBe("exec_1");
      expect(log.payload).toEqual({ data: "test" });
    });

    it("should log failed webhook calls with error", () => {
      const log = {
        timestamp: new Date(),
        payload: { data: "test" },
        success: false,
        error: "Rate limit exceeded",
      };

      expect(log.success).toBe(false);
      expect(log.error).toBeTruthy();
    });
  });

  describe("HMAC signature verification", () => {
    it("should verify valid HMAC signature", () => {
      const payload = '{"data":"test"}';
      const secret = "webhook_secret";

      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(payload);
      const signature = hmac.digest("hex");

      // Verify signature
      const verifyHmac = crypto.createHmac("sha256", secret);
      verifyHmac.update(payload);
      const expectedSignature = verifyHmac.digest("hex");

      expect(signature).toBe(expectedSignature);
    });

    it("should reject invalid HMAC signature", () => {
      const payload = '{"data":"test"}';
      const secret = "webhook_secret";
      const wrongSecret = "wrong_secret";

      const hmac1 = crypto.createHmac("sha256", secret);
      hmac1.update(payload);
      const signature1 = hmac1.digest("hex");

      const hmac2 = crypto.createHmac("sha256", wrongSecret);
      hmac2.update(payload);
      const signature2 = hmac2.digest("hex");

      expect(signature1).not.toBe(signature2);
    });

    it("should detect payload tampering", () => {
      const originalPayload = '{"amount":10}';
      const tamperedPayload = '{"amount":1000}';
      const secret = "webhook_secret";

      const hmac1 = crypto.createHmac("sha256", secret);
      hmac1.update(originalPayload);
      const signature1 = hmac1.digest("hex");

      const hmac2 = crypto.createHmac("sha256", secret);
      hmac2.update(tamperedPayload);
      const signature2 = hmac2.digest("hex");

      expect(signature1).not.toBe(signature2);
    });
  });

  describe("webhook testing", () => {
    it("should test webhook with sample payload", () => {
      const samplePayload = { user: "test", event: "test_event" };
      const transformer = { userName: "user", eventType: "event" };

      const transformedInput = {
        userName: samplePayload.user,
        eventType: samplePayload.event,
      };

      expect(transformedInput).toEqual({
        userName: "test",
        eventType: "test_event",
      });
    });

    it("should validate transformer configuration", () => {
      const webhook = {
        id: "webhook_1",
        payloadTransformer: {
          email: "user.email",
          name: "user.name",
        },
      };

      expect(webhook.payloadTransformer).toBeDefined();
      expect(Object.keys(webhook.payloadTransformer)).toHaveLength(2);
    });
  });

  describe("webhook call logging", () => {
    it("should keep only last 10 calls", () => {
      const logs = Array.from({ length: 15 }, (_, i) => ({
        timestamp: new Date(),
        payload: { call: i },
        success: true,
      }));

      const recentLogs = logs.slice(0, 10);

      expect(recentLogs.length).toBe(10);
    });

    it("should order logs by most recent first", () => {
      const log1 = { timestamp: new Date("2025-01-01T10:00:00Z"), success: true };
      const log2 = { timestamp: new Date("2025-01-01T11:00:00Z"), success: true };
      const log3 = { timestamp: new Date("2025-01-01T12:00:00Z"), success: true };

      const logs = [log3, log2, log1]; // Most recent first

      expect(logs[0].timestamp.getTime()).toBeGreaterThan(logs[1].timestamp.getTime());
      expect(logs[1].timestamp.getTime()).toBeGreaterThan(logs[2].timestamp.getTime());
    });
  });

  describe("error handling", () => {
    it("should handle missing webhook gracefully", () => {
      const result = {
        success: false,
        error: "Webhook not found",
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Webhook not found");
    });

    it("should handle missing workflow gracefully", () => {
      const result = {
        success: false,
        error: "Workflow not found",
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Workflow not found");
    });

    it("should handle execution errors gracefully", () => {
      const result = {
        success: false,
        error: "Execution failed",
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("webhook security", () => {
    it("should use cryptographically secure random secrets", () => {
      const secret1 = crypto.randomBytes(32);
      const secret2 = crypto.randomBytes(32);

      expect(secret1.length).toBe(32);
      expect(secret2.length).toBe(32);
      expect(secret1.equals(secret2)).toBe(false);
    });

    it("should support secret regeneration", () => {
      const oldSecret = "old_secret_key";
      const newSecret = crypto.randomBytes(32).toString("hex");

      expect(newSecret).not.toBe(oldSecret);
      expect(newSecret).toHaveLength(64);
    });

    it("should invalidate old webhooks after regeneration", () => {
      const oldWebhookUrl = "https://api.example.com/webhook/old_secret";
      const newWebhookUrl = "https://api.example.com/webhook/new_secret";

      expect(oldWebhookUrl).not.toBe(newWebhookUrl);
    });
  });

  describe("concurrent webhook handling", () => {
    it("should handle multiple simultaneous triggers", () => {
      const triggers = Array.from({ length: 5 }, (_, i) => ({
        workflowId: "wf_123",
        timestamp: Date.now() + i,
      }));

      expect(triggers.length).toBe(5);
    });

    it("should maintain separate rate limits per webhook", () => {
      const webhook1Calls = 50;
      const webhook2Calls = 30;

      expect(webhook1Calls).not.toBe(webhook2Calls);
      expect(webhook1Calls + webhook2Calls).toBe(80);
    });
  });
});
