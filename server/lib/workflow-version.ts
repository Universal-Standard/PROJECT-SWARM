import { db } from "../db";
import { workflowVersions, workflows, agents, type WorkflowVersion } from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import type { WorkflowNode, WorkflowEdge } from "../types/workflow";
import { logger } from "./logger";

interface AgentData {
  id: string;
  name: string;
  role: string;
  description: string | null;
  provider: string;
  model: string;
  systemPrompt: string | null;
  temperature: number | null;
  maxTokens: number | null;
  capabilities: unknown;
  nodeId: string;
  position: unknown;
}

interface WorkflowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  agents: AgentData[];
  name: string;
  description: string | null;
}

interface CreateVersionOptions {
  parentVersionId?: string | null;
  branchName?: string;
  name?: string | null;
  dataOverride?: WorkflowData;
  isActive?: boolean;
}

export class WorkflowVersionManager {
  /**
   * Create a new version of a workflow
   */
  async createVersion(
    workflowId: string,
    userId: string,
    commitMessage?: string,
    options?: CreateVersionOptions
  ): Promise<WorkflowVersion> {
    let workflowData = options?.dataOverride;
    const nextIsActive = options?.isActive ?? true;

    return db.transaction(async (tx) => {
      const workflowLock = await tx.execute(
        sql`SELECT id FROM workflows WHERE id = ${workflowId} FOR UPDATE`
      );
      if (workflowLock.rows.length === 0) {
        throw new Error("Workflow not found");
      }

      // Get latest version number while workflow lock is held
      const latestVersions = await tx.query.workflowVersions.findMany({
        where: eq(workflowVersions.workflowId, workflowId),
        orderBy: [desc(workflowVersions.version)],
        limit: 1,
      });

      const latestVersion = latestVersions[0];
      const newVersionNumber = (latestVersion?.version || 0) + 1;

      if (!workflowData) {
        // Get current workflow data
        const workflow = await tx.query.workflows.findFirst({
          where: eq(workflows.id, workflowId),
        });

        if (!workflow) {
          throw new Error("Workflow not found");
        }

        // Get workflow agents
        const workflowAgents = await tx.query.agents.findMany({
          where: eq(agents.workflowId, workflowId),
        });

        // Prepare workflow data
        workflowData = {
          nodes: workflow.nodes as WorkflowNode[],
          edges: workflow.edges as WorkflowEdge[],
          agents: workflowAgents.map((agent) => ({
            id: agent.id,
            name: agent.name,
            role: agent.role,
            description: agent.description,
            provider: agent.provider,
            model: agent.model,
            systemPrompt: agent.systemPrompt,
            temperature: agent.temperature,
            maxTokens: agent.maxTokens,
            capabilities: agent.capabilities,
            nodeId: agent.nodeId,
            position: agent.position,
          })),
          name: workflow.name,
          description: workflow.description,
        };
      }

      if (nextIsActive) {
        const targetBranchName = options?.branchName ?? latestVersion?.branchName ?? "main";
        await tx
          .update(workflowVersions)
          .set({ isActive: false })
          .where(
            and(
              eq(workflowVersions.workflowId, workflowId),
              eq(workflowVersions.branchName, targetBranchName)
            )
          );
      }

      // Create version
      const [version] = await tx
        .insert(workflowVersions)
        .values({
          workflowId,
          userId,
          version: newVersionNumber,
          commitMessage: commitMessage || `Version ${newVersionNumber}`,
          parentVersionId: options?.parentVersionId ?? latestVersion?.id ?? null,
          branchName: options?.branchName ?? latestVersion?.branchName ?? "main",
          name: options?.name ?? `v${newVersionNumber}`,
          executionCount: 0,
          successCount: 0,
          successRate: 0,
          avgDuration: 0,
          isActive: nextIsActive,
          data: workflowData as unknown,
        })
        .returning();

      return version;
    });
  }

  /**
   * Get all versions for a workflow
   */
  async getVersions(workflowId: string): Promise<WorkflowVersion[]> {
    return await db.query.workflowVersions.findMany({
      where: eq(workflowVersions.workflowId, workflowId),
      orderBy: [desc(workflowVersions.version)],
    });
  }

  /**
   * Get active version for a workflow/branch
   */
  async getActiveVersion(
    workflowId: string,
    branchName?: string
  ): Promise<WorkflowVersion | undefined> {
    const whereClause = branchName
      ? and(
          eq(workflowVersions.workflowId, workflowId),
          eq(workflowVersions.isActive, true),
          eq(workflowVersions.branchName, branchName)
        )
      : and(eq(workflowVersions.workflowId, workflowId), eq(workflowVersions.isActive, true));

    return db.query.workflowVersions.findFirst({
      where: whereClause,
      orderBy: [desc(workflowVersions.version)],
    });
  }

  /**
   * Get a specific version
   */
  async getVersion(versionId: string): Promise<WorkflowVersion | undefined> {
    return await db.query.workflowVersions.findFirst({
      where: eq(workflowVersions.id, versionId),
    });
  }

  /**
   * Restore workflow to a specific version
   */
  async restoreVersion(workflowId: string, versionId: string, userId: string): Promise<void> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error("Version not found");
    }

    if (version.workflowId !== workflowId) {
      throw new Error("Version does not belong to this workflow");
    }

    const workflowData = version.data as WorkflowData;

    // Update workflow
    await db
      .update(workflows)
      .set({
        nodes: workflowData.nodes as unknown,
        edges: workflowData.edges as unknown,
        name: workflowData.name,
        description: workflowData.description,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, workflowId));

    // Delete existing agents
    await db.delete(agents).where(eq(agents.workflowId, workflowId));

    // Recreate agents from version data
    if (workflowData.agents && workflowData.agents.length > 0) {
      for (const agentData of workflowData.agents) {
        await db.insert(agents).values({
          workflowId,
          name: agentData.name,
          role: agentData.role,
          description: agentData.description,
          provider: agentData.provider,
          model: agentData.model,
          systemPrompt: agentData.systemPrompt,
          temperature: agentData.temperature,
          maxTokens: agentData.maxTokens,
          capabilities: agentData.capabilities || [],
          nodeId: agentData.nodeId,
          position: agentData.position,
        });
      }
    }

    // Create a new version marking the restoration
    await this.createVersion(workflowId, userId, `Restored from version ${version.version}`, {
      parentVersionId: version.id,
      branchName: version.branchName,
    });
  }

  /**
   * Compare two versions and return differences
   */
  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{
    version1: WorkflowVersion;
    version2: WorkflowVersion;
    diff: {
      nodesAdded: number;
      nodesRemoved: number;
      nodesModified: number;
      edgesAdded: number;
      edgesRemoved: number;
      agentsAdded: number;
      agentsRemoved: number;
      agentsModified: number;
    };
  }> {
    const version1 = await this.getVersion(versionId1);
    const version2 = await this.getVersion(versionId2);

    if (!version1 || !version2) {
      throw new Error("One or both versions not found");
    }
    if (version1.workflowId !== version2.workflowId) {
      throw new Error("Versions must belong to the same workflow");
    }

    const data1 = version1.data as WorkflowData;
    const data2 = version2.data as WorkflowData;
    const data1Agents = data1.agents || [];
    const data2Agents = data2.agents || [];

    // Calculate differences
    const nodes1Ids = new Set(data1.nodes.map((n) => n.id));
    const nodes2Ids = new Set(data2.nodes.map((n) => n.id));

    const nodesAdded = data2.nodes.filter((n) => !nodes1Ids.has(n.id)).length;
    const nodesRemoved = data1.nodes.filter((n) => !nodes2Ids.has(n.id)).length;
    const nodesModified = data2.nodes.filter((n) => {
      if (!nodes1Ids.has(n.id)) return false;
      const oldNode = data1.nodes.find((on) => on.id === n.id);
      return JSON.stringify(oldNode) !== JSON.stringify(n);
    }).length;

    const edges1Ids = new Set(data1.edges.map((e) => e.id));
    const edges2Ids = new Set(data2.edges.map((e) => e.id));

    const edgesAdded = data2.edges.filter((e) => !edges1Ids.has(e.id)).length;
    const edgesRemoved = data1.edges.filter((e) => !edges2Ids.has(e.id)).length;

    const agents1Ids = new Set(data1Agents.map((a) => a.id));
    const agents2Ids = new Set(data2Agents.map((a) => a.id));

    const agentsAdded = data2Agents.filter((a) => !agents1Ids.has(a.id)).length;
    const agentsRemoved = data1Agents.filter((a) => !agents2Ids.has(a.id)).length;
    const agentsModified = data2Agents.filter((a) => {
      if (!agents1Ids.has(a.id)) return false;
      const oldAgent = data1Agents.find((oa) => oa.id === a.id);
      return JSON.stringify(oldAgent) !== JSON.stringify(a);
    }).length;

    return {
      version1,
      version2,
      diff: {
        nodesAdded,
        nodesRemoved,
        nodesModified,
        edgesAdded,
        edgesRemoved,
        agentsAdded,
        agentsRemoved,
        agentsModified,
      },
    };
  }

  /**
   * Tag a version (e.g., "production", "v1.0", "stable") via commit message update
   */
  async tagVersion(versionId: string, tag: string | null): Promise<void> {
    const version = await this.getVersion(versionId);
    if (!version) throw new Error("Version not found");
    await db
      .update(workflowVersions)
      .set({ tag: tag && tag.trim().length > 0 ? tag : null })
      .where(eq(workflowVersions.id, versionId));
  }

  /**
   * Name a version for easier identification
   */
  async nameVersion(versionId: string, name: string): Promise<void> {
    const version = await this.getVersion(versionId);
    if (!version) throw new Error("Version not found");
    await db.update(workflowVersions).set({ name }).where(eq(workflowVersions.id, versionId));
  }

  /**
   * Branch a workflow from an existing version snapshot
   */
  async createBranch(
    workflowId: string,
    fromVersionId: string,
    userId: string,
    branchName: string,
    commitMessage?: string
  ): Promise<WorkflowVersion> {
    const sourceVersion = await this.getVersion(fromVersionId);
    if (!sourceVersion) {
      throw new Error("Source version not found");
    }

    if (sourceVersion.workflowId !== workflowId) {
      throw new Error("Source version does not belong to this workflow");
    }

    return this.createVersion(
      workflowId,
      userId,
      commitMessage || `Created branch ${branchName} from v${sourceVersion.version}`,
      {
        parentVersionId: sourceVersion.id,
        branchName,
        dataOverride: sourceVersion.data as WorkflowData,
        isActive: true,
      }
    );
  }

  /**
   * Update version statistics after execution
   */
  async updateVersionStats(versionId: string, success: boolean, duration: number): Promise<void> {
    await db.transaction(async (tx) => {
      const result = await tx.execute(sql`
        SELECT id, execution_count, success_count, success_rate, avg_duration
        FROM workflow_versions
        WHERE id = ${versionId}
        LIMIT 1
        FOR UPDATE
      `);
      const currentVersion = result.rows[0] as
        | {
            id: string;
            execution_count: number | string | null;
            success_count: number | string | null;
            success_rate: number | string | null;
            avg_duration: number | string | null;
          }
        | undefined;

      if (!currentVersion) {
        logger.debug("Skipping version stats update because workflow version was not found", {
          versionId,
        });
        return;
      }

      const previousExecutionCount = Number(currentVersion.execution_count ?? 0);
      const previousSuccesses = Number(currentVersion.success_count ?? 0);
      const previousTotalDuration =
        Number(currentVersion.avg_duration ?? 0) * previousExecutionCount;

      const executionCount = previousExecutionCount + 1;
      const successCount = previousSuccesses + (success ? 1 : 0);
      const successRate = Math.round((successCount / executionCount) * 100);
      const avgDuration = Math.round((previousTotalDuration + duration) / executionCount);

      await tx
        .update(workflowVersions)
        .set({
          executionCount,
          successCount,
          successRate,
          avgDuration,
        })
        .where(eq(workflowVersions.id, String(currentVersion.id)));
    });
  }

  /**
   * Export a version as standalone workflow data
   */
  async exportVersion(versionId: string): Promise<WorkflowData> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error("Version not found");
    }

    return version.data as WorkflowData;
  }
}

export const versionManager = new WorkflowVersionManager();
