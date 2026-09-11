import cron, { type ScheduledTask } from "node-cron";
import { db } from "../db";
import {
  workflowSchedules,
  type WorkflowSchedule,
  type InsertWorkflowSchedule,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { orchestrator } from "../ai/orchestrator";
import { logger } from "./logger";

interface ScheduleJob {
  scheduleId: string;
  cronTask: ScheduledTask;
}

export class WorkflowScheduler {
  private jobs: Map<string, ScheduleJob> = new Map();
  private initialized = false;

  /**
   * Initialize scheduler and load all active schedules
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info("Initializing workflow scheduler");

    const schedules = await db.query.workflowSchedules.findMany({
      where: eq(workflowSchedules.enabled, true),
    });

    for (const schedule of schedules) {
      try {
        await this.scheduleWorkflow(schedule);
        logger.info("Scheduled workflow", {
          workflowId: schedule.workflowId,
          cronExpression: schedule.cronExpression,
        });
      } catch (error) {
        logger.error(`Error scheduling workflow ${schedule.workflowId}`, error);
      }
    }

    this.initialized = true;
    logger.info("Scheduler initialized", { activeSchedules: this.jobs.size });
  }

  /**
   * Create a new schedule
   */
  async createSchedule(data: InsertWorkflowSchedule): Promise<WorkflowSchedule> {
    // Validate cron expression
    if (!cron.validate(data.cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    // Calculate next run time
    const nextRun = this.getNextRunTime(data.cronExpression, data.timezone || "UTC");

    const [schedule] = await db
      .insert(workflowSchedules)
      .values({
        ...data,
        nextRun,
      })
      .returning();

    // Schedule the job if enabled
    if (schedule.enabled) {
      await this.scheduleWorkflow(schedule);
    }

    return schedule;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<InsertWorkflowSchedule>
  ): Promise<WorkflowSchedule> {
    // If cron expression is being updated, validate it
    if (updates.cronExpression && !cron.validate(updates.cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    // Calculate new next run time if cron or timezone changed
    let nextRun: Date | undefined;
    if (updates.cronExpression || updates.timezone) {
      const schedule = await db.query.workflowSchedules.findFirst({
        where: eq(workflowSchedules.id, scheduleId),
      });
      if (schedule) {
        nextRun = this.getNextRunTime(
          updates.cronExpression || schedule.cronExpression,
          updates.timezone || schedule.timezone
        );
      }
    }

    const [updated] = await db
      .update(workflowSchedules)
      .set({
        ...updates,
        ...(nextRun && { nextRun }),
        updatedAt: new Date(),
      })
      .where(eq(workflowSchedules.id, scheduleId))
      .returning();

    // Reschedule the job
    this.unscheduleWorkflow(scheduleId);
    if (updated.enabled) {
      await this.scheduleWorkflow(updated);
    }

    return updated;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    this.unscheduleWorkflow(scheduleId);
    await db.delete(workflowSchedules).where(eq(workflowSchedules.id, scheduleId));
  }

  /**
   * Get all schedules for a workflow
   */
  async getSchedules(workflowId: string): Promise<WorkflowSchedule[]> {
    return await db.query.workflowSchedules.findMany({
      where: eq(workflowSchedules.workflowId, workflowId),
    });
  }

  /**
   * Schedule a workflow execution
   */
  private async scheduleWorkflow(schedule: WorkflowSchedule): Promise<void> {
    const task = cron.schedule(schedule.cronExpression, async () => {
      logger.info("Executing scheduled workflow", { workflowId: schedule.workflowId });
      await this.executeScheduledWorkflow(schedule);
    });

    this.jobs.set(schedule.id, {
      scheduleId: schedule.id,
      cronTask: task,
    });
  }

  /**
   * Unschedule a workflow
   */
  private unscheduleWorkflow(scheduleId: string): void {
    const job = this.jobs.get(scheduleId);
    if (job) {
      job.cronTask.stop();
      this.jobs.delete(scheduleId);
      logger.info("Unscheduled workflow", { scheduleId });
    }
  }

  /**
   * Execute a scheduled workflow
   */
  private async executeScheduledWorkflow(schedule: WorkflowSchedule): Promise<void> {
    try {
      // Execute workflow (orchestrator handles execution creation internally)
      await orchestrator.executeWorkflow(schedule.workflowId, {
        scheduled: true,
        scheduleId: schedule.id,
      });

      // Update schedule last run and next run times
      await db
        .update(workflowSchedules)
        .set({
          lastRun: new Date(),
          nextRun: this.getNextRunTime(schedule.cronExpression, schedule.timezone),
          updatedAt: new Date(),
        })
        .where(eq(workflowSchedules.id, schedule.id));

      logger.info("Successfully executed scheduled workflow", {
        workflowId: schedule.workflowId,
      });
    } catch (error) {
      logger.error("Error in scheduled workflow execution", error);
    }
  }

  /**
   * Parse a single cron field into a sorted array of valid values.
   * Supports: * (wildcard), *\/n (step), n (literal), n-m (range), and comma-separated combos.
   */
  private parseCronField(field: string, min: number, max: number): number[] {
    const values = new Set<number>();

    for (const part of field.split(",")) {
      if (part === "*") {
        for (let i = min; i <= max; i++) values.add(i);
      } else if (part.startsWith("*/")) {
        const step = parseInt(part.slice(2), 10);
        if (step > 0) {
          for (let i = min; i <= max; i += step) values.add(i);
        }
      } else if (part.includes("-")) {
        const [startStr, endStr] = part.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        for (let i = Math.max(start, min); i <= Math.min(end, max); i++) values.add(i);
      } else {
        const v = parseInt(part, 10);
        if (v >= min && v <= max) values.add(v);
      }
    }

    return Array.from(values).sort((a, b) => a - b);
  }

  /**
   * Calculate the next run time for a cron expression.
   * Supports standard 5-field cron: minute hour dom month dow
   * @param cronExpression - the cron expression
   * @param _timezone - timezone (reserved for future use)
   * @param after - search for next run after this date (defaults to now)
   */
  private getNextRunTime(cronExpression: string, _timezone: string, after?: Date): Date {
    const fields = cronExpression.trim().split(/\s+/);
    if (fields.length !== 5) {
      return new Date(Date.now() + 60 * 60 * 1000);
    }

    const [minuteField, hourField, domField, monthField, dowField] = fields;
    const validMinutes = this.parseCronField(minuteField, 0, 59);
    const validHours = this.parseCronField(hourField, 0, 23);
    const validMonths = this.parseCronField(monthField, 1, 12);
    // Normalise day-of-week: node-cron treats 7 as Sunday (same as 0)
    const validDows = this.parseCronField(dowField, 0, 7).map((d) => (d === 7 ? 0 : d));
    const hasDomRestriction = domField !== "*";
    const hasDowRestriction = dowField !== "*";
    const validDoms = this.parseCronField(domField, 1, 31);

    // Start searching from the next minute after `after`
    const base = after ?? new Date();
    const candidate = new Date(base);
    candidate.setSeconds(0);
    candidate.setMilliseconds(0);
    candidate.setMinutes(candidate.getMinutes() + 1);

    const limit = new Date(candidate.getTime() + 366 * 24 * 60 * 60 * 1000);

    while (candidate < limit) {
      const month = candidate.getMonth() + 1; // 1–12
      const dom = candidate.getDate();
      const dow = candidate.getDay();
      const hour = candidate.getHours();
      const minute = candidate.getMinutes();

      // Advance past invalid months
      if (!validMonths.includes(month)) {
        candidate.setDate(1);
        candidate.setHours(0);
        candidate.setMinutes(0);
        candidate.setMonth(candidate.getMonth() + 1);
        continue;
      }

      // When both dom and dow are restricted, cron matches if either is satisfied
      const domOk = !hasDomRestriction || validDoms.includes(dom);
      const dowOk = !hasDowRestriction || validDows.includes(dow);
      const dayOk = hasDomRestriction && hasDowRestriction ? domOk || dowOk : domOk && dowOk;

      if (!dayOk) {
        candidate.setDate(candidate.getDate() + 1);
        candidate.setHours(0);
        candidate.setMinutes(0);
        continue;
      }

      // Advance to the next valid hour within the current day
      if (!validHours.includes(hour)) {
        const nextHour = validHours.find((h) => h > hour);
        if (nextHour !== undefined) {
          candidate.setHours(nextHour);
          candidate.setMinutes(validMinutes[0]);
        } else {
          candidate.setDate(candidate.getDate() + 1);
          candidate.setHours(validHours[0]);
          candidate.setMinutes(validMinutes[0]);
        }
        continue;
      }

      // Advance to the next valid minute within the current hour
      if (!validMinutes.includes(minute)) {
        const nextMinute = validMinutes.find((m) => m > minute);
        if (nextMinute !== undefined) {
          candidate.setMinutes(nextMinute);
        } else {
          const nextHour = validHours.find((h) => h > hour);
          if (nextHour !== undefined) {
            candidate.setHours(nextHour);
            candidate.setMinutes(validMinutes[0]);
          } else {
            candidate.setDate(candidate.getDate() + 1);
            candidate.setHours(validHours[0]);
            candidate.setMinutes(validMinutes[0]);
          }
        }
        continue;
      }

      return new Date(candidate);
    }

    // Fallback: should not be reached for valid expressions
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  /**
   * Get next N run times for a cron expression (for UI preview)
   */
  getNextRunTimes(cronExpression: string, timezone: string, count: number = 5): Date[] {
    if (!cron.validate(cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    const runTimes: Date[] = [];
    let after: Date | undefined;

    for (let i = 0; i < count; i++) {
      const next = this.getNextRunTime(cronExpression, timezone, after);
      runTimes.push(next);
      after = next;
    }

    return runTimes;
  }

  /**
   * Pause a schedule
   */
  async pauseSchedule(scheduleId: string): Promise<void> {
    await this.updateSchedule(scheduleId, { enabled: false });
  }

  /**
   * Resume a schedule
   */
  async resumeSchedule(scheduleId: string): Promise<void> {
    await this.updateSchedule(scheduleId, { enabled: true });
  }

  /**
   * Shutdown scheduler and stop all jobs
   */
  shutdown(): void {
    logger.info("Shutting down scheduler");
    for (const [scheduleId, job] of this.jobs.entries()) {
      job.cronTask.stop();
    }
    this.jobs.clear();
    this.initialized = false;
    logger.info("Scheduler shut down");
  }
}

export const scheduler = new WorkflowScheduler();
