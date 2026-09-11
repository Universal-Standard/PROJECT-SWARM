/**
 * Real-time execution updates via GitHub Actions polling.
 *
 * Two-tier strategy:
 * - Active execution: poll every 3s for run status + logs
 * - Idle: poll every 30s for new executions
 */

const GITHUB_API = "https://api.github.com";
const OWNER = import.meta.env.VITE_GITHUB_OWNER || "";
const REPO  = import.meta.env.VITE_GITHUB_REPO  || "";

function getToken(): string {
  const token = localStorage.getItem("github_token");
  if (!token) throw new Error("Not authenticated");
  return token;
}

function authHeaders() {
  return {
    Authorization: `token ${getToken()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export type ExecutionStatus = "queued" | "in_progress" | "completed" | "failed";

export interface ExecutionUpdate {
  executionId: string;
  runId: number;
  status: ExecutionStatus;
  logs: string[];
  conclusion?: string;
}

export type UpdateHandler = (update: ExecutionUpdate) => void;

export class ExecutionPoller extends EventTarget {
  private activePolls = new Map<string, ReturnType<typeof setInterval>>();
  private idleInterval: ReturnType<typeof setInterval> | null = null;

  /** Start polling a specific execution (GitHub Actions run). */
  startPolling(executionId: string, runId: number, handler: UpdateHandler): void {
    if (this.activePolls.has(executionId)) return;

    const interval = setInterval(async () => {
      try {
        const run = await fetch(
          `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/runs/${runId}`,
          { headers: authHeaders() }
        ).then((r) => r.json());

        const logs = await this.fetchLogs(runId);

        const status: ExecutionStatus =
          run.status === "completed"
            ? run.conclusion === "success"
              ? "completed"
              : "failed"
            : run.status === "in_progress"
              ? "in_progress"
              : "queued";

        handler({ executionId, runId, status, logs, conclusion: run.conclusion });

        if (run.status === "completed") {
          this.stopPolling(executionId);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    this.activePolls.set(executionId, interval);
  }

  stopPolling(executionId: string): void {
    const interval = this.activePolls.get(executionId);
    if (interval) {
      clearInterval(interval);
      this.activePolls.delete(executionId);
    }
  }

  /** Start idle polling for new executions. */
  startIdlePolling(handler: (executions: unknown[]) => void): void {
    if (this.idleInterval) return;
    this.idleInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/workflows/api-execute-workflow.yml/runs?per_page=10`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        handler(data.workflow_runs || []);
      } catch (err) {
        console.error("Idle polling error:", err);
      }
    }, 30_000);
  }

  stopIdlePolling(): void {
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
  }

  private async fetchLogs(runId: number): Promise<string[]> {
    try {
      const jobs = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/runs/${runId}/jobs`,
        { headers: authHeaders() }
      ).then((r) => r.json());

      const lines: string[] = [];
      for (const job of jobs.jobs || []) {
        for (const step of job.steps || []) {
          if (step.name && step.conclusion) {
            lines.push(`[${step.name}] ${step.conclusion}`);
          }
        }
      }
      return lines;
    } catch {
      return [];
    }
  }
}

export const executionPoller = new ExecutionPoller();
