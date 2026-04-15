import { doubleCsrf } from "csrf-csrf";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * CSRF Protection using the Double Submit Cookie pattern (csrf-csrf library).
 *
 * - Safe methods (GET, HEAD, OPTIONS) are exempt.
 * - Public webhook endpoints (/webhooks/* and /api/webhooks/trigger/*) are exempt
 *   because they authenticate via HMAC signature instead of session cookies.
 * - All other state-mutating API routes require a valid X-CSRF-Token header.
 *
 * Frontend usage: fetch the token from GET /api/csrf-token, then include it
 * as the `X-CSRF-Token` request header on all mutating requests.
 */
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || "dev-csrf-secret-not-for-production",
  getSessionIdentifier: (req: Request) => {
    const session = (req as any).session;
    return session?.id || req.ip || "anonymous";
  },
  cookieName: "__Host-csrf",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

export { generateCsrfToken as generateToken };

/**
 * CSRF guard middleware — skip for public webhook endpoints.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Webhook endpoints authenticate via HMAC and should not require CSRF tokens
  if (req.path.startsWith("/webhooks/") || req.path.startsWith("/api/webhooks/trigger/")) {
    return next();
  }

  doubleCsrfProtection(req, res, (err) => {
    if (err) {
      logger.warn("CSRF token validation failed", {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      res.status(403).json({ error: "Invalid or missing CSRF token" });
      return;
    }
    next();
  });
}
