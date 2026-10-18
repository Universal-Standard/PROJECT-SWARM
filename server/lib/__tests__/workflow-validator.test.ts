import { describe, expect, it } from "vitest";
import type { Agent, Workflow } from "@shared/schema";
import { WorkflowValidationError } from "@shared/errors";
import { workflowValidator } from "../workflow-validator";

function createWorkflow(
  nodes: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    position: { x: number; y: number };
  }>,
  edges: Array<{ id: string; source: string; target: string }>
): Workflow {
  return {
    id: "workflow-1",
    userId: "user-1",
    name: "Test Workflow",
    description: null,
    nodes,
    edges,
    isTemplate: false,
    category: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "agent-1",
    workflowId: "workflow-1",
    name: "Coordinator Agent",
    role: "Coordinator",
    description: null,
    provider: "openai",
    model: "gpt-4o",
    systemPrompt: null,
    temperature: 70,
    maxTokens: 1000,
    capabilities: [],
    topP: null,
    frequencyPenalty: null,
    presencePenalty: null,
    stopSequences: [],
    nodeId: "node-1",
    position: { x: 0, y: 0 },
    createdAt: new Date(),
    ...overrides,
  };
}

describe("workflowValidator", () => {
  it("validates a connected acyclic workflow", () => {
    const workflow = createWorkflow(
      [
        {
          id: "node-1",
          type: "agent",
          data: { role: "Coordinator", provider: "openai", model: "gpt-4o" },
          position: { x: 0, y: 0 },
        },
        {
          id: "node-2",
          type: "agent",
          data: { role: "Coder", provider: "openai", model: "gpt-4o-mini" },
          position: { x: 100, y: 100 },
        },
      ],
      [{ id: "edge-1", source: "node-1", target: "node-2" }]
    );

    const result = workflowValidator.validate(workflow, [
      createAgent({ id: "agent-1", nodeId: "node-1" }),
      createAgent({ id: "agent-2", nodeId: "node-2", name: "Coder Agent", role: "Coder" }),
    ]);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects circular workflow dependencies", () => {
    const workflow = createWorkflow(
      [
        {
          id: "node-1",
          type: "agent",
          data: { role: "Coordinator", provider: "openai", model: "gpt-4o" },
          position: { x: 0, y: 0 },
        },
        {
          id: "node-2",
          type: "agent",
          data: { role: "Coder", provider: "openai", model: "gpt-4o-mini" },
          position: { x: 100, y: 100 },
        },
      ],
      [
        { id: "edge-1", source: "node-1", target: "node-2" },
        { id: "edge-2", source: "node-2", target: "node-1" },
      ]
    );

    const result = workflowValidator.validate(workflow, [
      createAgent({ id: "agent-1", nodeId: "node-1" }),
      createAgent({ id: "agent-2", nodeId: "node-2", name: "Coder Agent", role: "Coder" }),
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "CIRCULAR_DEPENDENCY")).toBe(true);
  });

  it("detects orphan nodes", () => {
    const workflow = createWorkflow(
      [
        {
          id: "node-1",
          type: "agent",
          data: { role: "Coordinator", provider: "openai", model: "gpt-4o" },
          position: { x: 0, y: 0 },
        },
        {
          id: "node-2",
          type: "agent",
          data: { role: "Coder", provider: "openai", model: "gpt-4o-mini" },
          position: { x: 100, y: 100 },
        },
      ],
      []
    );

    const result = workflowValidator.validate(workflow, [
      createAgent({ id: "agent-1", nodeId: "node-1" }),
      createAgent({ id: "agent-2", nodeId: "node-2", name: "Coder Agent", role: "Coder" }),
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "ORPHAN_NODE")).toBe(true);
  });

  it("detects missing agent configuration", () => {
    const workflow = createWorkflow(
      [
        {
          id: "node-1",
          type: "agent",
          data: { role: "Coordinator", provider: "openai", model: "gpt-4o" },
          position: { x: 0, y: 0 },
        },
      ],
      []
    );

    const result = workflowValidator.validate(workflow, []);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "MISSING_AGENT_CONFIGURATION")).toBe(true);
  });

  it("detects incomplete agent configuration fields", () => {
    const workflow = createWorkflow(
      [
        {
          id: "node-1",
          type: "agent",
          data: { role: "Coordinator", provider: "openai", model: "gpt-4o" },
          position: { x: 0, y: 0 },
        },
      ],
      []
    );

    const result = workflowValidator.validate(workflow, [createAgent({ provider: "" })]);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.code === "MISSING_AGENT_PROVIDER")).toBe(true);
  });

  it("throws WorkflowValidationError with details from validateOrThrow", () => {
    const workflow = createWorkflow(
      [
        {
          id: "node-1",
          type: "agent",
          data: { role: "Coordinator", provider: "openai", model: "gpt-4o" },
          position: { x: 0, y: 0 },
        },
      ],
      []
    );

    expect(() => workflowValidator.validateOrThrow(workflow, [])).toThrow(WorkflowValidationError);

    try {
      workflowValidator.validateOrThrow(workflow, []);
    } catch (error) {
      expect(error).toBeInstanceOf(WorkflowValidationError);
      const validationError = error as WorkflowValidationError;
      expect(
        validationError.errors.some((item) => item.code === "MISSING_AGENT_CONFIGURATION")
      ).toBe(true);
    }
  });
});
