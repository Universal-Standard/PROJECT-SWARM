import type { Request } from "express";
import type { User } from "@shared/schema";

// Replit Auth user session structure
export interface ReplitAuthUser {
  claims: {
    sub: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
    exp?: number;
  };
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

// Authenticated request with Replit user
export interface AuthenticatedRequest extends Request {
  user: ReplitAuthUser;
}

// Helper type for error objects in catch blocks
export interface ErrorWithMessage {
  message: string;
  name?: string;
  status?: number;
  code?: string;
  errors?: unknown[];
}

// Type guard for error objects
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

// Helper to get error message from unknown error
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}
