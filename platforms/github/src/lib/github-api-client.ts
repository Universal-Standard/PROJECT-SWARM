/**
 * GitHub Actions API Client
 *
 * Replaces the Express API server with GitHub Actions workflows.
 * Each "API call" dispatches a workflow_dispatch event, polls until completion,
 * then downloads the JSON artifact result.
 *
 * Latency: ~10-30s per call (GitHub Actions cold start).
 * Caching: Artifact results cached in sessionStorage by run_id.
 */

import type { ApiClient, User, Workflow, Execution, CostSummary, CreateWorkflowInput } from "../../../shared/api-client.interface";

const GITHUB_API = "https://api.github.com";

// Configurable via env — set at Vite build time or runtime
const OWNER = import.meta.env.VITE_GITHUB_OWNER || "";
const REPO  = import.meta.env.VITE_GITHUB_REPO  || "";

function getToken(): string {
  const token = localStorage.getItem("github_token");
  if (!token) throw new Error("Not authenticated. Please log in with GitHub.");
  return token;
}

function headers(token: string): HeadersInit {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/** Dispatch a workflow and return the triggered run ID. */
async function dispatchWorkflow(
  workflow: string,
  inputs: Record<string, string>,
  token: string
): Promise<number> {
  const before = Date.now();

  await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ ref: "main", inputs }),
    }
  ).then(async (r) => {
    if (!r.ok) throw new Error(`Dispatch failed: ${await r.text()}`);
  });

  // Poll for the new run (created within the last 30s)
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const runs = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/workflows/${workflow}/runs?event=workflow_dispatch&per_page=5`,
      { headers: headers(token) }
    ).then((r) => r.json());

    const run = (runs.workflow_runs as any[])?.find(
      (r: any) => new Date(r.created_at).getTime() >= before - 5000
    );
    if (run) return run.id as number;
  }
  throw new Error("Timed out waiting for workflow run to appear");
}

/** Poll until a run reaches terminal status, return the run. */
async function waitForRun(runId: number, token: string, timeoutMs = 120_000): Promise<any> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(3000);
    const run = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/runs/${runId}`,
      { headers: headers(token) }
    ).then((r) => r.json());

    if (run.status === "completed") return run;
  }
  throw new Error(`Workflow run ${runId} timed out`);
}

/** Download artifact JSON result, with sessionStorage caching. */
async function downloadArtifact(runId: number, namePrefix: string, token: string): Promise<unknown> {
  const cacheKey = `artifact:${runId}:${namePrefix}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const artifacts = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/runs/${runId}/artifacts`,
    { headers: headers(token) }
  ).then((r) => r.json());

  const artifact = (artifacts.artifacts as any[])?.find((a: any) =>
    a.name.startsWith(namePrefix)
  );
  if (!artifact) throw new Error(`Artifact ${namePrefix} not found for run ${runId}`);

  // Download the zip and extract JSON
  const zipRes = await fetch(artifact.archive_download_url, {
    headers: headers(token),
  });
  const zip = await zipRes.arrayBuffer();
  const text = await extractJsonFromZip(zip);
  const parsed = JSON.parse(text);

  sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
  return parsed;
}

/** Minimal zip extraction — find first .json file in zip buffer. */
async function extractJsonFromZip(buffer: ArrayBuffer): Promise<string> {
  // Use DecompressionStream (available in all modern browsers)
  // Zip local file header: PK\x03\x04 at offset 0
  const view = new DataView(buffer);
  let offset = 0;
  while (offset < view.byteLength - 4) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break; // PK local file header
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const compSize = view.getUint32(offset + 18, true);
    const dataOffset = offset + 30 + nameLen + extraLen;
    const nameBytes = new Uint8Array(buffer, offset + 30, nameLen);
    const name = new TextDecoder().decode(nameBytes);
    if (name.endsWith(".json")) {
      const data = new Uint8Array(buffer, dataOffset, compSize);
      return new TextDecoder().decode(data);
    }
    offset = dataOffset + compSize;
  }
  throw new Error("No JSON file found in zip artifact");
}

async function callApi<T>(
  workflow: string,
  inputs: Record<string, string>,
  artifactPrefix: string
): Promise<T> {
  const token = getToken();
  const runId = await dispatchWorkflow(workflow, inputs, token);
  const run = await waitForRun(runId, token);
  if (run.conclusion !== "success") {
    throw new Error(`Workflow ${workflow} failed with conclusion: ${run.conclusion}`);
  }
  const result = await downloadArtifact(runId, artifactPrefix, token) as any;
  if (!result.success) throw new Error(result.error || "API call failed");
  return result.data as T;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Public API client ────────────────────────────────────────────────────────

export class GitHubApiClient implements ApiClient {
  async getUser(): Promise<User | null> {
    const token = localStorage.getItem("github_token");
    if (!token) return null;
    const data = await fetch(`${GITHUB_API}/user`, {
      headers: headers(token),
    }).then((r) => r.json());
    if (data.login) {
      return {
        id: String(data.id),
        username: data.login,
        avatarUrl: data.avatar_url,
        email: data.email,
      };
    }
    return null;
  }

  async listWorkflows(): Promise<Workflow[]> {
    const token = getToken();
    // Read workflow index from repo file (fast — uses Contents API, no Actions needed)
    const res = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/.swarm-data/workflows/index.json`,
      { headers: headers(token) }
    );
    if (res.status === 404) return [];
    const file = await res.json();
    return JSON.parse(atob(file.content.replace(/\n/g, "")));
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const token = getToken();
    const res = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/.swarm-data/workflows/${id}.json`,
      { headers: headers(token) }
    );
    if (!res.ok) throw new Error(`Workflow ${id} not found`);
    const file = await res.json();
    return JSON.parse(atob(file.content.replace(/\n/g, "")));
  }

  async createWorkflow(data: CreateWorkflowInput): Promise<Workflow> {
    return callApi<Workflow>(
      "api-create-workflow.yml",
      { workflow_data: JSON.stringify(data) },
      "api-create-workflow-"
    );
  }

  async updateWorkflow(id: string, data: Partial<CreateWorkflowInput>): Promise<Workflow> {
    return callApi<Workflow>(
      "api-update-workflow.yml",
      { workflow_id: id, workflow_data: JSON.stringify(data) },
      "api-update-workflow-"
    );
  }

  async deleteWorkflow(id: string): Promise<void> {
    await callApi<void>(
      "api-delete-workflow.yml",
      { workflow_id: id },
      "api-delete-workflow-"
    );
  }

  async createExecution(workflowId: string, input: unknown): Promise<Execution> {
    return callApi<Execution>(
      "api-create-execution.yml",
      {
        github_repo: `${OWNER}/${REPO}`,
        github_run_id: "0",
        workflow_path: `.swarm-data/workflows/${workflowId}.json`,
        input: JSON.stringify(input),
      },
      "api-create-execution-"
    );
  }

  async getExecution(id: string): Promise<Execution> {
    return callApi<Execution>(
      "api-get-execution.yml",
      { execution_id: id },
      "api-get-execution-"
    );
  }

  async listExecutions(workflowId?: string): Promise<Execution[]> {
    return callApi<Execution[]>(
      "api-list-executions.yml",
      workflowId ? { repo_filter: `${OWNER}/${REPO}`, status_filter: "" } : {},
      "api-list-executions-"
    );
  }

  async getCosts(): Promise<CostSummary> {
    return callApi<CostSummary>(
      "api-get-costs.yml",
      {},
      "api-get-costs-"
    );
  }

  async saveAgentMessage(executionId: string, agentId: string, role: string, content: string): Promise<void> {
    await callApi<void>(
      "api-save-agent-message.yml",
      { execution_id: executionId, agent_id: agentId, role, content },
      "api-save-agent-message-"
    );
  }
}

export const githubApiClient = new GitHubApiClient();
