import type { Env } from "./types";
import { upsertUser } from "./db";

export async function exchangeGitHubCode(
  code: string,
  env: Env
): Promise<{ accessToken: string; userId: string }> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string };
  if (!tokenData.access_token) {
    throw new Error(`GitHub token exchange failed: ${tokenData.error_description || tokenData.error}`);
  }

  const accessToken = tokenData.access_token;

  // Fetch user info
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "project-swarm",
    },
  });
  const githubUser = await userRes.json() as {
    id: number; login: string; email: string | null;
    name: string | null; avatar_url: string;
  };

  const userId = `gh_${githubUser.id}`;

  await upsertUser(env.DB, {
    id: userId,
    githubUserId: githubUser.id,
    githubUsername: githubUser.login,
    email: githubUser.email ?? undefined,
    displayName: githubUser.name ?? githubUser.login,
    avatarUrl: githubUser.avatar_url,
  });

  return { accessToken, userId };
}
