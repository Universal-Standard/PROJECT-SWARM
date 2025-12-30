import * as cron from "node-cron";
import { storage } from "./storage";
import { orchestrator } from "./ai/orchestrator";
import { logger } from "./lib/logger";

interface ScheduledTask {
  scheduleId: string;
  cronTask: any; // cron.ScheduledTask
}

class WorkflowScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;

  async start() {
    if (this.isRunning) {
      logger.info("Scheduler already running");
      return;
    }

    logger.info("Starting workflow scheduler");
    this.isRunning = true;

    // Load all enabled schedules
    await this.loadSchedules();

    // Check for new/updated schedules every minute
    cron.schedule("* * * * *", async () => {
      await this.loadSchedules();
    });
  }

  async stop() {
    logger.info("Stopping workflow scheduler");
    this.isRunning = false;

    // Stop all scheduled tasks
    const taskEntries = Array.from(this.tasks.entries());
    for (const [scheduleId, task] of taskEntries) {
      task.cronTask.stop();
      this.tasks.delete(scheduleId);
    }
  }

  private async loadSchedules() {
    try {
      const schedules = await storage.getAllEnabledSchedules();

      // Remove tasks that no longer exist or are disabled
      const taskEntries = Array.from(this.tasks.entries());
      for (const [scheduleId, task] of taskEntries) {
        const schedule = schedules.find((s) => s.id === scheduleId);
        if (!schedule) {
          logger.info("Removing schedule", { scheduleId });
          task.cronTask.stop();
          this.tasks.delete(scheduleId);
        }
      }

      // Add or update tasks
      for (const schedule of schedules) {
        const existingTask = this.tasks.get(schedule.id);

        // If task doesn't exist or cron expression changed, create new task
        if (!existingTask) {
          this.scheduleWorkflow(schedule);
        }
      }
    } catch (error) {
      logger.error("Error loading schedules", error);
    }
  }

  private scheduleWorkflow(schedule: any) {
    try {
      // Validate cron expression
      if (!cron.validate(schedule.cronExpression)) {
        logger.error("Invalid cron expression for schedule", {
          scheduleId: schedule.id,
          cronExpression: schedule.cronExpression,
        });
        return;
      }

      logger.info("Scheduling workflow", {
        workflowId: schedule.workflowId,
        cronExpression: schedule.cronExpression,
      });

      const cronTask = cron.schedule(
        schedule.cronExpression,
        async () => {
          await this.executeScheduledWorkflow(schedule);
        },
        {
          timezone: schedule.timezone || "UTC",
        }
      );

      this.tasks.set(schedule.id, {
        scheduleId: schedule.id,
        cronTask,
      });
    } catch (error) {
      logger.error(`Error scheduling workflow ${schedule.workflowId}`, error);
    }
  }

  private async executeScheduledWorkflow(schedule: any) {
    logger.info("Executing scheduled workflow", { workflowId: schedule.workflowId });

    try {
      // Get workflow to find userId
      const workflow = await storage.getWorkflowById(schedule.workflowId);
      if (!workflow) {
        logger.error("Workflow not found", { workflowId: schedule.workflowId });
        return;
      }

      // Execute workflow with empty input
      await orchestrator.executeWorkflow(schedule.workflowId, {});

      // Update last run time
      const now = new Date();
      await storage.updateWorkflowSchedule(schedule.id, {
        lastRun: now,
      });

      logger.info("Successfully executed scheduled workflow", { workflowId: schedule.workflowId });
    } catch (error) {
      logger.error(`Error executing scheduled workflow ${schedule.workflowId}`, error);
    }
  }

  // Manual execution for testing
  async executeScheduleNow(scheduleId: string) {
    const schedule = await storage.getWorkflowScheduleById(scheduleId);
    if (!schedule) {
      throw new Error("Schedule not found");
    }

    await this.executeScheduledWorkflow(schedule);
  }
}

export const scheduler = new WorkflowScheduler();
