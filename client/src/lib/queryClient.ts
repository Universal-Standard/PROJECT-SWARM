import { QueryClient, type QueryFunction } from "@tanstack/react-query";

interface ValidationIssue {
  field?: string;
  path?: string;
  message: string;
  code?: string;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
  details?: ValidationIssue[];
  statusCode?: number;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: ValidationIssue[];

  constructor(message: string, statusCode: number, details?: ValidationIssue[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  400: "Your request contains invalid data. Please review and try again.",
  401: "You need to sign in to continue.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  408: "The request timed out. Please try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again.",
  502: "Service is temporarily unavailable. Please try again.",
  503: "Service is temporarily unavailable. Please try again.",
  504: "The request timed out. Please try again.",
};

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_QUERY_RETRIES = 3;

function normalizeValidationIssues(details: unknown): ValidationIssue[] | undefined {
  if (!Array.isArray(details)) {
    return undefined;
  }

  return details
    .filter((detail): detail is ValidationIssue => !!detail && typeof detail === "object")
    .map((detail) => ({
      field: typeof detail.field === "string" ? detail.field : undefined,
      path: typeof detail.path === "string" ? detail.path : undefined,
      message: typeof detail.message === "string" ? detail.message : "Invalid value",
      code: typeof detail.code === "string" ? detail.code : undefined,
    }));
}

async function buildApiError(res: Response): Promise<ApiError> {
  const statusText = res.statusText || DEFAULT_STATUS_MESSAGES[res.status] || "Request failed";
  const contentType = res.headers.get("content-type") || "";
  let payload: ApiErrorPayload | undefined;
  let fallbackText = "";

  if (contentType.includes("application/json")) {
    try {
      payload = (await res.json()) as ApiErrorPayload;
    } catch {
      // Ignore parse errors and fallback to default status message
    }
  } else {
    fallbackText = (await res.text()).trim();
  }

  const details = normalizeValidationIssues(payload?.details);
  const firstValidationMessage = details?.[0]?.message;
  const message =
    firstValidationMessage ||
    payload?.message ||
    payload?.error ||
    fallbackText ||
    DEFAULT_STATUS_MESSAGES[res.status] ||
    statusText;

  return new ApiError(message, res.status, details);
}

function isRetryableApiError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return RETRYABLE_STATUS_CODES.has(error.statusCode);
  }

  if (error instanceof TypeError) {
    return true;
  }

  return false;
}

/**
 * React Query retryDelay receives a zero-based retry index (0, 1, 2...).
 * This yields retry waits of 1s, 2s, 4s, capped at 10s.
 */
export function getExponentialBackoffDelay(retryIndex: number): number {
  return Math.min(1000 * 2 ** retryIndex, 10000);
}

async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    throw await buildApiError(res);
  }
}

/**
 * Fetch (and cache) the CSRF token.
 * The token is fetched lazily on the first mutating request and cached in memory.
 */
let _csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (_csrfToken) {
    return _csrfToken;
  }
  try {
    const res = await fetch("/api/csrf-token", { credentials: "include" });
    if (!res.ok) {
      console.error("[CSRF] Failed to fetch token:", res.status, res.statusText);
      return "";
    }
    const data = await res.json();
    _csrfToken = data.csrfToken ?? "";
    return _csrfToken ?? "";
  } catch (err) {
    console.error("[CSRF] Error fetching token:", err);
    return "";
  }
}

/** Reset cached token (e.g. after logout) */
export function resetCsrfToken(): void {
  _csrfToken = null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const upperMethod = method.toUpperCase();
  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Include CSRF token on all state-mutating requests
  if (!SAFE_METHODS.has(upperMethod)) {
    const token = await getCsrfToken();
    if (token) {
      headers["X-CSRF-Token"] = token;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) =>
        failureCount < MAX_QUERY_RETRIES && isRetryableApiError(error),
      retryDelay: (attemptIndex) => getExponentialBackoffDelay(attemptIndex),
    },
    mutations: {
      retry: false,
    },
  },
});
