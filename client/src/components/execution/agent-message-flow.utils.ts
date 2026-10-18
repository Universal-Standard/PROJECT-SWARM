import type { AgentMessage } from "@shared/schema";

interface MessageFilterOptions {
  searchQuery: string;
  filterAgent: string;
  filterRole: string;
}

export function filterAgentMessages(
  messages: AgentMessage[],
  options: MessageFilterOptions
): AgentMessage[] {
  const normalizedSearch = options.searchQuery.trim().toLowerCase();

  return messages.filter((message) => {
    if (normalizedSearch && !message.content.toLowerCase().includes(normalizedSearch)) {
      return false;
    }

    if (options.filterAgent !== "all" && message.agentId !== options.filterAgent) {
      return false;
    }

    if (options.filterRole !== "all" && message.role !== options.filterRole) {
      return false;
    }

    return true;
  });
}

export function getReplayMessages(
  messages: AgentMessage[],
  replayEnabled: boolean,
  replayIndex: number
): AgentMessage[] {
  if (!replayEnabled) {
    return messages;
  }

  const boundedIndex = Math.max(0, Math.min(replayIndex, messages.length));
  return messages.slice(0, boundedIndex);
}
