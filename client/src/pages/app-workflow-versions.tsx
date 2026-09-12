import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Clock, GitCompare, GitFork, Pencil, RotateCcw, Save, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  parentVersionId: string | null;
  branchName: string;
  name: string | null;
  tag: string | null;
  commitMessage: string;
  userId: string;
  executionCount: number;
  successRate: number;
  avgDuration: number;
  isActive: boolean;
  createdAt: string;
  data: unknown;
}

interface VersionComparison {
  diff: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
    agentsAdded: number;
    agentsRemoved: number;
    agentsModified: number;
  };
}

export default function WorkflowVersionsPage() {
  const params = useParams();
  const workflowId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commitMessage, setCommitMessage] = useState("");
  const [compareVersionA, setCompareVersionA] = useState("");
  const [compareVersionB, setCompareVersionB] = useState("");

  const { data: versions = [], isLoading } = useQuery<WorkflowVersion[]>({
    queryKey: [`/api/workflows/${workflowId}/versions`],
    enabled: !!workflowId,
  });

  const { data: comparison } = useQuery<VersionComparison>({
    queryKey: [
      `/api/workflows/${workflowId}/versions/${compareVersionA}/compare/${compareVersionB}`,
    ],
    enabled:
      !!workflowId && !!compareVersionA && !!compareVersionB && compareVersionA !== compareVersionB,
  });

  const createVersion = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/workflows/${workflowId}/versions`, {
        commitMessage: message,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
      setCommitMessage("");
      toast({
        title: "Version created",
        description: "Workflow version saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/workflows/${workflowId}/versions/${versionId}/restore`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
      toast({
        title: "Version restored",
        description: "Workflow has been restored to the selected version",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const tagVersion = useMutation({
    mutationFn: async ({ versionId, tag }: { versionId: string; tag: string | null }) => {
      const response = await apiRequest("PUT", `/api/versions/${versionId}/tag`, { tag });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
    },
  });

  const nameVersion = useMutation({
    mutationFn: async ({ versionId, name }: { versionId: string; name: string }) => {
      const response = await apiRequest("PUT", `/api/versions/${versionId}/name`, { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
    },
  });

  const branchVersion = useMutation({
    mutationFn: async ({ versionId, branchName }: { versionId: string; branchName: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/workflows/${workflowId}/versions/${versionId}/branch`,
        {
          branchName,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading versions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitBranch className="h-8 w-8" />
            Workflow Versions
          </h1>
          <p className="text-muted-foreground">Git-like version control for your workflow</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/app/workflows/${workflowId}`)}>
          Back to Workflow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Version</CardTitle>
          <CardDescription>Save a snapshot of your current workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter commit message (e.g., 'Added new agent for data processing')"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
            <Button
              onClick={() => createVersion.mutate(commitMessage)}
              disabled={!commitMessage || createVersion.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Commit
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            {versions.length} version{versions.length !== 1 ? "s" : ""} saved
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length > 1 && (
            <div className="mb-6 border rounded-lg p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                Compare Versions
              </h3>
              <div className="flex flex-wrap gap-2">
                <select
                  className="border rounded-md px-3 py-2 bg-background text-sm"
                  value={compareVersionA}
                  onChange={(e) => setCompareVersionA(e.target.value)}
                >
                  <option value="">Select first version</option>
                  {versions.map((version) => (
                    <option key={`a-${version.id}`} value={version.id}>
                      v{version.version} ({version.branchName})
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded-md px-3 py-2 bg-background text-sm"
                  value={compareVersionB}
                  onChange={(e) => setCompareVersionB(e.target.value)}
                >
                  <option value="">Select second version</option>
                  {versions.map((version) => (
                    <option key={`b-${version.id}`} value={version.id}>
                      v{version.version} ({version.branchName})
                    </option>
                  ))}
                </select>
              </div>
              {comparison && (
                <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="border rounded p-2">+ Nodes: {comparison.diff.nodesAdded}</div>
                  <div className="border rounded p-2">- Nodes: {comparison.diff.nodesRemoved}</div>
                  <div className="border rounded p-2">~ Nodes: {comparison.diff.nodesModified}</div>
                  <div className="border rounded p-2">+ Edges: {comparison.diff.edgesAdded}</div>
                  <div className="border rounded p-2">- Edges: {comparison.diff.edgesRemoved}</div>
                  <div className="border rounded p-2">+ Agents: {comparison.diff.agentsAdded}</div>
                  <div className="border rounded p-2">
                    - Agents: {comparison.diff.agentsRemoved}
                  </div>
                  <div className="border rounded p-2">
                    ~ Agents: {comparison.diff.agentsModified}
                  </div>
                </div>
              )}
            </div>
          )}
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No versions yet. Create your first version to track changes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={version.isActive ? "default" : "secondary"}>
                        v{version.version}
                      </Badge>
                      <Badge variant="outline">{version.branchName}</Badge>
                      {version.tag && <Badge variant="secondary">#{version.tag}</Badge>}
                      {version.isActive && (
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {version.name || `Version ${version.version}`}
                    </p>
                    <p className="font-medium">{version.commitMessage}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                      {version.parentVersionId && (
                        <span>Parent: {version.parentVersionId.slice(0, 8)}</span>
                      )}
                      <span>Runs: {version.executionCount}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const branchName = window.prompt("Enter branch name");
                        if (branchName && branchName.trim()) {
                          branchVersion.mutate({
                            versionId: version.id,
                            branchName: branchName.trim(),
                          });
                        }
                      }}
                      disabled={branchVersion.isPending}
                    >
                      <GitFork className="h-4 w-4 mr-2" />
                      Branch
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextTag = window.prompt(
                          "Enter tag (leave empty to clear)",
                          version.tag || ""
                        );
                        if (nextTag !== null) {
                          tagVersion.mutate({ versionId: version.id, tag: nextTag.trim() || null });
                        }
                      }}
                      disabled={tagVersion.isPending}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Tag
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextName = window.prompt(
                          "Enter version name",
                          version.name || `Version ${version.version}`
                        );
                        if (nextName && nextName.trim()) {
                          nameVersion.mutate({ versionId: version.id, name: nextName.trim() });
                        }
                      }}
                      disabled={nameVersion.isPending}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Name
                    </Button>
                    {!version.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreVersion.mutate(version.id)}
                        disabled={restoreVersion.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
