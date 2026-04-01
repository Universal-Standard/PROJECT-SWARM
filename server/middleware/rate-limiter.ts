import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate Limiting Middleware
 *
 * Implements tiered rate limiting to prevent abuse and manage costs.
 * Uses express-rate-limit with in-memory store (upgrade to Redis for production).
 */

/**
 * Global rate limiter - applies to all requests
 * 100 requests per minute per IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "60 seconds",
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req: Request) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === "test";
  },
});

/**
 * Authentication rate limiter - for login/signup endpoints
 * 5 requests per minute per IP (strict to prevent brute force)
 */
export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "60 seconds",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Workflow execution rate limiter - prevent runaway costs
 * 20 requests per minute per IP
 */
export const executionRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 executions per window
  message: {
    error: "Too many workflow executions, please try again later.",
    retryAfter: "60 seconds",
    hint: "Consider upgrading your plan for higher limits.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many workflow executions. Please wait before trying again.",
      retryAfter: 60,
      limit: 20,
      window: "1 minute",
    });
  },
});

/**
 * API rate limiter - for general API endpoints
 * 60 requests per minute per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per window
  message: {
    error: "Too many API requests, please slow down.",
    retryAfter: "60 seconds",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Webhook rate limiter - for webhook endpoints
 * 100 requests per minute (higher limit for external integrations)
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: "Webhook rate limit exceeded.",
    retryAfter: "60 seconds",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Create custom rate limiter with specific configuration
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message || "Rate limit exceeded",
      retryAfter: `${options.windowMs / 1000} seconds`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

// Note: For production with multiple servers, use Redis store:
// import RedisStore from 'rate-limit-redis';
// import { createClient } from 'redis';
//
// const client = createClient({ url: process.env.REDIS_URL });
//
// export const globalRateLimiter = rateLimit({
//   store: new RedisStore({ client, prefix: 'rl:' }),
//   ...options
// });
