export interface ApiClient {
  // Auth
  getUser(): Promise<User | null>;

  // Workflows
  listWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow>;
  createWorkflow(data: CreateWorkflowInput): Promise<Workflow>;
  updateWorkflow(id: string, data: Partial<CreateWorkflowInput>): Promise<Workflow>;
  deleteWorkflow(id: string): Promise<void>;

  // Executions
  createExecution(workflowId: string, input: unknown): Promise<Execution>;
  getExecution(id: string): Promise<Execution>;
  listExecutions(workflowId?: string): Promise<Execution[]>;

  // Costs
  getCosts(period?: string): Promise<CostSummary>;

  // Agent messages
  saveAgentMessage(executionId: string, agentId: string, role: string, content: string): Promise<void>;
}

export interface User { id: string; username: string; avatarUrl?: string; email?: string; }
export interface Workflow { id: string; name: string; description?: string; nodes: unknown[]; edges: unknown[]; createdAt: string; updatedAt: string; }
export interface Execution { id: string; workflowId: string; status: string; input?: unknown; output?: unknown; startedAt: string; completedAt?: string; }
export interface CostSummary { totalCostUsd: number; byProvider: Record<string, number>; byModel: Record<string, number>; }
export type CreateWorkflowInput = Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>;
