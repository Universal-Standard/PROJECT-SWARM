import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Filter, Play, Pause, RotateCcw } from "lucide-react";
import { MessageCard } from "./message-card";
import { filterAgentMessages, getReplayMessages } from "./agent-message-flow.utils";
import type { AgentMessage, Agent } from "@shared/schema";

interface AgentMessageFlowProps {
  messages: AgentMessage[];
  agents: Agent[];
  autoScroll?: boolean;
}

export function AgentMessageFlow({ messages, agents, autoScroll = true }: AgentMessageFlowProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState<"1" | "2" | "4">("1");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && !isReplayMode && scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, autoScroll, isReplayMode]);

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach((agent) => map.set(agent.id, agent));
    return map;
  }, [agents]);

  const filteredMessages = useMemo(() => {
    return filterAgentMessages(messages, { searchQuery, filterAgent, filterRole });
  }, [messages, searchQuery, filterAgent, filterRole]);

  useEffect(() => {
    if (!isReplayMode) {
      setReplayIndex(filteredMessages.length);
      setIsReplaying(false);
      return;
    }

    setReplayIndex((current) => Math.min(current, filteredMessages.length));
    if (filteredMessages.length === 0) {
      setIsReplaying(false);
    }
  }, [filteredMessages.length, isReplayMode]);

  useEffect(() => {
    if (!isReplayMode || !isReplaying) {
      return;
    }

    if (replayIndex >= filteredMessages.length) {
      setIsReplaying(false);
      return;
    }

    const speed = Number(replaySpeed);
    const timeout = window.setTimeout(
      () => {
        setReplayIndex((current) => Math.min(current + 1, filteredMessages.length));
      },
      Math.max(1000 / speed, 100)
    );

    return () => window.clearTimeout(timeout);
  }, [isReplayMode, isReplaying, replayIndex, replaySpeed, filteredMessages.length]);

  const visibleMessages = useMemo(
    () => getReplayMessages(filteredMessages, isReplayMode, replayIndex),
    [filteredMessages, isReplayMode, replayIndex]
  );

  const handleToggleReplayMode = () => {
    if (isReplayMode) {
      setIsReplayMode(false);
      setIsReplaying(false);
      return;
    }

    setIsReplayMode(true);
    setReplayIndex(0);
    setIsReplaying(false);
  };

  const exportMessages = () => {
    const data = visibleMessages.map((msg) => ({
      timestamp: msg.timestamp,
      agent: agentMap.get(msg.agentId)?.name || msg.agentId,
      role: msg.role,
      content: msg.content,
      tokenCount: msg.tokenCount,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `messages-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = ["Timestamp", "Agent", "Role", "Token Count", "Content"];
    const rows = visibleMessages.map((msg) => [
      new Date(msg.timestamp).toISOString(),
      agentMap.get(msg.agentId)?.name || msg.agentId,
      msg.role,
      msg.tokenCount?.toString() || "",
      msg.content.replace(/"/g, '""'),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `messages-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Agent Messages</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {isReplayMode
                ? `${visibleMessages.length}/${filteredMessages.length}`
                : filteredMessages.length}{" "}
              messages
            </Badge>
            <Button
              size="sm"
              variant={isReplayMode ? "default" : "outline"}
              onClick={handleToggleReplayMode}
            >
              Replay
            </Button>
            <Button size="sm" variant="outline" onClick={exportMessages}>
              <Download className="w-4 h-4 mr-1" />
              JSON
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="assistant">Assistant</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isReplayMode && filteredMessages.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setReplayIndex(0);
                setIsReplaying(false);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsReplaying((current) => {
                  if (current) {
                    return false;
                  }

                  if (replayIndex >= filteredMessages.length) {
                    setReplayIndex(0);
                  }

                  return true;
                });
              }}
            >
              {isReplaying ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Play
                </>
              )}
            </Button>
            <div className="flex-1 min-w-[220px]">
              <Slider
                value={[replayIndex]}
                min={0}
                max={filteredMessages.length}
                step={1}
                onValueChange={(value) => setReplayIndex(value[0] ?? 0)}
              />
            </div>
            <Select
              value={replaySpeed}
              onValueChange={(value) => setReplaySpeed(value as "1" | "2" | "4")}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="4">4x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6" ref={scrollRef}>
          {visibleMessages.length > 0 ? (
            <div className="space-y-3">
              {visibleMessages.map((message, index) => (
                <MessageCard
                  key={message.id ?? `${new Date(message.timestamp).toISOString()}-${index}`}
                  message={message}
                  agentName={agentMap.get(message.agentId)?.name}
                  fromAgentName={
                    message.fromAgentId ? agentMap.get(message.fromAgentId)?.name : undefined
                  }
                  toAgentName={
                    message.toAgentId ? agentMap.get(message.toAgentId)?.name : undefined
                  }
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {searchQuery || filterAgent !== "all" || filterRole !== "all"
                ? "No messages match your filters"
                : isReplayMode
                  ? "Start replay to view messages"
                  : "No messages yet"}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
