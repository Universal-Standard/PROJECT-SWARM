import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

/**
 * Input Validation Middleware
 *
 * Validates request body, params, and query using Zod schemas.
 * Provides clear error messages for validation failures.
 */

type ValidationTarget = "body" | "params" | "query";

/**
 * Create validation middleware for a specific Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, params, query)
 * @returns Express middleware function
 *
 * @example
 * app.post('/api/workflows',
 *   validate(insertWorkflowSchema, 'body'),
 *   async (req, res) => {
 *     // req.body is now typed and validated
 *   }
 * );
 */
export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data to validate based on target
      const data = req[target];

      // Validate and parse the data
      const validated = await schema.parseAsync(data);

      // Replace the original data with validated data
      req[target] = validated;

      next();
    } catch (error) {
      if (error && typeof error === "object" && "issues" in error) {
        // Zod validation error
        const zodError = error as ZodError;
        const validationError = fromZodError(zodError);

        return res.status(400).json({
          error: "Validation failed",
          message: validationError.message,
          details: zodError.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
            code: issue.code,
          })),
        });
      }

      // Unknown error
      console.error("Validation error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred during validation",
      });
    }
  };
}

/**
 * Validate multiple targets with different schemas
 *
 * @example
 * app.put('/api/workflows/:id',
 *   validateMultiple({
 *     params: z.object({ id: z.string() }),
 *     body: updateWorkflowSchema
 *   }),
 *   async (req, res) => { ... }
 * );
 */
export function validateMultiple(schemas: Partial<Record<ValidationTarget, ZodSchema>>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Array<{ target: ValidationTarget; issues: any[] }> = [];

      // Validate each target
      for (const [target, schema] of Object.entries(schemas)) {
        if (!schema) {
          continue;
        }

        try {
          const data = req[target as ValidationTarget];
          const validated = await schema.parseAsync(data);
          req[target as ValidationTarget] = validated;
        } catch (error) {
          if (error && typeof error === "object" && "issues" in error) {
            const zodError = error as ZodError;
            errors.push({
              target: target as ValidationTarget,
              issues: zodError.issues,
            });
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: "Validation failed",
          message: "One or more validation errors occurred",
          details: errors.flatMap((e) =>
            e.issues.map((issue) => ({
              target: e.target,
              path: issue.path.join("."),
              message: issue.message,
              code: issue.code,
            }))
          ),
        });
      }

      next();
    } catch (error) {
      console.error("Validation error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred during validation",
      });
    }
  };
}

/**
 * Sanitize string inputs to prevent XSS and injection attacks
 * This is a basic sanitizer - for production, consider using a library like DOMPurify
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Sanitize all string values in an object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware to sanitize request body
 */
export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
}
