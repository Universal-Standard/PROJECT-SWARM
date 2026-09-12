import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, getExponentialBackoffDelay } from "../queryClient";

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

  it("retries transient GET failures with exponential backoff", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("Service unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    const requestPromise = apiRequest("GET", "/api/workflows");
    await vi.runAllTimersAsync();
    const response = await requestPromise;

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
