import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Clock, ArrowRight, ExternalLink, Square } from "lucide-react";
import type { Execution, ExecutionLog, AgentMessage, Agent } from "@shared/schema";
import { useExecutionMonitor } from "@/hooks/useExecutionMonitor";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ExecutionMonitor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const { status: monitorStatus } = useExecutionMonitor(id || null, user?.id || null, {
    autoConnect: !!id && !!user?.id,
  });

  const { data: execution, isLoading: executionLoading } = useQuery<Execution>({
    queryKey: ["/api/executions", id],
    refetchInterval: monitorStatus.status === "connected" ? false : 2000,
  });

  const { data: logs, isLoading: logsLoading } = useQuery<ExecutionLog[]>({
    queryKey: [`/api/executions/${id}/logs`],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<AgentMessage[]>({
    queryKey: [`/api/executions/${id}/messages`],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/workflows", execution?.workflowId, "agents"],
    enabled: !!execution?.workflowId,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Execution id is required");
      const response = await apiRequest("POST", `/api/executions/${id}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/executions", id] });
      toast({
        title: "Execution cancelled",
        description: "The execution has been marked for cancellation.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const liveExecutionStatus = useMemo(() => {
    let nextStatus = execution?.status || "pending";

    for (const event of monitorStatus.events) {
      if (event.type === "execution_started") nextStatus = "running";
      if (event.type === "execution_completed") nextStatus = "completed";
      if (event.type === "execution_failed") nextStatus = "error";
      if (event.type === "execution_cancelled") nextStatus = "cancelled";
    }

    return nextStatus;
  }, [execution?.status, monitorStatus.events]);

  const combinedLogs = useMemo(() => {
    const persistedLogs = logs || [];
    const streamLogs = monitorStatus.logs.map((log, index) => ({
      id: `stream-${index}`,
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
    }));

    return [...persistedLogs, ...streamLogs];
  }, [logs, monitorStatus.logs]);

  const combinedMessages = useMemo(() => {
    const persistedMessages = messages || [];
    const streamMessages = monitorStatus.messages.map((message, index) => ({
      id: `stream-${index}`,
      role: message.role,
      content: message.content,
      tokenCount: null,
    }));

    return [...persistedMessages, ...streamMessages];
  }, [messages, monitorStatus.messages]);

  const completedAgentIds = useMemo(() => {
    const completed = new Set<string>();
    monitorStatus.events.forEach((event) => {
      if (event.type === "agent_completed" && event.agentId) {
        completed.add(event.agentId);
      }
    });
    return completed;
  }, [monitorStatus.events]);

  const completedAgentCount = useMemo(() => {
    if (liveExecutionStatus === "completed") {
      return agents.length;
    }
    return completedAgentIds.size;
  }, [agents.length, completedAgentIds, liveExecutionStatus]);

  const progressPercent = agents.length
    ? Math.min(100, Math.round((completedAgentCount / agents.length) * 100))
    : liveExecutionStatus === "completed"
      ? 100
      : 0;

  if (executionLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Execution not found</p>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    running: { icon: Loader2, color: "text-primary", bg: "bg-primary/10" },
    completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    cancelled: { icon: Square, color: "text-muted-foreground", bg: "bg-muted" },
    error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  };

  const config =
    statusConfig[liveExecutionStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;
  const isTerminal = ["completed", "error", "cancelled"].includes(liveExecutionStatus);

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Execution Monitor</h1>
          <p className="text-muted-foreground">Execution ID: {execution.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{monitorStatus.status}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending || isTerminal}
            data-testid="button-cancel-running-execution"
          >
            <Square className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Link href={`/app/executions/${execution.id}/detail`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Detailed View
            </Button>
          </Link>
          <Badge
            className={`gap-2 ${config.bg} ${config.color} border-0`}
            data-testid="badge-execution-status"
          >
            <StatusIcon
              className={`w-4 h-4 ${liveExecutionStatus === "running" ? "animate-spin" : ""}`}
            />
            {liveExecutionStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Execution Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>{completedAgentCount} / {agents.length || "?"} agents completed</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
          {agents.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => {
                const isRunning = monitorStatus.currentAgent?.id === agent.id;
                const isCompleted = completedAgentIds.has(agent.id);
                return (
                  <Badge
                    key={agent.id}
                    variant="outline"
                    className={isRunning ? "border-primary text-primary" : isCompleted ? "border-green-500 text-green-500" : ""}
                  >
                    {agent.name}: {isCompleted ? "completed" : isRunning ? "running" : "pending"}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Execution Logs</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : combinedLogs.length > 0 ? (
                <div className="space-y-2 font-mono text-sm">
                  {combinedLogs.map((log, index) => {
                    const levelColors = {
                      info: "text-muted-foreground",
                      warning: "text-amber-500",
                      error: "text-destructive",
                    };
                    return (
                      <div key={log.id || `log-${index}`} className="flex gap-3" data-testid={`log-${log.id || index}`}>
                        <span className="text-muted-foreground shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span
                          className={`font-medium shrink-0 uppercase ${levelColors[log.level as keyof typeof levelColors] || "text-muted-foreground"}`}
                        >
                          [{log.level}]
                        </span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No logs available
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Agent Messages</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : combinedMessages.length > 0 ? (
                <div className="space-y-4">
                  {combinedMessages.map((message, index) => (
                    <div key={message.id || `message-${index}`} data-testid={`message-${message.id || index}`}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {message.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {message.tokenCount ? `${message.tokenCount} tokens` : ""}
                          </span>
                        </div>
                        <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No messages yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {!!execution.output && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(execution.output, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {execution.error && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{execution.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
