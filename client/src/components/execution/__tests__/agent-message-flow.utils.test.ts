import { filterAgentMessages, getReplayMessages } from "../agent-message-flow.utils";
import type { AgentMessage } from "@shared/schema";

const baseTimestamp = new Date("2026-01-01T10:00:00.000Z");

const sampleMessages: AgentMessage[] = [
  {
    id: "m1",
    executionId: "e1",
    agentId: "agent-a",
    role: "assistant",
    content: "Planning execution strategy",
    tokenCount: 120,
    fromAgentId: null,
    toAgentId: null,
    timestamp: baseTimestamp,
  },
  {
    id: "m2",
    executionId: "e1",
    agentId: "agent-b",
    role: "user",
    content: "Please summarize findings",
    tokenCount: 64,
    fromAgentId: "agent-a",
    toAgentId: "agent-b",
    timestamp: new Date("2026-01-01T10:01:00.000Z"),
  },
];

describe("agent-message-flow utils", () => {
  it("filters messages by search, agent and role", () => {
    const filtered = filterAgentMessages(sampleMessages, {
      searchQuery: "summarize",
      filterAgent: "agent-b",
      filterRole: "user",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("m2");
  });

  it("returns a bounded replay slice", () => {
    const replayed = getReplayMessages(sampleMessages, true, 1);
    expect(replayed.map((message) => message.id)).toEqual(["m1"]);

    const overBounded = getReplayMessages(sampleMessages, true, 99);
    expect(overBounded).toHaveLength(sampleMessages.length);
  });
});
