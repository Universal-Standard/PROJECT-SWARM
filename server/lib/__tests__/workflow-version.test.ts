import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkflowVersionManager } from "../workflow-version";

// Mock dependencies
vi.mock("../../db", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      workflows: {
        findFirst: vi.fn(),
      },
      agents: {
        findMany: vi.fn(),
      },
      workflowVersions: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
  },
}));

describe("WorkflowVersionManager", () => {
  let versionManager: WorkflowVersionManager;
  const mockWorkflowId = "wf_123";
  const mockUserId = "user_456";
  const mockVersionId1 = "ver_1";
  const mockVersionId2 = "ver_2";

  const mockWorkflow = {
    id: mockWorkflowId,
    name: "Test Workflow",
    description: "A test workflow",
    nodes: [
      { id: "node_1", type: "start", data: {} },
      { id: "node_2", type: "agent", data: { agentId: "agent_1" } },
    ],
    edges: [{ id: "edge_1", source: "node_1", target: "node_2" }],
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAgents = [
    {
      id: "agent_1",
      workflowId: mockWorkflowId,
      name: "Test Agent",
      role: "assistant",
      description: "A test agent",
      provider: "openai",
      model: "gpt-4",
      systemPrompt: "You are a helpful assistant",
      temperature: 0.7,
      maxTokens: 1000,
      capabilities: ["chat"],
      nodeId: "node_2",
      position: { x: 100, y: 100 },
    },
  ];

  beforeEach(() => {
    versionManager = new WorkflowVersionManager();
    vi.clearAllMocks();
  });

  describe("createVersion", () => {
    it("should create first version with version number 1", async () => {
      const { db } = await import("../../db");

      // Mock workflow query
      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);

      // Mock agents query
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);

      // Mock latest version query (no previous versions)
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([]);

      // Mock version insert
      const mockCreatedVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        commitMessage: "Version 1",
        createdBy: mockUserId,
        workflowData: {
          nodes: mockWorkflow.nodes,
          edges: mockWorkflow.edges,
          agents: mockAgents,
          name: mockWorkflow.name,
          description: mockWorkflow.description,
        },
        parentVersionId: null,
        tag: null,
        executionCount: 0,
        successRate: 0,
        avgDuration: 0,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId);

      expect(result.version).toBe(1);
      expect(result.workflowId).toBe(mockWorkflowId);
      expect(result.createdBy).toBe(mockUserId);
      expect(result.commitMessage).toBe("Version 1");
      expect(result.parentVersionId).toBeNull();
    });

    it("should auto-increment version number", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);

      // Mock existing version
      const existingVersion = {
        id: "ver_existing",
        version: 5,
        workflowId: mockWorkflowId,
      };
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([existingVersion] as any);

      const newVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 6,
        commitMessage: "Version 6",
        createdBy: mockUserId,
        parentVersionId: existingVersion.id,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId);

      expect(result.version).toBe(6);
      expect(result.parentVersionId).toBe(existingVersion.id);
    });

    it("should use custom commit message", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([]);

      const customMessage = "Added new validation logic";
      const newVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        commitMessage: customMessage,
        createdBy: mockUserId,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId, customMessage);

      expect(result.commitMessage).toBe(customMessage);
    });

    it("should include workflow data with nodes, edges, and agents", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([]);

      const newVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: mockWorkflow.nodes,
          edges: mockWorkflow.edges,
          agents: mockAgents,
          name: mockWorkflow.name,
          description: mockWorkflow.description,
        },
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId);

      expect(result.workflowData).toBeDefined();
      const data = result.workflowData as any;
      expect(data.nodes).toEqual(mockWorkflow.nodes);
      expect(data.edges).toEqual(mockWorkflow.edges);
      expect(data.agents).toHaveLength(1);
      expect(data.name).toBe(mockWorkflow.name);
    });

    it("should throw error if workflow not found", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(null);

      await expect(versionManager.createVersion("nonexistent_wf", mockUserId)).rejects.toThrow(
        "Workflow not found"
      );
    });

    it("should handle workflow with no agents", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce([]);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([]);

      const newVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: mockWorkflow.nodes,
          edges: mockWorkflow.edges,
          agents: [],
          name: mockWorkflow.name,
          description: mockWorkflow.description,
        },
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId);

      const data = result.workflowData as any;
      expect(data.agents).toEqual([]);
    });
  });

  describe("getVersions", () => {
    it("should retrieve all versions for a workflow ordered by version desc", async () => {
      const { db } = await import("../../db");

      const mockVersions = [
        { id: "ver_3", workflowId: mockWorkflowId, version: 3, createdAt: new Date() },
        { id: "ver_2", workflowId: mockWorkflowId, version: 2, createdAt: new Date() },
        { id: "ver_1", workflowId: mockWorkflowId, version: 1, createdAt: new Date() },
      ];

      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce(mockVersions as any);

      const result = await versionManager.getVersions(mockWorkflowId);

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(3);
      expect(result[1].version).toBe(2);
      expect(result[2].version).toBe(1);
    });

    it("should return empty array if no versions exist", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([]);

      const result = await versionManager.getVersions(mockWorkflowId);

      expect(result).toEqual([]);
    });
  });

  describe("getVersion", () => {
    it("should retrieve a specific version by ID", async () => {
      const { db } = await import("../../db");

      const mockVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        commitMessage: "Version 1",
        workflowData: {},
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(mockVersion as any);

      const result = await versionManager.getVersion(mockVersionId1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockVersionId1);
      expect(result?.version).toBe(1);
    });

    it("should return undefined if version not found", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(undefined);

      const result = await versionManager.getVersion("nonexistent_ver");

      expect(result).toBeUndefined();
    });
  });

  describe("restoreVersion", () => {
    it("should restore workflow to a specific version", async () => {
      const { db } = await import("../../db");

      const mockVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 2,
        workflowData: {
          nodes: mockWorkflow.nodes,
          edges: mockWorkflow.edges,
          agents: mockAgents,
          name: "Restored Workflow",
          description: "Restored description",
        },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(mockVersion as any);

      // Mock workflow update
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      // Mock agent deletion
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as any);

      // Mock for creating restoration version
      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce({
        ...mockWorkflow,
        name: "Restored Workflow",
        description: "Restored description",
      } as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([mockVersion] as any);

      const newVersion = {
        id: "ver_new",
        workflowId: mockWorkflowId,
        version: 3,
        commitMessage: "Restored from version 2",
        createdAt: new Date(),
      };

      // Mock agent insertion (once per agent) and final version insert
      vi.mocked(db.insert)
        .mockReturnValueOnce({
          values: vi.fn().mockResolvedValue(undefined),
        } as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([newVersion]),
          }),
        } as any);

      await versionManager.restoreVersion(mockWorkflowId, mockVersionId1, mockUserId);

      expect(db.update).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
    });

    it("should restore agents from version data", async () => {
      const { db } = await import("../../db");

      const mockVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: mockWorkflow.nodes,
          edges: mockWorkflow.edges,
          agents: mockAgents,
          name: mockWorkflow.name,
          description: mockWorkflow.description,
        },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(mockVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as any);

      // Mock for creating restoration version
      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([mockVersion] as any);

      const insertMock = vi.fn().mockResolvedValue(undefined);

      // Mock agent insertion (once per agent) and final version insert
      vi.mocked(db.insert)
        .mockReturnValueOnce({
          values: insertMock,
        } as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "ver_new", version: 2 }]),
          }),
        } as any);

      await versionManager.restoreVersion(mockWorkflowId, mockVersionId1, mockUserId);

      // Should have inserted agents (once per agent)
      expect(insertMock).toHaveBeenCalled();
    });

    it("should handle restoration of workflow with no agents", async () => {
      const { db } = await import("../../db");

      const mockVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: mockWorkflow.nodes,
          edges: mockWorkflow.edges,
          agents: [],
          name: mockWorkflow.name,
          description: mockWorkflow.description,
        },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(mockVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as any);

      // Mock for creating restoration version
      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce([]);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([mockVersion] as any);

      // Mock final version insert (no agent inserts since agents array is empty)
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "ver_new", version: 2 }]),
        }),
      } as any);

      await versionManager.restoreVersion(mockWorkflowId, mockVersionId1, mockUserId);

      expect(db.delete).toHaveBeenCalled();
    });

    it("should create new version after restoration", async () => {
      const { db } = await import("../../db");

      const mockVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 5,
        workflowData: {
          nodes: mockWorkflow.nodes,
          edges: mockWorkflow.edges,
          agents: mockAgents,
          name: mockWorkflow.name,
          description: mockWorkflow.description,
        },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(mockVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as any);

      // Mock for creating restoration version
      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([
        { ...mockVersion, version: 10 },
      ] as any);

      const restorationVersion = {
        id: "ver_restore",
        workflowId: mockWorkflowId,
        version: 11,
        commitMessage: "Restored from version 5",
        createdAt: new Date(),
      };

      // Mock agent insertion (once per agent) and final version insert
      vi.mocked(db.insert)
        .mockReturnValueOnce({
          values: vi.fn().mockResolvedValue(undefined),
        } as any)
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([restorationVersion]),
          }),
        } as any);

      await versionManager.restoreVersion(mockWorkflowId, mockVersionId1, mockUserId);

      // Should have been called for agents insert and version insert
      expect(db.insert).toHaveBeenCalled();
    });

    it("should throw error if version not found", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(undefined);

      await expect(
        versionManager.restoreVersion(mockWorkflowId, "nonexistent_ver", mockUserId)
      ).rejects.toThrow("Version not found");
    });

    it("should throw error if version belongs to different workflow", async () => {
      const { db } = await import("../../db");

      const wrongVersion = {
        id: mockVersionId1,
        workflowId: "different_wf",
        version: 1,
        workflowData: {},
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(wrongVersion as any);

      await expect(
        versionManager.restoreVersion(mockWorkflowId, mockVersionId1, mockUserId)
      ).rejects.toThrow("Version does not belong to this workflow");
    });
  });

  describe("compareVersions", () => {
    it("should calculate differences between two versions", async () => {
      const { db } = await import("../../db");

      const version1 = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: [
            { id: "node_1", type: "start" },
            { id: "node_2", type: "agent" },
          ],
          edges: [{ id: "edge_1", source: "node_1", target: "node_2" }],
          agents: [{ id: "agent_1", name: "Agent 1" }],
        },
        createdAt: new Date(),
      };

      const version2 = {
        id: mockVersionId2,
        workflowId: mockWorkflowId,
        version: 2,
        workflowData: {
          nodes: [
            { id: "node_1", type: "start" },
            { id: "node_2", type: "agent" },
            { id: "node_3", type: "end" },
          ],
          edges: [
            { id: "edge_1", source: "node_1", target: "node_2" },
            { id: "edge_2", source: "node_2", target: "node_3" },
          ],
          agents: [
            { id: "agent_1", name: "Agent 1" },
            { id: "agent_2", name: "Agent 2" },
          ],
        },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst)
        .mockResolvedValueOnce(version1 as any)
        .mockResolvedValueOnce(version2 as any);

      const result = await versionManager.compareVersions(mockVersionId1, mockVersionId2);

      expect(result.version1.id).toBe(mockVersionId1);
      expect(result.version2.id).toBe(mockVersionId2);
      expect(result.diff.nodesAdded).toBe(1); // node_3 added
      expect(result.diff.nodesRemoved).toBe(0);
      expect(result.diff.edgesAdded).toBe(1); // edge_2 added
      expect(result.diff.edgesRemoved).toBe(0);
      expect(result.diff.agentsAdded).toBe(1); // agent_2 added
      expect(result.diff.agentsRemoved).toBe(0);
    });

    it("should detect removed nodes, edges, and agents", async () => {
      const { db } = await import("../../db");

      const version1 = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: [
            { id: "node_1", type: "start" },
            { id: "node_2", type: "agent" },
            { id: "node_3", type: "end" },
          ],
          edges: [
            { id: "edge_1", source: "node_1", target: "node_2" },
            { id: "edge_2", source: "node_2", target: "node_3" },
          ],
          agents: [
            { id: "agent_1", name: "Agent 1" },
            { id: "agent_2", name: "Agent 2" },
          ],
        },
        createdAt: new Date(),
      };

      const version2 = {
        id: mockVersionId2,
        workflowId: mockWorkflowId,
        version: 2,
        workflowData: {
          nodes: [{ id: "node_1", type: "start" }],
          edges: [],
          agents: [{ id: "agent_1", name: "Agent 1" }],
        },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst)
        .mockResolvedValueOnce(version1 as any)
        .mockResolvedValueOnce(version2 as any);

      const result = await versionManager.compareVersions(mockVersionId1, mockVersionId2);

      expect(result.diff.nodesRemoved).toBe(2); // node_2, node_3 removed
      expect(result.diff.edgesRemoved).toBe(2); // edge_1, edge_2 removed
      expect(result.diff.agentsRemoved).toBe(1); // agent_2 removed
    });

    it("should detect modified nodes and agents", async () => {
      const { db } = await import("../../db");

      const version1 = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: [{ id: "node_1", type: "start", data: { x: 0 } }],
          edges: [],
          agents: [{ id: "agent_1", name: "Agent 1", temperature: 0.5 }],
        },
        createdAt: new Date(),
      };

      const version2 = {
        id: mockVersionId2,
        workflowId: mockWorkflowId,
        version: 2,
        workflowData: {
          nodes: [{ id: "node_1", type: "start", data: { x: 100 } }],
          edges: [],
          agents: [{ id: "agent_1", name: "Agent 1", temperature: 0.7 }],
        },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst)
        .mockResolvedValueOnce(version1 as any)
        .mockResolvedValueOnce(version2 as any);

      const result = await versionManager.compareVersions(mockVersionId1, mockVersionId2);

      expect(result.diff.nodesModified).toBe(1);
      expect(result.diff.agentsModified).toBe(1);
    });

    it("should throw error if first version not found", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(undefined);

      await expect(
        versionManager.compareVersions("nonexistent_ver", mockVersionId2)
      ).rejects.toThrow("One or both versions not found");
    });

    it("should throw error if second version not found", async () => {
      const { db } = await import("../../db");

      const version1 = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: { nodes: [], edges: [], agents: [] },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst)
        .mockResolvedValueOnce(version1 as any)
        .mockResolvedValueOnce(undefined);

      await expect(
        versionManager.compareVersions(mockVersionId1, "nonexistent_ver")
      ).rejects.toThrow("One or both versions not found");
    });

    it("should handle comparison of identical versions", async () => {
      const { db } = await import("../../db");

      const version1 = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: [{ id: "node_1", type: "start" }],
          edges: [{ id: "edge_1", source: "node_1", target: "node_2" }],
          agents: [{ id: "agent_1", name: "Agent 1" }],
        },
        createdAt: new Date(),
      };

      const version2 = {
        id: mockVersionId2,
        workflowId: mockWorkflowId,
        version: 2,
        workflowData: {
          nodes: [{ id: "node_1", type: "start" }],
          edges: [{ id: "edge_1", source: "node_1", target: "node_2" }],
          agents: [{ id: "agent_1", name: "Agent 1" }],
        },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst)
        .mockResolvedValueOnce(version1 as any)
        .mockResolvedValueOnce(version2 as any);

      const result = await versionManager.compareVersions(mockVersionId1, mockVersionId2);

      expect(result.diff.nodesAdded).toBe(0);
      expect(result.diff.nodesRemoved).toBe(0);
      expect(result.diff.nodesModified).toBe(0);
      expect(result.diff.edgesAdded).toBe(0);
      expect(result.diff.edgesRemoved).toBe(0);
      expect(result.diff.agentsAdded).toBe(0);
      expect(result.diff.agentsRemoved).toBe(0);
      expect(result.diff.agentsModified).toBe(0);
    });
  });

  describe("tagVersion", () => {
    it("should tag a version with production label", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await versionManager.tagVersion(mockVersionId1, "production");

      expect(db.update).toHaveBeenCalled();
      const setFn = (db.update as any).mock.results[0].value.set;
      expect(setFn).toHaveBeenCalledWith({ tag: "production" });
    });

    it("should tag a version with semantic version", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await versionManager.tagVersion(mockVersionId1, "v1.0.0");

      const setFn = (db.update as any).mock.results[0].value.set;
      expect(setFn).toHaveBeenCalledWith({ tag: "v1.0.0" });
    });

    it("should tag a version with custom label", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await versionManager.tagVersion(mockVersionId1, "stable-release");

      const setFn = (db.update as any).mock.results[0].value.set;
      expect(setFn).toHaveBeenCalledWith({ tag: "stable-release" });
    });
  });

  describe("updateVersionStats", () => {
    it("should update stats for successful execution", async () => {
      const { db } = await import("../../db");

      const existingVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        executionCount: 0,
        successRate: 0,
        avgDuration: 0,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(existingVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await versionManager.updateVersionStats(mockWorkflowId, true, 5000);

      const setFn = (db.update as any).mock.results[0].value.set;
      expect(setFn).toHaveBeenCalledWith({
        executionCount: 1,
        successRate: 100,
        avgDuration: 5000,
      });
    });

    it("should update stats for failed execution", async () => {
      const { db } = await import("../../db");

      const existingVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        executionCount: 0,
        successRate: 0,
        avgDuration: 0,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(existingVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await versionManager.updateVersionStats(mockWorkflowId, false, 3000);

      const setFn = (db.update as any).mock.results[0].value.set;
      expect(setFn).toHaveBeenCalledWith({
        executionCount: 1,
        successRate: 0,
        avgDuration: 3000,
      });
    });

    it("should calculate correct success rate over multiple executions", async () => {
      const { db } = await import("../../db");

      const existingVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        executionCount: 4,
        successRate: 75, // 3 out of 4 successful
        avgDuration: 4000,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(existingVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      // Adding a successful execution: 4 out of 5 = 80%
      await versionManager.updateVersionStats(mockWorkflowId, true, 5000);

      const setFn = (db.update as any).mock.results[0].value.set;
      const updateCall = setFn.mock.calls[0][0];
      expect(updateCall.executionCount).toBe(5);
      expect(updateCall.successRate).toBe(80);
    });

    it("should calculate correct average duration over multiple executions", async () => {
      const { db } = await import("../../db");

      const existingVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        executionCount: 3,
        successRate: 100,
        avgDuration: 4000,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(existingVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      // Adding execution with 8000ms duration
      // New average: ((4000 * 3) + 8000) / 4 = 20000 / 4 = 5000
      await versionManager.updateVersionStats(mockWorkflowId, true, 8000);

      const setFn = (db.update as any).mock.results[0].value.set;
      const updateCall = setFn.mock.calls[0][0];
      expect(updateCall.avgDuration).toBe(5000);
    });

    it("should handle first execution starting from zero", async () => {
      const { db } = await import("../../db");

      const existingVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        executionCount: 0,
        successRate: 0,
        avgDuration: 0,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(existingVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await versionManager.updateVersionStats(mockWorkflowId, true, 3000);

      const setFn = (db.update as any).mock.results[0].value.set;
      expect(setFn).toHaveBeenCalledWith({
        executionCount: 1,
        successRate: 100,
        avgDuration: 3000,
      });
    });

    it("should not update if no version exists", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(undefined);

      await versionManager.updateVersionStats(mockWorkflowId, true, 5000);

      expect(db.update).not.toHaveBeenCalled();
    });

    it("should handle null initial stats", async () => {
      const { db } = await import("../../db");

      const existingVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        executionCount: null,
        successRate: null,
        avgDuration: null,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(existingVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await versionManager.updateVersionStats(mockWorkflowId, true, 4000);

      const setFn = (db.update as any).mock.results[0].value.set;
      expect(setFn).toHaveBeenCalledWith({
        executionCount: 1,
        successRate: 100,
        avgDuration: 4000,
      });
    });
  });

  describe("exportVersion", () => {
    it("should export version as standalone workflow data", async () => {
      const { db } = await import("../../db");

      const mockVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: mockWorkflow.nodes,
          edges: mockWorkflow.edges,
          agents: mockAgents,
          name: mockWorkflow.name,
          description: mockWorkflow.description,
        },
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(mockVersion as any);

      const result = await versionManager.exportVersion(mockVersionId1);

      expect(result).toBeDefined();
      expect(result.nodes).toEqual(mockWorkflow.nodes);
      expect(result.edges).toEqual(mockWorkflow.edges);
      expect(result.agents).toEqual(mockAgents);
      expect(result.name).toBe(mockWorkflow.name);
      expect(result.description).toBe(mockWorkflow.description);
    });

    it("should throw error if version not found", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(undefined);

      await expect(versionManager.exportVersion("nonexistent_ver")).rejects.toThrow(
        "Version not found"
      );
    });

    it("should export complete workflow structure", async () => {
      const { db } = await import("../../db");

      const complexWorkflowData = {
        nodes: [
          { id: "node_1", type: "start", data: { label: "Start" } },
          { id: "node_2", type: "agent", data: { agentId: "agent_1" } },
          { id: "node_3", type: "condition", data: { expression: "x > 10" } },
          { id: "node_4", type: "end", data: { label: "End" } },
        ],
        edges: [
          { id: "edge_1", source: "node_1", target: "node_2" },
          { id: "edge_2", source: "node_2", target: "node_3" },
          { id: "edge_3", source: "node_3", target: "node_4" },
        ],
        agents: [
          {
            id: "agent_1",
            name: "Main Agent",
            role: "assistant",
            description: "Primary processing agent",
            provider: "openai",
            model: "gpt-4",
            systemPrompt: "You are helpful",
            temperature: 0.7,
            maxTokens: 2000,
            capabilities: ["chat", "tools"],
            nodeId: "node_2",
            position: { x: 200, y: 100 },
          },
        ],
        name: "Complex Workflow",
        description: "A complex multi-step workflow",
      };

      const mockVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: complexWorkflowData,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(mockVersion as any);

      const result = await versionManager.exportVersion(mockVersionId1);

      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(3);
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].capabilities).toEqual(["chat", "tools"]);
    });
  });

  describe("parent-child version relationships", () => {
    it("should track parent version when creating new version", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);

      const parentVersion = {
        id: "ver_parent",
        workflowId: mockWorkflowId,
        version: 3,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([parentVersion] as any);

      const newVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 4,
        parentVersionId: "ver_parent",
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId);

      expect(result.parentVersionId).toBe("ver_parent");
    });

    it("should set null parent for first version", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([]);

      const newVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        parentVersionId: null,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId);

      expect(result.parentVersionId).toBeNull();
    });

    it("should create version chain through multiple updates", async () => {
      const { db } = await import("../../db");

      // Version 1
      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([]);

      const version1 = {
        id: "ver_1",
        workflowId: mockWorkflowId,
        version: 1,
        parentVersionId: null,
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([version1]),
        }),
      } as any);

      const v1 = await versionManager.createVersion(mockWorkflowId, mockUserId);
      expect(v1.parentVersionId).toBeNull();

      // Version 2
      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([version1] as any);

      const version2 = {
        id: "ver_2",
        workflowId: mockWorkflowId,
        version: 2,
        parentVersionId: "ver_1",
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([version2]),
        }),
      } as any);

      const v2 = await versionManager.createVersion(mockWorkflowId, mockUserId);
      expect(v2.parentVersionId).toBe("ver_1");
    });
  });

  describe("edge cases", () => {
    it("should handle workflow with empty nodes array", async () => {
      const { db } = await import("../../db");

      const emptyWorkflow = {
        ...mockWorkflow,
        nodes: [],
        edges: [],
      };

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(emptyWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce([]);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([]);

      const newVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: [],
          edges: [],
          agents: [],
          name: emptyWorkflow.name,
          description: emptyWorkflow.description,
        },
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId);

      const data = result.workflowData as any;
      expect(data.nodes).toEqual([]);
      expect(data.edges).toEqual([]);
    });

    it("should handle workflow with null description", async () => {
      const { db } = await import("../../db");

      const workflowWithNullDesc = {
        ...mockWorkflow,
        description: null,
      };

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(workflowWithNullDesc as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);
      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([]);

      const newVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        workflowData: {
          nodes: mockWorkflow.nodes,
          edges: mockWorkflow.edges,
          agents: mockAgents,
          name: mockWorkflow.name,
          description: null,
        },
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId);

      const data = result.workflowData as any;
      expect(data.description).toBeNull();
    });

    it("should round calculated statistics to integers", async () => {
      const { db } = await import("../../db");

      const existingVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 1,
        executionCount: 3,
        successRate: 66, // 2/3
        avgDuration: 3333,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce(existingVersion as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await versionManager.updateVersionStats(mockWorkflowId, true, 5000);

      const setFn = (db.update as any).mock.results[0].value.set;
      const updateCall = setFn.mock.calls[0][0];

      expect(Number.isInteger(updateCall.executionCount)).toBe(true);
      expect(Number.isInteger(updateCall.successRate)).toBe(true);
      expect(Number.isInteger(updateCall.avgDuration)).toBe(true);
    });

    it("should handle very large version numbers", async () => {
      const { db } = await import("../../db");

      vi.mocked(db.query.workflows.findFirst).mockResolvedValueOnce(mockWorkflow as any);
      vi.mocked(db.query.agents.findMany).mockResolvedValueOnce(mockAgents as any);

      const highVersion = {
        id: "ver_999",
        workflowId: mockWorkflowId,
        version: 9999,
        createdAt: new Date(),
      };

      vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([highVersion] as any);

      const newVersion = {
        id: mockVersionId1,
        workflowId: mockWorkflowId,
        version: 10000,
        parentVersionId: "ver_999",
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newVersion]),
        }),
      } as any);

      const result = await versionManager.createVersion(mockWorkflowId, mockUserId);

      expect(result.version).toBe(10000);
    });
  });
});
