import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, GitBranch, GitCommitHorizontal, GitPullRequest, Loader2, Plus, RefreshCw, Save, Webhook, Folder, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface GitHubStatus {
  connected: boolean;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  html_url: string;
  owner: {
    login: string;
  };
}

interface GitHubBranch {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
  };
}

interface GitHubDirectoryEntry {
  type: "dir" | "file" | "symlink" | "submodule";
  name: string;
  path: string;
  sha: string;
  size?: number;
}

interface GitHubFileContent extends GitHubDirectoryEntry {
  type: "file";
  content: string;
  encoding: string;
}

type GitHubContentResponse = GitHubDirectoryEntry[] | GitHubFileContent;

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  html_url: string;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

interface GitHubWebhook {
  id: number;
  active: boolean;
  events: string[];
  config: {
    url?: string;
  };
}

interface GitHubReviewResponse {
  reviewBody: string;
  submitted: boolean;
}

function decodeGitHubContent(content: string, encoding: string): string {
  if (encoding !== "base64") {
    return content;
  }

  const binary = window.atob(content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function getParentPath(path: string): string {
  if (!path.includes("/")) {
    return "";
  }

  return path.split("/").slice(0, -1).join("/");
}

export default function AppRepositories() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRepositoryFullName, setSelectedRepositoryFullName] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFilePath, setSelectedFilePath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDescription, setNewRepoDescription] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [pullRequestTitle, setPullRequestTitle] = useState("");
  const [pullRequestBody, setPullRequestBody] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewResult, setReviewResult] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState("push,pull_request");

  const { data: githubStatus, isLoading: githubStatusLoading } = useQuery<GitHubStatus>({
    queryKey: ["/api/auth/github/status"],
    enabled: isAuthenticated,
  });

  const { data: repositories = [], isLoading: repositoriesLoading } = useQuery<GitHubRepository[]>({
    queryKey: ["/api/github/repos"],
    enabled: isAuthenticated && !!githubStatus?.connected,
  });

  const selectedRepository = useMemo(
    () => repositories.find((repository) => repository.full_name === selectedRepositoryFullName) ?? null,
    [repositories, selectedRepositoryFullName]
  );

  useEffect(() => {
    if (repositories.length > 0 && !selectedRepositoryFullName) {
      setSelectedRepositoryFullName(repositories[0].full_name);
    }
  }, [repositories, selectedRepositoryFullName]);

  useEffect(() => {
    if (!selectedRepository) {
      return;
    }

    setCurrentPath("");
    setSelectedFilePath("");
    setFileContent("");
    setCommitMessage("");
    setPullRequestTitle("");
    setPullRequestBody("");
    setReviewResult("");
    setSelectedBranch(selectedRepository.default_branch);
  }, [selectedRepository]);

  const repositoryApiBase = selectedRepository
    ? `/api/github/repos/${selectedRepository.owner.login}/${selectedRepository.name}`
    : null;

  const { data: branches = [] } = useQuery<GitHubBranch[]>({
    queryKey: repositoryApiBase ? [`${repositoryApiBase}/branches`] : ["/api/github/repos/branches-disabled"],
    enabled: !!repositoryApiBase,
  });

  useEffect(() => {
    if (!selectedRepository || branches.length === 0) {
      return;
    }

    const matchingBranch = branches.find((branch) => branch.name === selectedBranch);
    if (!matchingBranch) {
      setSelectedBranch(selectedRepository.default_branch);
    }
  }, [branches, selectedBranch, selectedRepository]);

  const { data: contentsResponse, isLoading: contentsLoading } = useQuery<GitHubContentResponse>({
    queryKey: repositoryApiBase
      ? [
          `${repositoryApiBase}/contents?path=${encodeURIComponent(currentPath)}&ref=${encodeURIComponent(selectedBranch)}`,
        ]
      : ["/api/github/repos/contents-disabled"],
    enabled: !!repositoryApiBase && !!selectedBranch,
  });

  const directoryEntries = useMemo(() => {
    if (!Array.isArray(contentsResponse)) {
      return [];
    }

    return [...contentsResponse].sort((left, right) => {
      if (left.type === right.type) {
        return left.path.localeCompare(right.path);
      }

      return left.type === "dir" ? -1 : 1;
    });
  }, [contentsResponse]);

  const { data: selectedFileData, isLoading: selectedFileLoading } = useQuery<GitHubFileContent>({
    queryKey: repositoryApiBase
      ? [
          `${repositoryApiBase}/contents?path=${encodeURIComponent(selectedFilePath)}&ref=${encodeURIComponent(selectedBranch)}`,
        ]
      : ["/api/github/repos/file-disabled"],
    enabled: !!repositoryApiBase && !!selectedBranch && !!selectedFilePath,
  });

  useEffect(() => {
    if (!selectedFileData || selectedFileData.type !== "file") {
      return;
    }

    setFileContent(decodeGitHubContent(selectedFileData.content, selectedFileData.encoding));
    setCommitMessage(`Update ${selectedFileData.path}`);
  }, [selectedFileData]);

  const { data: commits = [] } = useQuery<GitHubCommit[]>({
    queryKey: repositoryApiBase
      ? [`${repositoryApiBase}/commits?sha=${encodeURIComponent(selectedBranch)}&perPage=10`]
      : ["/api/github/repos/commits-disabled"],
    enabled: !!repositoryApiBase && !!selectedBranch,
  });

  const { data: pullRequests = [] } = useQuery<GitHubPullRequest[]>({
    queryKey: repositoryApiBase ? [`${repositoryApiBase}/pulls?state=open`] : ["/api/github/repos/pulls-disabled"],
    enabled: !!repositoryApiBase,
  });

  const { data: webhooks = [] } = useQuery<GitHubWebhook[]>({
    queryKey: repositoryApiBase ? [`${repositoryApiBase}/webhooks`] : ["/api/github/repos/webhooks-disabled"],
    enabled: !!repositoryApiBase,
  });

  const createRepositoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/github/repos", {
        name: newRepoName,
        description: newRepoDescription,
        private: false,
      });

      return response.json() as Promise<GitHubRepository>;
    },
    onSuccess: (repository) => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] });
      setSelectedRepositoryFullName(repository.full_name);
      setNewRepoName("");
      setNewRepoDescription("");
      toast({ title: "Repository created", description: repository.full_name });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create repository",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createBranchMutation = useMutation({
    mutationFn: async () => {
      if (!repositoryApiBase) {
        throw new Error("Select a repository first");
      }

      const response = await apiRequest("POST", `${repositoryApiBase}/branches`, {
        name: newBranchName,
        fromBranch: selectedBranch,
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${repositoryApiBase}/branches`] });
      setSelectedBranch(newBranchName);
      setNewBranchName("");
      toast({ title: "Branch created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create branch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveFileMutation = useMutation({
    mutationFn: async () => {
      if (!repositoryApiBase || !selectedFileData) {
        throw new Error("Select a file before saving");
      }

      const response = await apiRequest("PUT", `${repositoryApiBase}/contents`, {
        path: selectedFileData.path,
        content: fileContent,
        message: commitMessage,
        branch: selectedBranch,
        sha: selectedFileData.sha,
      });

      return response.json();
    },
    onSuccess: () => {
      if (!repositoryApiBase) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: [
          `${repositoryApiBase}/contents?path=${encodeURIComponent(selectedFilePath)}&ref=${encodeURIComponent(selectedBranch)}`,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          `${repositoryApiBase}/contents?path=${encodeURIComponent(currentPath)}&ref=${encodeURIComponent(selectedBranch)}`,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [`${repositoryApiBase}/commits?sha=${encodeURIComponent(selectedBranch)}&perPage=10`],
      });
      toast({ title: "File committed to GitHub" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPullRequestMutation = useMutation({
    mutationFn: async () => {
      if (!repositoryApiBase || !selectedRepository) {
        throw new Error("Select a repository first");
      }

      const response = await apiRequest("POST", `${repositoryApiBase}/pulls`, {
        title: pullRequestTitle,
        body: pullRequestBody,
        head: selectedBranch,
        base: selectedRepository.default_branch,
        draft: false,
      });

      return response.json() as Promise<GitHubPullRequest>;
    },
    onSuccess: (pullRequest) => {
      if (!repositoryApiBase) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: [`${repositoryApiBase}/pulls?state=open`] });
      setPullRequestTitle("");
      setPullRequestBody("");
      toast({
        title: "Pull request created",
        description: `#${pullRequest.number} ${pullRequest.title}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create pull request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reviewPullRequestMutation = useMutation({
    mutationFn: async (pullRequestNumber: number) => {
      if (!repositoryApiBase) {
        throw new Error("Select a repository first");
      }

      const response = await apiRequest(
        "POST",
        `${repositoryApiBase}/pulls/${pullRequestNumber}/review`,
        {
          submit: true,
          additionalContext: reviewNotes || undefined,
        }
      );

      return response.json() as Promise<GitHubReviewResponse>;
    },
    onSuccess: (review) => {
      setReviewResult(review.reviewBody);
      toast({
        title: review.submitted ? "Automated review submitted" : "Automated review generated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to run automated review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      if (!repositoryApiBase) {
        throw new Error("Select a repository first");
      }

      const response = await apiRequest("POST", `${repositoryApiBase}/webhooks`, {
        callbackUrl: webhookUrl,
        events: webhookEvents
          .split(",")
          .map((eventName) => eventName.trim())
          .filter(Boolean),
      });

      return response.json();
    },
    onSuccess: () => {
      if (!repositoryApiBase) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: [`${repositoryApiBase}/webhooks`] });
      setWebhookUrl("");
      toast({ title: "Repository webhook created" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create repository webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  if (authLoading || githubStatusLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!githubStatus?.connected) {
    return (
      <div className="container py-8 max-w-3xl">
        <Card className="p-8 text-center space-y-4">
          <Github className="mx-auto h-12 w-12 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Repositories</h1>
            <p className="mt-2 text-muted-foreground">
              Connect GitHub in Settings to browse files, create branches, open pull requests,
              review changes, and configure repository webhooks.
            </p>
          </div>
          <Button onClick={() => (window.location.href = "/app/settings")}>Open Settings</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Repositories</h1>
          <p className="text-muted-foreground mt-2">
            Browse source files, commit edits, manage branches, open pull requests, inspect commit
            history, run automated reviews, and configure GitHub webhooks.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] })}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Create Repository</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-name">Name</Label>
              <Input
                id="repo-name"
                value={newRepoName}
                onChange={(event) => setNewRepoName(event.target.value)}
                placeholder="feature-demo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-description">Description</Label>
              <Textarea
                id="repo-description"
                value={newRepoDescription}
                onChange={(event) => setNewRepoDescription(event.target.value)}
                placeholder="Repository purpose"
                className="min-h-[96px]"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => createRepositoryMutation.mutate()}
              disabled={!newRepoName.trim() || createRepositoryMutation.isPending}
            >
              {createRepositoryMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Repository
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Github className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Your Repositories</h2>
            </div>

            <div className="space-y-2 max-h-[700px] overflow-auto">
              {repositoriesLoading ? (
                <div className="text-sm text-muted-foreground">Loading repositories...</div>
              ) : repositories.length === 0 ? (
                <div className="text-sm text-muted-foreground">No repositories available.</div>
              ) : (
                repositories.map((repository) => {
                  const selected = repository.full_name === selectedRepositoryFullName;

                  return (
                    <button
                      key={repository.id}
                      type="button"
                      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedRepositoryFullName(repository.full_name)}
                      data-testid={`repo-list-item-${repository.full_name}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{repository.full_name}</span>
                        <Badge variant={repository.private ? "secondary" : "outline"}>
                          {repository.private ? "Private" : "Public"}
                        </Badge>
                      </div>
                      {repository.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {repository.description}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {selectedRepository && (
          <div className="space-y-6 min-w-0">
            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{selectedRepository.full_name}</h2>
                  <a
                    href={selectedRepository.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Open on GitHub
                  </a>
                </div>
                <Badge variant="outline">Default branch: {selectedRepository.default_branch}</Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-2">
                  <Label htmlFor="branch-select">Active branch</Label>
                  <select
                    id="branch-select"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedBranch}
                    onChange={(event) => setSelectedBranch(event.target.value)}
                  >
                    {branches.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-branch-name">Create branch from current branch</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-branch-name"
                      value={newBranchName}
                      onChange={(event) => setNewBranchName(event.target.value)}
                      placeholder="feature/review-ui"
                    />
                    <Button
                      onClick={() => createBranchMutation.mutate()}
                      disabled={!newBranchName.trim() || createBranchMutation.isPending}
                      aria-label="Create branch"
                      data-testid="button-create-branch"
                    >
                      {createBranchMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <GitBranch className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <Card className="p-4 space-y-4 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Repository Files</h2>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{currentPath || "/"}</span>
                    {currentPath && (
                      <Button variant="outline" size="sm" onClick={() => setCurrentPath(getParentPath(currentPath))}>
                        Up
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="rounded-lg border">
                    <div className="max-h-[520px] overflow-auto p-2">
                      {contentsLoading ? (
                        <div className="p-3 text-sm text-muted-foreground">Loading contents...</div>
                      ) : directoryEntries.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">
                          {currentPath ? "This directory is empty." : "No files found at the repository root."}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {directoryEntries.map((entry) => (
                            <button
                              key={entry.path}
                              type="button"
                              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted/50 ${
                                selectedFilePath === entry.path ? "bg-muted" : ""
                              }`}
                              onClick={() => {
                                if (entry.type === "dir") {
                                  setCurrentPath(entry.path);
                                  setSelectedFilePath("");
                                  setFileContent("");
                                  setCommitMessage("");
                                  return;
                                }

                                if (entry.type === "file") {
                                  setSelectedFilePath(entry.path);
                                }
                              }}
                            >
                              {entry.type === "dir" ? (
                                <Folder className="h-4 w-4 text-primary" />
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="truncate">{entry.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 min-w-0">
                    {selectedFilePath ? (
                      selectedFileLoading || !selectedFileData ? (
                        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                          Loading file contents...
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="commit-message">Commit message</Label>
                            <Input
                              id="commit-message"
                              value={commitMessage}
                              onChange={(event) => setCommitMessage(event.target.value)}
                              placeholder="Describe the change"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="file-editor">{selectedFileData.path}</Label>
                            <Textarea
                              id="file-editor"
                              value={fileContent}
                              onChange={(event) => setFileContent(event.target.value)}
                              className="min-h-[420px] font-mono text-sm"
                              data-testid="repository-file-editor"
                            />
                          </div>
                          <Button
                            onClick={() => saveFileMutation.mutate()}
                            disabled={!commitMessage.trim() || saveFileMutation.isPending}
                            data-testid="button-save-file"
                          >
                            {saveFileMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Commit file update
                          </Button>
                        </>
                      )
                    ) : (
                      <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
                        Select a file to view and edit it directly from the active branch.
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <div className="space-y-6 min-w-0">
                <Card className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <GitCommitHorizontal className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Commit History</h2>
                  </div>
                  <div className="space-y-3">
                    {commits.map((commit) => (
                      <a
                        key={commit.sha}
                        href={commit.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border p-3 hover:bg-muted/50"
                      >
                        <div className="font-medium line-clamp-2">{commit.commit.message}</div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {commit.sha.slice(0, 7)} · {commit.commit.author.name} ·{" "}
                          {new Date(commit.commit.author.date).toLocaleString()}
                        </div>
                      </a>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Repository Webhooks</h2>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Callback URL</Label>
                    <Input
                      id="webhook-url"
                      value={webhookUrl}
                      onChange={(event) => setWebhookUrl(event.target.value)}
                      placeholder="https://example.com/github/webhook"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-events">Events (comma separated)</Label>
                    <Input
                      id="webhook-events"
                      value={webhookEvents}
                      onChange={(event) => setWebhookEvents(event.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => createWebhookMutation.mutate()}
                    disabled={!webhookUrl.trim() || createWebhookMutation.isPending}
                  >
                    {createWebhookMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Webhook className="w-4 h-4 mr-2" />
                    )}
                    Add Webhook
                  </Button>
                  <div className="space-y-2">
                    {webhooks.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No repository webhooks configured.</div>
                    ) : (
                      webhooks.map((webhook) => (
                        <div key={webhook.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{webhook.config.url || "Hidden webhook URL"}</span>
                            <Badge variant={webhook.active ? "default" : "secondary"}>
                              {webhook.active ? "Active" : "Paused"}
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Events: {webhook.events.join(", ")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>

            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-primary" />
                <h2 className="font-semibold">Pull Requests & Automated Review</h2>
              </div>

              <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="pull-request-title">Pull request title</Label>
                    <Input
                      id="pull-request-title"
                      value={pullRequestTitle}
                      onChange={(event) => setPullRequestTitle(event.target.value)}
                      placeholder={`Merge ${selectedBranch} into ${selectedRepository.default_branch}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pull-request-body">Description</Label>
                    <Textarea
                      id="pull-request-body"
                      value={pullRequestBody}
                      onChange={(event) => setPullRequestBody(event.target.value)}
                      className="min-h-[180px]"
                      placeholder="Summarize the changes in this branch."
                    />
                  </div>
                  <Button
                    onClick={() => createPullRequestMutation.mutate()}
                    disabled={
                      !pullRequestTitle.trim() ||
                      selectedBranch === selectedRepository.default_branch ||
                      createPullRequestMutation.isPending
                    }
                  >
                    {createPullRequestMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <GitPullRequest className="w-4 h-4 mr-2" />
                    )}
                    Create Pull Request
                  </Button>
                </div>

                <div className="space-y-4 min-w-0">
                  <div className="space-y-2">
                    <Label htmlFor="review-notes">Optional review instructions</Label>
                    <Textarea
                      id="review-notes"
                      value={reviewNotes}
                      onChange={(event) => setReviewNotes(event.target.value)}
                      className="min-h-[100px]"
                      placeholder="Point the reviewer toward risk areas, migration notes, or known tradeoffs."
                    />
                  </div>
                  <div className="space-y-3">
                    {pullRequests.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                        No open pull requests for this repository yet.
                      </div>
                    ) : (
                      pullRequests.map((pullRequest) => (
                        <div key={pullRequest.number} className="rounded-lg border p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">
                                #{pullRequest.number} {pullRequest.title}
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {pullRequest.head.ref} → {pullRequest.base.ref}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => reviewPullRequestMutation.mutate(pullRequest.number)}
                              disabled={reviewPullRequestMutation.isPending}
                            >
                              {reviewPullRequestMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                              )}
                              Run Review
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {reviewResult && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <h3 className="font-medium mb-2">Latest automated review</h3>
                      <pre className="whitespace-pre-wrap text-sm font-sans">{reviewResult}</pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
