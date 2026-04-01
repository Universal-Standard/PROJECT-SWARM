import { vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

/**
 * Create mock Express request object
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    session: {} as any,
    user: undefined,
    ...overrides,
  };
}

/**
 * Create mock Express response object
 */
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Create mock Express next function
 */
export function createMockNext(): NextFunction {
  return vi.fn();
}

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create mock database query result
 */
export function createMockDbResult<T>(data: T[]): { rows: T[] } {
  return { rows: data };
}

/**
 * Mock AI API response
 */
export function createMockAIResponse(content: string) {
  return {
    openai: {
      choices: [
        {
          message: {
            content,
            role: "assistant",
          },
        },
      ],
    },
    anthropic: {
      content: [
        {
          type: "text",
          text: content,
        },
      ],
    },
    gemini: {
      response: {
        text: () => content,
      },
    },
  };
}
