import { useMemo } from "react";
import { Node, Edge } from "@xyflow/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationIssue {
  id: string;
  type: "error" | "warning";
  title: string;
  description: string;
  nodeIds?: string[];
  edgeIds?: string[];
  fix?: () => void;
}

interface ConnectionValidatorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export function ConnectionValidator({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: ConnectionValidatorProps) {
  const issues = useMemo(() => {
    const foundIssues: ValidationIssue[] = [];

    // Check for circular dependencies
    const detectCycles = () => {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      const cycles: string[][] = [];

      const dfs = (nodeId: string, path: string[]): boolean => {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        path.push(nodeId);

        const outgoingEdges = edges.filter((e) => e.source === nodeId);

        for (const edge of outgoingEdges) {
          if (!visited.has(edge.target)) {
            if (dfs(edge.target, [...path])) {
              return true;
            }
          } else if (recursionStack.has(edge.target)) {
            const cycleStart = path.indexOf(edge.target);
            if (cycleStart !== -1) {
              cycles.push([...path.slice(cycleStart), edge.target]);
            }
            return true;
          }
        }

        recursionStack.delete(nodeId);
        return false;
      };

      nodes.forEach((node) => {
        if (!visited.has(node.id)) {
          dfs(node.id, []);
        }
      });

      return cycles;
    };

    const cycles = detectCycles();
    if (cycles.length > 0) {
      cycles.forEach((cycle, index) => {
        const cycleNodes = cycle.map((id) => nodes.find((n) => n.id === id)?.data?.label || id);
        foundIssues.push({
          id: `cycle-${index}`,
          type: "error",
          title: "Circular Dependency Detected",
          description: `Cycle found: ${cycleNodes.join(" → ")}`,
          nodeIds: cycle,
        });
      });
    }

    // Check for orphan nodes (no connections)
    nodes.forEach((node) => {
      const hasIncoming = edges.some((e) => e.target === node.id);
      const hasOutgoing = edges.some((e) => e.source === node.id);

      if (!hasIncoming && !hasOutgoing) {
        foundIssues.push({
          id: `orphan-${node.id}`,
          type: "error",
          title: "Orphan Node",
          description: `Node "${node.data?.label || node.id}" has no connections`,
          nodeIds: [node.id],
        });
      }
    });

    // Check for invalid edge references
    const nodeIds = new Set(nodes.map((node) => node.id));
    edges.forEach((edge) => {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        foundIssues.push({
          id: `invalid-edge-${edge.id}`,
          type: "error",
          title: "Invalid Node Connection",
          description: `Edge "${edge.id}" references missing node(s): ${edge.source} → ${edge.target}`,
          edgeIds: [edge.id],
        });
      }
    });

    // Check required node fields and agent configuration
    nodes.forEach((node) => {
      if (!node.id) {
        const issueSuffix = foundIssues.length;
        foundIssues.push({
          id: `missing-id-${issueSuffix}`,
          type: "error",
          title: "Missing Node ID",
          description: "A node is missing an ID.",
        });
      }

      if (!node.type) {
        const issueSuffix = foundIssues.length;
        foundIssues.push({
          id: `missing-type-${node.id || issueSuffix}`,
          type: "error",
          title: "Missing Node Type",
          description: `Node "${node.data?.label || node.id || "Unknown"}" is missing a type.`,
          nodeIds: node.id ? [node.id] : undefined,
        });
      }

      const position = node.position;
      if (!position || typeof position.x !== "number" || typeof position.y !== "number") {
        foundIssues.push({
          id: `invalid-position-${node.id}`,
          type: "error",
          title: "Invalid Node Position",
          description: `Node "${node.data?.label || node.id}" is missing a valid position.`,
          nodeIds: [node.id],
        });
      }

      if (node.type === "agent") {
        const role = typeof node.data?.role === "string" ? node.data.role.trim() : "";
        const provider = typeof node.data?.provider === "string" ? node.data.provider.trim() : "";
        const model = typeof node.data?.model === "string" ? node.data.model.trim() : "";

        if (!role) {
          foundIssues.push({
            id: `missing-role-${node.id}`,
            type: "error",
            title: "Missing Agent Role",
            description: `Agent node "${node.data?.label || node.id}" is missing role configuration.`,
            nodeIds: [node.id],
          });
        }

        if (!provider) {
          foundIssues.push({
            id: `missing-provider-${node.id}`,
            type: "error",
            title: "Missing Agent Provider",
            description: `Agent node "${node.data?.label || node.id}" is missing provider configuration.`,
            nodeIds: [node.id],
          });
        }

        if (!model) {
          foundIssues.push({
            id: `missing-model-${node.id}`,
            type: "error",
            title: "Missing Agent Model",
            description: `Agent node "${node.data?.label || node.id}" is missing model configuration.`,
            nodeIds: [node.id],
          });
        }
      }
    });

    // Check for nodes with no incoming connections (potential entry points)
    const nodesWithoutIncoming = nodes.filter(
      (node) => !edges.some((e) => e.target === node.id) && edges.some((e) => e.source === node.id)
    );

    if (nodesWithoutIncoming.length > 1) {
      foundIssues.push({
        id: "multiple-entry-points",
        type: "warning",
        title: "Multiple Entry Points",
        description: `${nodesWithoutIncoming.length} nodes have no incoming connections. Consider having a single coordinator node as entry point.`,
        nodeIds: nodesWithoutIncoming.map((n) => n.id),
      });
    }

    // Check for nodes with no outgoing connections (endpoints)
    const nodesWithoutOutgoing = nodes.filter(
      (node) => !edges.some((e) => e.source === node.id) && edges.some((e) => e.target === node.id)
    );

    if (nodesWithoutOutgoing.length === 0 && nodes.length > 0 && edges.length > 0) {
      foundIssues.push({
        id: "no-endpoints",
        type: "warning",
        title: "No Terminal Nodes",
        description:
          "No nodes found without outgoing connections. Every workflow should have at least one endpoint.",
      });
    }

    // Check for maximum connections per node (reasonable limit)
    const MAX_CONNECTIONS = 10;
    nodes.forEach((node) => {
      const connections = edges.filter((e) => e.source === node.id || e.target === node.id);
      if (connections.length > MAX_CONNECTIONS) {
        foundIssues.push({
          id: `max-connections-${node.id}`,
          type: "warning",
          title: "Too Many Connections",
          description: `Node "${node.data?.label || node.id}" has ${connections.length} connections. Consider simplifying.`,
          nodeIds: [node.id],
        });
      }
    });

    return foundIssues;
  }, [nodes, edges]);

  const errorCount = issues.filter((i) => i.type === "error").length;
  const warningCount = issues.filter((i) => i.type === "warning").length;

  if (issues.length === 0) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-500">Workflow Valid</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          No validation issues found. Your workflow is ready to execute.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={errorCount > 0 ? "destructive" : "secondary"}>
          {errorCount} {errorCount === 1 ? "Error" : "Errors"}
        </Badge>
        <Badge variant="outline">
          {warningCount} {warningCount === 1 ? "Warning" : "Warnings"}
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {issues.map((issue) => (
            <Alert
              key={issue.id}
              variant={issue.type === "error" ? "destructive" : "default"}
              className={issue.type === "warning" ? "border-amber-500/50 bg-amber-500/10" : ""}
            >
              {issue.type === "error" ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <div className="flex-1">
                <AlertTitle className={issue.type === "warning" ? "text-amber-500" : ""}>
                  {issue.title}
                </AlertTitle>
                <AlertDescription
                  className={issue.type === "warning" ? "text-amber-700 dark:text-amber-300" : ""}
                >
                  {issue.description}
                </AlertDescription>
                {issue.fix && (
                  <Button size="sm" variant="outline" onClick={issue.fix} className="mt-2">
                    Fix Issue
                  </Button>
                )}
              </div>
            </Alert>
          ))}
        </div>
      </ScrollArea>

      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Execute</AlertTitle>
          <AlertDescription>
            Please resolve all errors before executing the workflow.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Hook to get validation status
 */
export function useWorkflowValidation(nodes: Node[], edges: Edge[]) {
  return useMemo(() => {
    let errorCount = 0;
    let warningCount = 0;

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (dfs(edge.target)) {
            return true;
          }
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id) && dfs(node.id)) {
        errorCount++;
        break;
      }
    }

    const nodeIds = new Set(nodes.map((node) => node.id));
    for (const edge of edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        errorCount++;
      }
    }

    for (const node of nodes) {
      const hasIncoming = edges.some((e) => e.target === node.id);
      const hasOutgoing = edges.some((e) => e.source === node.id);
      if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
        errorCount++;
      }

      const position = node.position;
      if (
        !node.id ||
        !node.type ||
        !position ||
        typeof position.x !== "number" ||
        typeof position.y !== "number"
      ) {
        errorCount++;
      }

      if (node.type === "agent") {
        const role = typeof node.data?.role === "string" ? node.data.role.trim() : "";
        const provider = typeof node.data?.provider === "string" ? node.data.provider.trim() : "";
        const model = typeof node.data?.model === "string" ? node.data.model.trim() : "";
        if (!role || !provider || !model) {
          errorCount++;
        }
      }
    }

    // Keep non-blocking informational warning for multiple entry points
    const nodesWithoutIncoming = nodes.filter(
      (node) => !edges.some((e) => e.target === node.id) && edges.some((e) => e.source === node.id)
    );
    if (nodesWithoutIncoming.length > 1) {
      warningCount++;
    }

    return {
      isValid: errorCount === 0,
      hasErrors: errorCount > 0,
      errorCount,
      warningCount,
    };
  }, [nodes, edges]);
}
