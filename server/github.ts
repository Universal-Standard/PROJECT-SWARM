import { Octokit } from "@octokit/rest";
import { storage } from "./storage";
import {
  getGitHubToken,
  isGitHubTokenExpired,
  refreshGitHubToken,
  storeGitHubTokens,
} from "./auth/github-oauth";

export async function getGitHubClient(userId: string): Promise<Octokit> {
  let user = await storage.getUser(userId);
  if (!user || !user.githubAccessToken) {
    throw new Error("GitHub not connected for this user");
  }

  if (isGitHubTokenExpired(user)) {
    const refreshed = await refreshGitHubToken(user);
    if (!refreshed) {
      throw new Error("GitHub token expired. Reconnect GitHub account.");
    }

    await storeGitHubTokens(
      userId,
      refreshed.accessToken,
      refreshed.refreshToken,
      refreshed.expiresAt
    );
    const refreshedUser = await storage.getUser(userId);
    if (!refreshedUser) {
      throw new Error("User not found");
    }
    user = refreshedUser;
  }

  const token = getGitHubToken(user);
  if (!token) {
    throw new Error("GitHub token unavailable for this user");
  }

  return new Octokit({ auth: token });
}

export async function isGitHubConnected(userId: string): Promise<boolean> {
  try {
    await getGitHubClient(userId);
    return true;
  } catch {
    return false;
  }
}
