import helmet from "helmet";
import type { Express } from "express";

/**
 * Configure Helmet security headers
 * Protects against common web vulnerabilities
 */
export function configureHelmet(app: Express): void {
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Vite dev mode
            "'unsafe-eval'", // Required for React dev mode
          ],
          styleSrc: ["'self'", "'unsafe-inline'"], // Required for styled components
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"], // WebSocket support
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      // Strict Transport Security (HTTPS enforcement)
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // X-Frame-Options (clickjacking protection)
      frameguard: {
        action: "deny",
      },
      // X-Content-Type-Options (MIME sniffing protection)
      noSniff: true,
      // X-XSS-Protection
      xssFilter: true,
      // Referrer-Policy
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
      },
      // Hide X-Powered-By header
      hidePoweredBy: true,
    })
  );
}
