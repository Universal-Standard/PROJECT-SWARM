import type { KVNamespace } from "@cloudflare/workers-types";
import type { Session } from "./types";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function sessionKey(id: string): string {
  return `session:${id}`;
}

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(kv: KVNamespace, userId: string, githubToken?: string): Promise<string> {
  const id = generateSessionId();
  const session: Session = {
    userId,
    githubToken,
    createdAt: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  await kv.put(sessionKey(id), JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS });
  return id;
}

export async function getSession(kv: KVNamespace, id: string): Promise<Session | null> {
  const raw = await kv.get(sessionKey(id));
  if (!raw) return null;
  const session = JSON.parse(raw) as Session;
  if (session.expiresAt < Math.floor(Date.now() / 1000)) {
    await kv.delete(sessionKey(id));
    return null;
  }
  return session;
}

export async function deleteSession(kv: KVNamespace, id: string): Promise<void> {
  await kv.delete(sessionKey(id));
}

export function getSessionIdFromRequest(request: Request): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(/session=([^;]+)/);
  return match ? match[1] : null;
}

export function setSessionCookie(response: Response, sessionId: string, secure = true): Response {
  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    `session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure ? "; Secure" : ""}`
  );
  return new Response(response.body, { status: response.status, headers });
}
