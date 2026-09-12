import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowVersionManager } from "../workflow-version";

vi.mock("../../db", () => ({
  db: {
    update: vi.fn(),
    query: {
      workflowVersions: {
        findFirst: vi.fn(),
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

  it("updates execution stats on latest version", async () => {
    const { db } = await import("../../db");
    vi.mocked(db.query.workflowVersions.findMany).mockResolvedValueOnce([
      {
        id: versionId,
        workflowId,
        version: 2,
        executionCount: 4,
        successRate: 75,
        avgDuration: 4000,
      },
    ] as never);

    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    vi.mocked(db.update).mockReturnValue({ set } as never);

    await manager.updateVersionStats(workflowId, true, 5000);

    expect(set).toHaveBeenCalledWith({
      executionCount: 5,
      successRate: 80,
      avgDuration: 4200,
    });
  });
});
