import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentMessage, Agent } from "@shared/schema";

interface AgentCommunicationGraphProps {
  messages: AgentMessage[];
  agents: Agent[];
}

interface ConnectionEdge {
  key: string;
  fromId: string;
  toId: string;
  count: number;
}

export function AgentCommunicationGraph({ messages, agents }: AgentCommunicationGraphProps) {
  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach((agent) => map.set(agent.id, agent));
    return map;
  }, [agents]);

  const metrics = useMemo(() => {
    const agentMessages = new Map<string, number>();
    const agentTokens = new Map<string, number>();
    const connections = new Map<string, number>();

    messages.forEach((message) => {
      const count = agentMessages.get(message.agentId) || 0;
      agentMessages.set(message.agentId, count + 1);

      const tokens = agentTokens.get(message.agentId) || 0;
      agentTokens.set(message.agentId, tokens + (message.tokenCount || 0));

      if (message.fromAgentId && message.toAgentId) {
        const key = `${message.fromAgentId}-${message.toAgentId}`;
        connections.set(key, (connections.get(key) || 0) + 1);
      }
    });

    const connectionEdges: ConnectionEdge[] = Array.from(connections.entries())
      .map(([key, count]) => {
        const [fromId, toId] = key.split("-");
        return { key, fromId, toId, count };
      })
      .filter((edge) => agentMap.has(edge.fromId) && agentMap.has(edge.toId));

    return { agentMessages, agentTokens, connectionEdges };
  }, [messages, agentMap]);

  const graphLayout = useMemo(() => {
    const width = 900;
    const height = 340;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(90, Math.min(130, Math.min(width, height) / 2 - 55));
    const nodeRadius = 24;

    const nodes = agents.map((agent, index) => {
      const angle = (index / Math.max(agents.length, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        agent,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    const nodePositionMap = new Map(nodes.map((node) => [node.agent.id, node]));
    const maxEdgeCount = metrics.connectionEdges.reduce(
      (max, edge) => Math.max(max, edge.count),
      1
    );

    const edges = metrics.connectionEdges
      .map((edge) => {
        const fromNode = nodePositionMap.get(edge.fromId);
        const toNode = nodePositionMap.get(edge.toId);
        if (!fromNode || !toNode) {
          return null;
        }

        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const unitX = dx / length;
        const unitY = dy / length;

        const x1 = fromNode.x + unitX * nodeRadius;
        const y1 = fromNode.y + unitY * nodeRadius;
        const x2 = toNode.x - unitX * nodeRadius;
        const y2 = toNode.y - unitY * nodeRadius;
        const strokeWidth = 1.5 + (edge.count / maxEdgeCount) * 3;

        return { ...edge, x1, y1, x2, y2, strokeWidth };
      })
      .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

    return { width, height, nodes, edges };
  }, [agents, metrics.connectionEdges]);

  const topConnections = useMemo(() => {
    return [...metrics.connectionEdges].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [metrics.connectionEdges]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Agent Communication Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No agents found
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => {
                const messageCount = metrics.agentMessages.get(agent.id) || 0;
                const tokenCount = metrics.agentTokens.get(agent.id) || 0;

                return (
                  <div
                    key={agent.id}
                    className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{agent.name}</h4>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {agent.provider}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Messages:</span>
                        <span className="font-medium">{messageCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tokens:</span>
                        <span className="font-medium">{tokenCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {graphLayout.edges.length > 0 ? (
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-medium">Communication Graph</h4>
                <div className="rounded-lg border bg-muted/20 p-2">
                  <svg
                    viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                    className="w-full h-[320px]"
                  >
                    <defs>
                      <marker
                        id="graph-arrowhead"
                        markerWidth="8"
                        markerHeight="6"
                        refX="7"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 8 3, 0 6" className="fill-muted-foreground/70" />
                      </marker>
                    </defs>

                    {graphLayout.edges.map((edge) => (
                      <g key={edge.key}>
                        <line
                          x1={edge.x1}
                          y1={edge.y1}
                          x2={edge.x2}
                          y2={edge.y2}
                          stroke="currentColor"
                          className="text-muted-foreground/70"
                          strokeWidth={edge.strokeWidth}
                          markerEnd="url(#graph-arrowhead)"
                        />
                        <text
                          x={(edge.x1 + edge.x2) / 2}
                          y={(edge.y1 + edge.y2) / 2 - 5}
                          textAnchor="middle"
                          className="fill-foreground text-[11px] font-medium"
                        >
                          {edge.count}
                        </text>
                      </g>
                    ))}

                    {graphLayout.nodes.map((node) => (
                      <g key={node.agent.id}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="24"
                          className="stroke-primary"
                          strokeWidth="1.5"
                          fill="hsl(var(--primary) / 0.12)"
                        />
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          className="fill-foreground text-xs font-semibold"
                        >
                          {node.agent.name.slice(0, 10)}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="text-xs text-muted-foreground">
                  Line thickness and labels represent message volume between agents.
                </div>
              </div>
            ) : (
              <div className="border-t pt-4 text-sm text-muted-foreground">
                No direct agent-to-agent links detected yet. Run a workflow with chained handoffs to
                visualize edges.
              </div>
            )}

            {topConnections.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Top Connections</h4>
                <div className="space-y-2">
                  {topConnections.map((edge) => {
                    const fromAgent = agentMap.get(edge.fromId);
                    const toAgent = agentMap.get(edge.toId);
                    if (!fromAgent || !toAgent) {
                      return null;
                    }

                    return (
                      <div
                        key={edge.key}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                      >
                        <span className="font-medium">
                          {fromAgent.name} → {toAgent.name}
                        </span>
                        <Badge variant="outline">{edge.count} msgs</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{agents.length}</div>
                  <div className="text-xs text-muted-foreground">Agents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{messages.length}</div>
                  <div className="text-xs text-muted-foreground">Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Array.from(metrics.agentTokens.values())
                      .reduce((sum, val) => sum + val, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Tokens</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
