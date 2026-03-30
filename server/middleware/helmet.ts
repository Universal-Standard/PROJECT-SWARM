import helmet from "helmet";
import type { Express } from "express";

/**
 * Configure Helmet security headers
 * Protects against common web vulnerabilities
 */
export function configureHelmet(app: Express): void {
  const isDevelopment = process.env.NODE_ENV !== "production";

  const scriptSrc: string[] = ["'self'"];
  if (isDevelopment) {
    // Relaxed CSP for development: required for Vite and React dev modes
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
  }

  const styleSrc: string[] = ["'self'"];
  if (isDevelopment) {
    // Relaxed CSP for development: may be required for styled components and dev tooling
    styleSrc.push("'unsafe-inline'");
  }

  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc,
          styleSrc,
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
