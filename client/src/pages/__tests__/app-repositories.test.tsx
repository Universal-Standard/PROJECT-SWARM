import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppRepositories from "../app-repositories";

const toast = vi.fn();
const apiRequest = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequest(...args),
}));

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function renderPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        queryFn: async ({ queryKey }) => {
          const response = await fetch(queryKey[0] as string, {
            credentials: "include",
          });

          return response.json();
        },
      },
      mutations: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AppRepositories />
    </QueryClientProvider>
  );
}

describe("AppRepositories", () => {
  beforeEach(() => {
    toast.mockReset();
    apiRequest.mockReset();
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/api/auth/github/status") {
        return createJsonResponse({ connected: true });
      }

      if (url === "/api/github/repos") {
        return createJsonResponse([
          {
            id: 1,
            name: "demo",
            full_name: "octo/demo",
            description: "Demo repository",
            private: false,
            default_branch: "main",
            html_url: "https://github.com/octo/demo",
            owner: { login: "octo" },
          },
        ]);
      }

      if (url === "/api/github/repos/octo/demo/branches") {
        return createJsonResponse([
          { name: "main", protected: true, commit: { sha: "abc1234" } },
          { name: "feature/existing", protected: false, commit: { sha: "def5678" } },
        ]);
      }

      if (url === "/api/github/repos/octo/demo/contents?path=&ref=main") {
        return createJsonResponse([
          { type: "file", name: "README.md", path: "README.md", sha: "sha-readme" },
        ]);
      }

      if (url === "/api/github/repos/octo/demo/contents?path=README.md&ref=main") {
        return createJsonResponse({
          type: "file",
          name: "README.md",
          path: "README.md",
          sha: "sha-readme",
          content: "SGVsbG8gcmVwbyE=",
          encoding: "base64",
        });
      }

      if (url === "/api/github/repos/octo/demo/commits?sha=main&perPage=10") {
        return createJsonResponse([
          {
            sha: "abc123456789",
            html_url: "https://github.com/octo/demo/commit/abc1234",
            commit: {
              message: "feat: initial commit",
              author: { name: "Octo Cat", date: "2026-09-12T00:00:00.000Z" },
            },
          },
        ]);
      }

      if (url === "/api/github/repos/octo/demo/pulls?state=open") {
        return createJsonResponse([
          {
            number: 5,
            title: "Add repository editor",
            state: "open",
            html_url: "https://github.com/octo/demo/pull/5",
            head: { ref: "feature/editor" },
            base: { ref: "main" },
          },
        ]);
      }

      if (url === "/api/github/repos/octo/demo/webhooks") {
        return createJsonResponse([
          {
            id: 8,
            active: true,
            events: ["push", "pull_request"],
            config: { url: "https://example.com/webhook" },
          },
        ]);
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;
  });

  it("renders repository data and commits file edits", async () => {
    apiRequest.mockResolvedValue(createJsonResponse({ content: { sha: "new-sha" } }));

    renderPage();

    expect(await screen.findByText("Repositories")).toBeInTheDocument();
    expect(await screen.findByText("octo/demo")).toBeInTheDocument();
    expect(await screen.findByText("feat: initial commit")).toBeInTheDocument();
    expect(await screen.findByText("Add repository editor")).toBeInTheDocument();
    expect(await screen.findByText("https://example.com/webhook")).toBeInTheDocument();

    fireEvent.click(await screen.findByText("README.md"));
    expect(await screen.findByDisplayValue("Hello repo!")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("repository-file-editor"), {
      target: { value: "Hello repo! Updated." },
    });
    fireEvent.click(screen.getByTestId("button-save-file"));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith("PUT", "/api/github/repos/octo/demo/contents", {
        path: "README.md",
        content: "Hello repo! Updated.",
        message: "Update README.md",
        branch: "main",
        sha: "sha-readme",
      });
    });
  });

  it("creates a new branch from the selected branch", async () => {
    apiRequest.mockResolvedValue(createJsonResponse({ ref: "refs/heads/feature/new-branch" }));

    renderPage();

    expect(await screen.findByText("octo/demo")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Create branch from current branch"), {
      target: { value: "feature/new-branch" },
    });
    fireEvent.click(screen.getByTestId("button-create-branch"));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "POST",
        "/api/github/repos/octo/demo/branches",
        {
          name: "feature/new-branch",
          fromBranch: "main",
        }
      );
    });
  });
});
