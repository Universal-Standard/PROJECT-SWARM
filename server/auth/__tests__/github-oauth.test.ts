import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@shared/schema";
import { encrypt } from "../encryption";
import { exchangeCodeForToken, isGitHubTokenExpired, refreshGitHubToken } from "../github-oauth";

function createUser(overrides: Partial<User>): User {
  return {
    id: "user-1",
    email: "user@example.com",
    firstName: null,
    lastName: null,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    githubAccessToken: null,
    githubRefreshToken: null,
    githubTokenExpiry: null,
    openaiApiKey: null,
    anthropicApiKey: null,
    geminiApiKey: null,
    defaultProvider: "openai",
    defaultModel: null,
    theme: "system",
    emailNotifications: true,
    inAppNotifications: true,
    executionTimeout: 300,
    autoSaveInterval: 30,
    replitId: null,
    username: null,
    avatarUrl: null,
    ...overrides,
  };
}

describe("github-oauth token lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("treats non-expiring tokens as valid", () => {
    const user = createUser({
      githubAccessToken: encrypt("access-token"),
      githubTokenExpiry: null,
    });

    expect(isGitHubTokenExpired(user)).toBe(false);
  });

  it("marks expired tokens as expired", () => {
    const user = createUser({
      githubAccessToken: encrypt("access-token"),
      githubTokenExpiry: new Date(Date.now() - 60_000),
    });

    expect(isGitHubTokenExpired(user)).toBe(true);
  });

  it("reads OAuth expiry from exchange response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          expires_in: 3600,
        }),
      })
    );

    const token = await exchangeCodeForToken("code-123");

    expect(token.accessToken).toBe("new-access-token");
    expect(token.refreshToken).toBe("new-refresh-token");
    expect(token.expiresAt).toBeInstanceOf(Date);
  });

  it("returns null when refresh token is missing", async () => {
    const refreshed = await refreshGitHubToken(createUser({}));
    expect(refreshed).toBeNull();
  });

  it("refreshes token using encrypted refresh token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        access_token: "refreshed-access-token",
        refresh_token: "rotated-refresh-token",
        expires_in: 7200,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const refreshed = await refreshGitHubToken(
      createUser({
        githubRefreshToken: encrypt("existing-refresh-token"),
      })
    );

    expect(refreshed?.accessToken).toBe("refreshed-access-token");
    expect(refreshed?.refreshToken).toBe("rotated-refresh-token");
    expect(refreshed?.expiresAt).toBeInstanceOf(Date);

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(request.body as string);
    expect(body.grant_type).toBe("refresh_token");
    expect(body.refresh_token).toBe("existing-refresh-token");
  });
});
