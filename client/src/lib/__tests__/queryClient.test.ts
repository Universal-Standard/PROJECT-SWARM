import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiRequest,
  getExponentialBackoffDelay,
  getQueryFn,
  queryClient,
} from "../queryClient";

describe("queryClient apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns field-level validation errors with user-friendly message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Validation failed",
            details: [{ field: "name", message: "Name is required", code: "too_small" }],
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    await expect(apiRequest("GET", "/api/workflows")).rejects.toMatchObject({
      name: "ApiError",
      message: "Name is required",
      statusCode: 400,
      details: [{ field: "name", message: "Name is required", code: "too_small" }],
    });
  });

  it("does not retry failed requests at the request layer", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("Service unavailable", { status: 503 }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("GET", "/api/workflows")).rejects.toMatchObject({ statusCode: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("classifies retryable API errors by status code", () => {
    const retryableError = new ApiError("retry", 503);
    const nonRetryableError = new ApiError("no-retry", 401);

    expect(getExponentialBackoffDelay(0)).toBe(1000);
    expect(getExponentialBackoffDelay(2)).toBe(4000);
    expect(getExponentialBackoffDelay(10)).toBe(10000);
    expect(retryableError.statusCode).toBe(503);
    expect(nonRetryableError.statusCode).toBe(401);
  });
});

describe("queryClient getQueryFn", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null for 401 when configured with returnNull", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 }))
    );
    const queryFn = getQueryFn({ on401: "returnNull" });

    await expect(queryFn({ queryKey: ["/api/auth/user"] } as never)).resolves.toBeNull();
  });

  it("retries only transient query errors", () => {
    const retry = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown
    ) => boolean;

    expect(retry(0, new ApiError("retry", 503))).toBe(true);
    expect(retry(0, new ApiError("no-retry", 401))).toBe(false);
    expect(retry(0, new TypeError("network failure"))).toBe(true);
    expect(retry(0, new Error("invalid json"))).toBe(false);
    expect(retry(3, new ApiError("retry", 503))).toBe(false);
  });
});
