import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkflowSchedule } from "@shared/schema";
import { WorkflowScheduler } from "../scheduler";

const mocks = vi.hoisted(() => {
  const findMany = vi.fn();
  const findFirst = vi.fn();
  const insertReturning = vi.fn();
  const updateReturning = vi.fn();
  const deleteWhere = vi.fn();
  const executeWorkflow = vi.fn();
  const validate = vi.fn();
  const schedule = vi.fn();

  return {
    db: {
      query: {
        workflowSchedules: {
          findMany,
          findFirst,
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: insertReturning,
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: updateReturning,
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: deleteWhere,
      })),
    },
    findMany,
    findFirst,
    insertReturning,
    updateReturning,
    deleteWhere,
    executeWorkflow,
    validate,
    schedule,
  };
});

vi.mock("../../db", () => ({ db: mocks.db }));
vi.mock("../../ai/orchestrator", () => ({
  orchestrator: { executeWorkflow: mocks.executeWorkflow },
}));
vi.mock("node-cron", () => ({
  default: {
    validate: mocks.validate,
    schedule: mocks.schedule,
  },
}));

function createSchedule(overrides: Partial<WorkflowSchedule> = {}): WorkflowSchedule {
  return {
    id: "schedule-1",
    workflowId: "workflow-1",
    cronExpression: "0 9 * * *",
    timezone: "UTC",
    enabled: true,
    lastRun: null,
    nextRun: new Date("2026-01-01T09:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("WorkflowScheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMany.mockResolvedValue([]);
    mocks.findFirst.mockResolvedValue(createSchedule());
    mocks.insertReturning.mockResolvedValue([createSchedule()]);
    mocks.updateReturning.mockResolvedValue([createSchedule()]);
    mocks.deleteWhere.mockResolvedValue(undefined);
    mocks.executeWorkflow.mockResolvedValue(undefined);
    mocks.validate.mockReturnValue(true);
    mocks.schedule.mockReturnValue({
      stop: vi.fn(),
      start: vi.fn(),
    });
  });

  it("rejects invalid cron expressions", async () => {
    const scheduler = new WorkflowScheduler();
    mocks.validate.mockReturnValue(false);

    await expect(
      scheduler.createSchedule({
        workflowId: "workflow-1",
        cronExpression: "invalid",
        timezone: "UTC",
      })
    ).rejects.toThrow("Invalid cron expression");
    expect(mocks.insertReturning).not.toHaveBeenCalled();
  });

  it("schedules enabled workflows when creating a schedule", async () => {
    const scheduler = new WorkflowScheduler();
    const scheduled = createSchedule();
    mocks.insertReturning.mockResolvedValue([scheduled]);

    const created = await scheduler.createSchedule({
      workflowId: scheduled.workflowId,
      cronExpression: scheduled.cronExpression,
      timezone: scheduled.timezone,
      enabled: true,
    });

    expect(created.id).toBe(scheduled.id);
    expect(mocks.schedule).toHaveBeenCalledWith(scheduled.cronExpression, expect.any(Function));
  });

  it("reschedules an existing job on update", async () => {
    const scheduler = new WorkflowScheduler();
    const initial = createSchedule();
    const updated = createSchedule({ cronExpression: "0 10 * * *" });
    const stop = vi.fn();
    mocks.schedule.mockReturnValueOnce({ stop, start: vi.fn() }).mockReturnValueOnce({
      stop: vi.fn(),
      start: vi.fn(),
    });
    mocks.insertReturning.mockResolvedValue([initial]);
    mocks.findFirst.mockResolvedValue(initial);
    mocks.updateReturning.mockResolvedValue([updated]);

    await scheduler.createSchedule({
      workflowId: initial.workflowId,
      cronExpression: initial.cronExpression,
      timezone: initial.timezone,
      enabled: true,
    });

    await scheduler.updateSchedule(initial.id, { cronExpression: updated.cronExpression });

    expect(stop).toHaveBeenCalledTimes(1);
    expect(mocks.schedule).toHaveBeenCalledTimes(2);
    expect(mocks.schedule).toHaveBeenLastCalledWith(updated.cronExpression, expect.any(Function));
  });

  it("loads enabled schedules during initialization", async () => {
    const scheduler = new WorkflowScheduler();
    mocks.findMany.mockResolvedValue([
      createSchedule({ id: "schedule-a", workflowId: "wf-a" }),
      createSchedule({ id: "schedule-b", workflowId: "wf-b", cronExpression: "0 12 * * *" }),
    ]);

    await scheduler.initialize();

    expect(mocks.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.schedule).toHaveBeenCalledTimes(2);
  });

  it("returns sequential upcoming run times", () => {
    const scheduler = new WorkflowScheduler();

    const runTimes = scheduler.getNextRunTimes("*/15 * * * *", "UTC", 4);

    expect(runTimes).toHaveLength(4);
    expect(runTimes[1].getTime() - runTimes[0].getTime()).toBe(15 * 60 * 1000);
    expect(runTimes[2].getTime() - runTimes[1].getTime()).toBe(15 * 60 * 1000);
    expect(runTimes[3].getTime() - runTimes[2].getTime()).toBe(15 * 60 * 1000);
    runTimes.forEach((runTime) => {
      expect(runTime.getUTCMinutes() % 15).toBe(0);
    });
  });
});
