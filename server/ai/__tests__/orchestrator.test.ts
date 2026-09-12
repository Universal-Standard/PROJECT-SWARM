import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  storageMock,
  aiExecutorMock,
  costTrackerMock,
  versionManagerMock,
  wsManagerMock,
  workflowValidatorMock,
} = vi.hoisted(() => ({
  storageMock: {
    getWorkflowById: vi.fn(),
    getAgentsByWorkflowId: vi.fn(),
    createExecution: vi.fn(),
    updateExecution: vi.fn(),
    createExecutionLog: vi.fn(),
    getRelevantKnowledge: vi.fn(),
    createAgentMessage: vi.fn(),
    createKnowledgeEntry: vi.fn(),
  },
  aiExecutorMock: {
    executeAgent: vi.fn(),
  },
  costTrackerMock: {
    trackExecutionCost: vi.fn(),
  },
  versionManagerMock: {
    updateVersionStats: vi.fn(),
  },
  wsManagerMock: {
    emitExecutionStarted: vi.fn(),
    emitAgentStarted: vi.fn(),
    emitMessage: vi.fn(),
    emitAgentCompleted: vi.fn(),
    emitExecutionCompleted: vi.fn(),
    emitExecutionFailed: vi.fn(),
    emitLog: vi.fn(),
  },
  workflowValidatorMock: {
    validate: vi.fn(),
  },
}));

vi.mock("../../storage", () => ({
  storage: storageMock,
}));

vi.mock("../executor", () => ({
  aiExecutor: aiExecutorMock,
}));

vi.mock("../../lib/cost-tracker", () => ({
  costTracker: costTrackerMock,
}));

vi.mock("../../lib/workflow-version", () => ({
  versionManager: versionManagerMock,
}));

vi.mock("../../websocket", () => ({
  wsManager: wsManagerMock,
}));

vi.mock("../../lib/workflow-validator", () => ({
  workflowValidator: workflowValidatorMock,
}));

vi.mock("../../lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { WorkflowOrchestrator } from "../orchestrator";

function createExecution() {
  return {
    id: "exec-1",
    workflowId: "wf-1",
    userId: "user-1",
    status: "running",
    input: { prompt: "start" },
    output: null,
    error: null,
    startedAt: new Date(),
    completedAt: null,
    duration: null,
  } as any;
}

function createWorkflow() {
  return {
    id: "wf-1",
    userId: "user-1",
    name: "Test workflow",
    nodes: [
      { id: "n3", type: "agent", data: {}, position: { x: 0, y: 0 } },
      { id: "n1", type: "agent", data: {}, position: { x: 0, y: 0 } },
      { id: "n2", type: "agent", data: {}, position: { x: 0, y: 0 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
    ],
  } as any;
}

function createAgents() {
  return [
    {
      id: "a1",
      workflowId: "wf-1",
      nodeId: "n1",
      name: "Agent 1",
      role: "coder",
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 70,
      maxTokens: 1000,
    },
    {
      id: "a2",
      workflowId: "wf-1",
      nodeId: "n2",
      name: "Agent 2",
      role: "researcher",
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      temperature: 70,
      maxTokens: 1000,
    },
    {
      id: "a3",
      workflowId: "wf-1",
      nodeId: "n3",
      name: "Agent 3",
      role: "coordinator",
      provider: "gemini",
      model: "gemini-1.5-flash",
      temperature: 70,
      maxTokens: 1000,
    },
  ] as any[];
}

async function waitForCondition(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("Condition was not met in time");
}

describe("WorkflowOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    storageMock.getWorkflowById.mockResolvedValue(createWorkflow());
    storageMock.getAgentsByWorkflowId.mockResolvedValue(createAgents());
    storageMock.createExecution.mockResolvedValue(createExecution());
    storageMock.updateExecution.mockImplementation(async (_id, patch) => ({
      ...createExecution(),
      ...patch,
    }));
    storageMock.createExecutionLog.mockResolvedValue({ id: "log-1" });
    storageMock.getRelevantKnowledge.mockResolvedValue([]);
    storageMock.createAgentMessage.mockResolvedValue({ id: "msg-1" });
    storageMock.createKnowledgeEntry.mockResolvedValue({ id: "knowledge-1" });

    costTrackerMock.trackExecutionCost.mockResolvedValue(undefined);
    versionManagerMock.updateVersionStats.mockResolvedValue(undefined);
    workflowValidatorMock.validate.mockReturnValue({ valid: true, errors: [] });

    aiExecutorMock.executeAgent
      .mockResolvedValueOnce({ content: "first", tokenCount: 10, finishReason: "stop" })
      .mockResolvedValueOnce({ content: "second", tokenCount: 15, finishReason: "stop" })
      .mockResolvedValueOnce({ content: "third", tokenCount: 20, finishReason: "stop" });
  });

  it("executes nodes in topological order and passes predecessor output as context", async () => {
    const orchestrator = new WorkflowOrchestrator();

    const result = await orchestrator.executeWorkflow("wf-1", { prompt: "start" });

    expect(aiExecutorMock.executeAgent).toHaveBeenCalledTimes(3);
    expect(aiExecutorMock.executeAgent.mock.calls.map(([agent]) => agent.id)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);

    expect(aiExecutorMock.executeAgent.mock.calls[0]?.[1]?.messages).toEqual([
      { role: "user", content: JSON.stringify({ prompt: "start" }) },
    ]);
    expect(aiExecutorMock.executeAgent.mock.calls[1]?.[1]?.messages).toEqual([
      { role: "user", content: "first" },
    ]);
    expect(aiExecutorMock.executeAgent.mock.calls[2]?.[1]?.messages).toEqual([
      { role: "user", content: "second" },
    ]);

    expect(storageMock.updateExecution).toHaveBeenCalledWith(
      "exec-1",
      expect.objectContaining({
        status: "completed",
        output: { result: "third" },
      })
    );

    expect(result.status).toBe("completed");
  });

  it("executes agents configured for OpenAI, Anthropic, and Gemini providers", async () => {
    const orchestrator = new WorkflowOrchestrator();

    await orchestrator.executeWorkflow("wf-1", "run all providers");

    expect(aiExecutorMock.executeAgent.mock.calls.map(([agent]) => agent.provider)).toEqual([
      "openai",
      "anthropic",
      "gemini",
    ]);
  });

  it("persists execution error state and emits failure event when an agent fails", async () => {
    aiExecutorMock.executeAgent
      .mockReset()
      .mockResolvedValueOnce({ content: "first", tokenCount: 10, finishReason: "stop" })
      .mockRejectedValue(new Error("provider timeout"));

    const orchestrator = new WorkflowOrchestrator();

    await expect(orchestrator.executeWorkflow("wf-1", { prompt: "start" })).rejects.toThrow(
      "provider timeout"
    );

    expect(storageMock.updateExecution).toHaveBeenCalledWith(
      "exec-1",
      expect.objectContaining({
        status: "error",
        error: "provider timeout",
      })
    );
    expect(versionManagerMock.updateVersionStats).toHaveBeenCalledWith(
      "wf-1",
      false,
      expect.any(Number)
    );
    expect(wsManagerMock.emitExecutionFailed).toHaveBeenCalledWith("exec-1", "provider timeout");
  });

  it("blocks concurrent execution attempts for the same workflow", async () => {
    storageMock.getWorkflowById.mockResolvedValue({
      id: "wf-1",
      userId: "user-1",
      name: "Single node workflow",
      nodes: [{ id: "n1", type: "agent", data: {}, position: { x: 0, y: 0 } }],
      edges: [],
    });
    storageMock.getAgentsByWorkflowId.mockResolvedValue([
      {
        id: "a1",
        workflowId: "wf-1",
        nodeId: "n1",
        name: "Agent 1",
        role: "coder",
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 70,
        maxTokens: 1000,
      },
    ]);

    let resolveFirst: (() => void) | undefined;
    aiExecutorMock.executeAgent.mockReset().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = () => resolve({ content: "done", tokenCount: 10, finishReason: "stop" });
        })
    );

    const orchestrator = new WorkflowOrchestrator();

    const firstExecution = orchestrator.executeWorkflow("wf-1", { prompt: "start" });
    await waitForCondition(() => typeof resolveFirst === "function");

    await expect(orchestrator.executeWorkflow("wf-1", { prompt: "again" })).rejects.toThrow(
      "Workflow wf-1 is already running"
    );

    resolveFirst?.();
    await expect(firstExecution).resolves.toBeDefined();
  });
});
