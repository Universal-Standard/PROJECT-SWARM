import type { Request, Response, NextFunction } from "express";

/**
 * CORS Configuration Middleware
 *
 * Handles Cross-Origin Resource Sharing (CORS) with environment-based configuration.
 * Allows credentials and configures allowed origins, methods, and headers.
 */

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins.split(",").map((origin) => origin.trim());
  }

  // Default allowed origins based on environment
  if (process.env.NODE_ENV === "production") {
    // In production, only allow specific domains
    return [
      "https://project-swarm.pages.dev",
      "https://universal-standard.github.io",
    ];
  }

  // In development, allow localhost with various ports
  return [
    "http://localhost:5000",
    "http://localhost:3000",
    "http://localhost:5173", // Vite default
    "http://127.0.0.1:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ];
};

const allowedOrigins = getAllowedOrigins();

/**
 * CORS middleware
 * Checks if the request origin is in the allowed origins list
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Allow requests with no origin (like mobile apps, curl, Postman)
  if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
    // Allow if origin is in allowedOrigins or in development mode
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Origin not allowed
    res.setHeader("Access-Control-Allow-Origin", "null");
  }

  // Allow credentials (cookies, authorization headers)
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Allowed methods
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  // Allowed headers
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );

  // Preflight request cache duration (24 hours)
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(204).send();
  }

  next();
}
