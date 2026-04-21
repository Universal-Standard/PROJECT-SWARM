import { Hono } from "hono";
import type { Env } from "../types";
import { exchangeGitHubCode } from "../auth";
import { createSession, deleteSession, getSession, getSessionIdFromRequest, setSessionCookie } from "../session";

export const authRouter = new Hono<{ Bindings: Env }>();

authRouter.get("/github/authorize", (c) => {
  const state = crypto.randomUUID();
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "repo,user:email",
    state,
  });
  return c.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

authRouter.get("/github/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) return c.json({ error: "Missing code" }, 400);

  const { accessToken, userId } = await exchangeGitHubCode(code, c.env);
  const sessionId = await createSession(c.env.SESSIONS, userId, accessToken);

  const response = c.redirect("/");
  return setSessionCookie(response as unknown as Response, sessionId) as any;
});

authRouter.post("/logout", async (c) => {
  const sessionId = getSessionIdFromRequest(c.req.raw);
  if (sessionId) await deleteSession(c.env.SESSIONS, sessionId);
  const response = c.json({ success: true });
  return new Response((response as unknown as Response).body, {
    status: 200,
    headers: {
      ...Object.fromEntries((response as unknown as Response).headers.entries()),
      "Set-Cookie": "session=; HttpOnly; Path=/; Max-Age=0",
    },
  });
});

authRouter.get("/user", async (c) => {
  const sessionId = getSessionIdFromRequest(c.req.raw);
  if (!sessionId) return c.json(null);
  const session = await getSession(c.env.SESSIONS, sessionId);
  if (!session) return c.json(null);

  // Fetch user from GitHub
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${session.githubToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "project-swarm",
    },
  });
  const user = await res.json();
  return c.json(user);
});
