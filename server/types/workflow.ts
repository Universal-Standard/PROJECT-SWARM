// Workflow node structure
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    role?: string;
    description?: string;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    capabilities?: Array<{
      type: string;
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    }>;
    [key: string]: unknown;
  };
}

// Workflow edge structure
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  [key: string]: unknown;
}

// Chat message structure
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

// Settings update structure
export interface UserSettings {
  defaultProvider?: "openai" | "anthropic" | "gemini";
  defaultModel?: string;
  theme?: "light" | "dark" | "system";
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
  executionTimeout?: number;
  autoSaveInterval?: number;
  [key: string]: unknown;
}

// Timeline event structure
export interface TimelineEvent {
  stepIndex: number;
  agentId: string;
  agentName: string;
  startTime: string;
  endTime: string;
  status: "completed" | "error" | "running";
  logs: Array<{
    level: string;
    message: string;
    timestamp: string;
  }>;
  duration?: number;
}
