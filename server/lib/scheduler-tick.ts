import { CronExpressionParser } from "cron-parser";
import { storage } from "../storage";
import { orchestrator } from "../ai/orchestrator";
import { logger } from "./logger";

interface DueCheckSchedule {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone?: string | null;
  lastRun?: Date | string | null;
}

export interface SchedulerTickResult {
  checked: number;
  executed: string[];
}

/**
 * Serverless-safe replacement for the in-process `node-cron` loop in
 * server/scheduler.ts and server/lib/scheduler.ts.
 *
 * WHY THIS EXISTS:
 * Vercel serverless functions are stateless and torn down between
 * invocations, so `node-cron`'s `setInterval`-based scheduling never
 * fires there — the process that would run the timer doesn't stay alive
 * long enough. This module is invoked instead by an external trigger
 * (Vercel Cron hitting GET /api/cron/tick — see server/routes/cron.ts)
 * and performs a "catch-up" check: for every enabled schedule, it
 * computes the most recent cron fire time <= now and, if that fire time
 * is after the schedule's `lastRun`, executes the workflow once and
 * records the new `lastRun`.
 *
 * IMPORTANT OPERATIONAL CAVEAT:
 * Vercel Cron's minimum interval is once per day on the Hobby plan and
 * once per minute on Pro/Enterprise. A schedule configured to run every
 * 5 minutes will only actually fire as often as your Vercel Cron
 * interval allows — e.g. on Hobby, a 5-minute schedule will only catch
 * up once a day. For sub-daily precision without upgrading to Pro, run
 * this same `runDueSchedules()` function from a small always-on host
 * (Railway/Render) on its own `node-cron` loop instead of relying on
 * Vercel Cron.
 */
export async function runDueSchedules(): Promise<SchedulerTickResult> {
  const schedules = (await storage.getAllEnabledSchedules()) as DueCheckSchedule[];
  const executed: string[] = [];

  for (const schedule of schedules) {
    try {
      if (!isScheduleDue(schedule)) {
        continue;
      }

      logger.info("Executing scheduled workflow (serverless cron tick)", {
        workflowId: schedule.workflowId,
        scheduleId: schedule.id,
      });

      const workflow = await storage.getWorkflowById(schedule.workflowId);
      if (!workflow) {
        logger.error("Workflow not found for schedule; skipping", {
          workflowId: schedule.workflowId,
          scheduleId: schedule.id,
        });
        continue;
      }

      await orchestrator.executeWorkflow(schedule.workflowId, {});

      await storage.updateWorkflowSchedule(schedule.id, {
        lastRun: new Date(),
      });

      executed.push(schedule.id);

      logger.info("Successfully executed scheduled workflow (serverless cron tick)", {
        workflowId: schedule.workflowId,
        scheduleId: schedule.id,
      });
    } catch (error) {
      logger.error(`Error executing scheduled workflow ${schedule.workflowId}`, error);
    }
  }

  return { checked: schedules.length, executed };
}

function isScheduleDue(schedule: DueCheckSchedule): boolean {
  try {
    const interval = CronExpressionParser.parse(schedule.cronExpression, {
      currentDate: new Date(),
      tz: schedule.timezone || "UTC",
    });

    const mostRecentFire = interval.prev().toDate();
    const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : null;

    return !lastRun || mostRecentFire > lastRun;
  } catch (error) {
    logger.error("Invalid cron expression on schedule; skipping", {
      scheduleId: schedule.id,
      cronExpression: schedule.cronExpression,
      error,
    });
    return false;
  }
}
