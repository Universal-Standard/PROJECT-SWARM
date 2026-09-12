import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowVersionManager } from "../workflow-version";

vi.mock("../../db", () => ({
  db: {
    update: vi.fn(),
    transaction: vi.fn(),
    query: {
      workflowVersions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      workflows: {
        findFirst: vi.fn(),
      },
      agents: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe("WorkflowVersionManager minimal behaviors", () => {
  const workflowId = "wf_1";
  const versionId = "ver_1";
  let manager: WorkflowVersionManager;

  beforeEach(() => {
    manager = new WorkflowVersionManager();
    vi.clearAllMocks();
  });

  it("clears tag when empty value is passed", async () => {
    const { db } = await import("../../db");
    vi.mocked(db.query.workflowVersions.findFirst).mockResolvedValueOnce({
      id: versionId,
      workflowId,
    } as never);

    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    vi.mocked(db.update).mockReturnValue({ set } as never);

    await manager.tagVersion(versionId, "   ");

    expect(set).toHaveBeenCalledWith({ tag: null });
  });

  it("updates execution stats for the active version", async () => {
    const { db } = await import("../../db");
    const execute = vi.fn().mockResolvedValue({
      rows: [
        {
          id: versionId,
          execution_count: 4,
          success_count: 3,
          success_rate: 75,
          avg_duration: 4000,
        },
      ],
    });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback({
        execute,
        update,
      } as never);
    });

    await manager.updateVersionStats(workflowId, true, 5000);

    expect(set).toHaveBeenCalledWith({
      executionCount: 5,
      successCount: 4,
      successRate: 80,
      avgDuration: 4200,
    });
  });

  it("keeps rounded historical success rate stable across updates", async () => {
    const { db } = await import("../../db");
    const execute = vi.fn().mockResolvedValue({
      rows: [
        {
          id: "ver_round",
          execution_count: 3,
          success_count: 2,
          success_rate: 67,
          avg_duration: 3000,
        },
      ],
    });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback({
        execute,
        update,
      } as never);
    });

    await manager.updateVersionStats(workflowId, true, 3000);

    expect(set).toHaveBeenCalledWith({
      executionCount: 4,
      successCount: 3,
      successRate: 75,
      avgDuration: 3000,
    });
  });

  it("updates success rate for failed executions", async () => {
    const { db } = await import("../../db");
    const execute = vi.fn().mockResolvedValue({
      rows: [
        {
          id: "ver_fail",
          execution_count: 2,
          success_count: 2,
          success_rate: 100,
          avg_duration: 3000,
        },
      ],
    });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback({
        execute,
        update,
      } as never);
    });

    await manager.updateVersionStats(workflowId, false, 1000);

    expect(set).toHaveBeenCalledWith({
      executionCount: 3,
      successCount: 2,
      successRate: 67,
      avgDuration: 2333,
    });
  });

  it("returns early when no active version exists", async () => {
    const { db } = await import("../../db");
    const execute = vi.fn().mockResolvedValue({ rows: [] });
    const update = vi.fn();

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback({
        execute,
        update,
      } as never);
    });

    await manager.updateVersionStats(workflowId, true, 1000);

    expect(update).not.toHaveBeenCalled();
  });
});
