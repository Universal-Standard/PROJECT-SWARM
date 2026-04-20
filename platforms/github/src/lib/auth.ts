/**
 * GitHub OAuth flow for static GitHub Pages deployment.
 *
 * The client secret is NEVER exposed in the browser.
 * The auth-exchange-code.yml workflow handles the server-side exchange
 * using GITHUB_CLIENT_SECRET stored in GitHub Secrets.
 */

const GITHUB_API = "https://api.github.com";
const OWNER = import.meta.env.VITE_GITHUB_OWNER || "";
const REPO  = import.meta.env.VITE_GITHUB_REPO  || "";
const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "";

export function loginWithGitHub(): void {
  const state = crypto.randomUUID();
  sessionStorage.setItem("oauth_state", state);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
    scope: "repo,workflow,user:email",
    state,
  });
  window.location.href = `https://github.com/login/oauth/authorize?${params}`;
}

export function logout(): void {
  localStorage.removeItem("github_token");
  localStorage.removeItem("github_user");
  window.location.href = import.meta.env.BASE_URL || "/";
}

export function getStoredToken(): string | null {
  return localStorage.getItem("github_token");
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/** Called from /auth/callback page after GitHub redirects back. */
export async function handleCallback(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const code  = params.get("code");
  const state = params.get("state");

  if (!code || !state) throw new Error("Missing OAuth code or state");

  const stored = sessionStorage.getItem("oauth_state");
  if (state !== stored) throw new Error("OAuth state mismatch — possible CSRF");
  sessionStorage.removeItem("oauth_state");

  // Exchange code via GitHub Actions (keeps client_secret server-side)
  const token = await exchangeCodeViaActions(code);
  localStorage.setItem("github_token", token);
}

async function exchangeCodeViaActions(code: string): Promise<string> {
  // We need a temporary token to dispatch the workflow.
  // Use GitHub's device flow or a pre-authorized public Actions runner.
  // Here we use the public API to trigger the workflow — the job reads the code
  // from inputs and writes the resulting access_token to an artifact.
  //
  // NOTE: This requires a "bootstrap" public token or a device-flow initial token.
  // In practice, set VITE_BOOTSTRAP_TOKEN in your repo — a fine-grained token with
  // only "Actions: write" permission on this repo.

  const bootstrapToken = import.meta.env.VITE_BOOTSTRAP_TOKEN || "";
  if (!bootstrapToken) {
    throw new Error(
      "No bootstrap token configured. Set VITE_BOOTSTRAP_TOKEN in your environment."
    );
  }

  const headers = {
    Authorization: `token ${bootstrapToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  const before = Date.now();

  await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/workflows/auth-exchange-code.yml/dispatches`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: "main", inputs: { code } }),
    }
  ).then(async (r) => {
    if (!r.ok) throw new Error(`Dispatch failed: ${await r.text()}`);
  });

  // Poll for the run
  let runId: number | null = null;
  for (let i = 0; i < 30 && !runId; i++) {
    await sleep(2000);
    const runs = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/workflows/auth-exchange-code.yml/runs?event=workflow_dispatch&per_page=5`,
      { headers }
    ).then((r) => r.json());
    const run = (runs.workflow_runs as any[])?.find(
      (r: any) => new Date(r.created_at).getTime() >= before - 5000
    );
    if (run) runId = run.id;
  }
  if (!runId) throw new Error("Timed out waiting for auth workflow");

  // Wait for completion
  const deadline = Date.now() + 120_000;
  let run: any = null;
  while (Date.now() < deadline) {
    await sleep(3000);
    run = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/runs/${runId}`,
      { headers }
    ).then((r) => r.json());
    if (run.status === "completed") break;
  }
  if (run?.conclusion !== "success") throw new Error("Auth workflow failed");

  // Download artifact
  const artifacts = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/runs/${runId}/artifacts`,
    { headers }
  ).then((r) => r.json());

  const artifact = (artifacts.artifacts as any[])?.find((a: any) =>
    a.name.startsWith("auth-token-")
  );
  if (!artifact) throw new Error("Auth token artifact not found");

  const zipRes = await fetch(artifact.archive_download_url, { headers });
  const zip = await zipRes.arrayBuffer();

  // Extract token.json from zip
  const view = new DataView(zip);
  let offset = 0;
  while (offset < view.byteLength - 4) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const compSize = view.getUint32(offset + 18, true);
    const dataOffset = offset + 30 + nameLen + extraLen;
    const nameBytes = new Uint8Array(zip, offset + 30, nameLen);
    const name = new TextDecoder().decode(nameBytes);
    if (name === "token.json") {
      const data = new Uint8Array(zip, dataOffset, compSize);
      const json = JSON.parse(new TextDecoder().decode(data));
      return json.access_token as string;
    }
    offset = dataOffset + compSize;
  }
  throw new Error("token.json not found in auth artifact");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
