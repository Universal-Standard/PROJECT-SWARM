/**
 * Structured Logging Utility
 *
 * Provides consistent, structured logging across the application.
 * Supports different log levels and structured data.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: any;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.minLevel = this.getMinLevel();
  }

  private getMinLevel(): LogLevel {
    const level = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
    return level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();

    if (this.isDevelopment) {
      // Pretty format for development
      const emoji = {
        debug: "🔍",
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
      }[level];

      let log = `${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`;

      if (context && Object.keys(context).length > 0) {
        log += `\n${JSON.stringify(context, null, 2)}`;
      }

      return log;
    }

    // JSON format for production
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...context,
    });
  }

  private write(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formatted = this.format(level, message, context);

    if (level === "error") {
      console.error(formatted);
    } else if (level === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log debug message (detailed information for debugging)
   */
  debug(message: string, context?: LogContext) {
    this.write("debug", message, context);
  }

  /**
   * Log info message (general information)
   */
  info(message: string, context?: LogContext) {
    this.write("info", message, context);
  }

  /**
   * Log warning message (something unexpected but not critical)
   */
  warn(message: string, context?: LogContext) {
    this.write("warn", message, context);
  }

  /**
   * Log error message (error that needs attention)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    this.write("error", message, errorContext);
  }

  /**
   * Create a child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalWrite = childLogger.write.bind(childLogger);

    childLogger.write = (level: LogLevel, message: string, context?: LogContext) => {
      originalWrite(level, message, { ...defaultContext, ...context });
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * HTTP request logger middleware
 */
export function httpLogger(req: any, res: any, next: any) {
  const start = Date.now();

  // Log request
  logger.info("HTTP Request", {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "warn" : "info";

    logger[level]("HTTP Response", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}

/**
 * Database query logger
 */
export function logQuery(query: string, duration: number, error?: Error) {
  if (error) {
    logger.error("Database query failed", error, {
      query,
      duration: `${duration}ms`,
    });
  } else {
    logger.debug("Database query", {
      query,
      duration: `${duration}ms`,
    });
  }
}

/**
 * AI API call logger
 */
export function logAICall(
  provider: string,
  model: string,
  tokens: number,
  duration: number,
  cost: number
) {
  logger.info("AI API call", {
    provider,
    model,
    tokens,
    duration: `${duration}ms`,
    cost: `$${cost.toFixed(4)}`,
  });
}

/**
 * Workflow execution logger
 */
export function logWorkflowExecution(
  workflowId: string,
  executionId: string,
  status: string,
  duration?: number
) {
  const level = status === "failed" ? "error" : "info";

  logger[level]("Workflow execution", {
    workflowId,
    executionId,
    status,
    ...(duration && { duration: `${duration}ms` }),
  });
}
